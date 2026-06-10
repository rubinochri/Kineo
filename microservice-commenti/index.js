const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const Commento = require('./models/Commento');
const Utente = require('./models/Utente');
const Video = require('./models/Video');
const { connectRabbitMQ } = require('./rabbitmq');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user:5007';

async function fetchUserProfiles(userIds) {
  if (!userIds || userIds.length === 0) return {};
  
  const uniqueIds = [...new Set(userIds.map(id => id ? id.toString() : null).filter(Boolean))];
  const profiles = {};
  
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const response = await axios.get(`${USER_SERVICE_URL}/api/user/${id}`);
        profiles[id] = {
          _id: response.data.id || id,
          id: response.data.id || id,
          nome: response.data.nome || 'Utente',
          username: response.data.username || 'Utente',
          email: response.data.email || ''
        };
      } catch (err) {
        console.error(`[API-COMPOSITION] Errore nel recupero profilo per utente ${id}:`, err.message);
        profiles[id] = {
          _id: id,
          id: id,
          nome: 'Utente',
          username: 'Utente',
          email: ''
        };
      }
    })
  );
  
  return profiles;
}

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[COMMENTI] Ricevuta richiesta: ${req.method} ${req.url}`);
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connesso - Microservizio Commenti');
    connectRabbitMQ();
  })
  .catch(errore => console.error('Errore connessione DB Commenti:', errore));

// --- ROTTE ADMIN ---

// GET: Recupera tutti i commenti per la dashboard admin
app.get('/api/comments/all', async (req, res) => {
  try {
    const commenti = await Commento.find()
      .populate('videoId', 'titolo')          
      .sort({ dataCreazione: -1 });           

    const userIds = commenti.map(c => c.utenteId).filter(Boolean);
    const profiles = await fetchUserProfiles(userIds);

    const mappedCommenti = commenti.map(c => {
      const cObj = c.toObject();
      const uId = cObj.utenteId ? cObj.utenteId.toString() : '';
      cObj.utenteId = profiles[uId] || { _id: cObj.utenteId, id: cObj.utenteId, username: 'Utente', email: '' };
      return cObj;
    });

    res.json(mappedCommenti);
  } catch (errore) {
    console.error("Errore fetch all comments (admin):", errore);
    res.status(500).json({ msg: "Errore server" });
  }
});

// DELETE: Eliminazione admin di un commento e risposte associate
app.delete('/api/admin/comments/:id', async (req, res) => {
  try {
    await Commento.findByIdAndDelete(req.params.id); 
    await Commento.deleteMany({ parentCommentoId: req.params.id });
    res.json({ msg: "Commento eliminato dall'admin." });
  } catch (errore) {
    console.error("Errore eliminazione commento (admin):", errore);
    res.status(500).json({ msg: "Errore eliminazione." });
  }
});

// --- ROTTE UTENTE / VIDEO ---

// GET: Recupera tutti i commenti scritti da un utente specifico
app.get('/api/user/:id/commenti', async (req, res) => {
  try {
    const idUtente = req.headers['x-user-id'];
    if (!idUtente) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }
    
    const commenti = await Commento.find({ utenteId: idUtente })
      .populate('videoId', 'titolo') 
      .sort({ dataCreazione: -1 }); 

    res.json(commenti);
  } catch (errore) {
    console.error("Errore fetch commenti utente:", errore);
    res.status(500).json({ msg: 'Errore server nel recupero commenti' });
  }
});

// GET: Recupera i commenti principali di un video con le relative risposte annidate
app.get('/api/commenti/video/:videoId', async (req, res) => {
  try {
    const commentiPrincipali = await Commento.find({ videoId: req.params.videoId, parentCommentoId: null })
      .populate('like', '_id') 
      .sort({ dataCreazione: -1 });
    
    const commentiConRisposte = await Promise.all(
      commentiPrincipali.map(async (commento) => {
        const risposte = await Commento.find({ parentCommentoId: commento._id })
          .populate('like', '_id')
          .sort({ dataCreazione: 1 }); 
        return { ...commento.toObject(), risposte: risposte.map(r => r.toObject()) }; 
      })
    );

    const userIds = [];
    commentiConRisposte.forEach(c => {
      if (c.utenteId) userIds.push(c.utenteId);
      if (c.risposte) {
        c.risposte.forEach(r => {
          if (r.utenteId) userIds.push(r.utenteId);
        });
      }
    });

    const profiles = await fetchUserProfiles(userIds);

    const commentiComposti = commentiConRisposte.map(c => {
      const uId = c.utenteId ? c.utenteId.toString() : '';
      c.utenteId = profiles[uId] || { _id: c.utenteId, id: c.utenteId, nome: 'Utente', username: 'Utente' };
      
      if (c.risposte) {
        c.risposte = c.risposte.map(r => {
          const ruId = r.utenteId ? r.utenteId.toString() : '';
          r.utenteId = profiles[ruId] || { _id: r.utenteId, id: r.utenteId, nome: 'Utente', username: 'Utente' };
          return r;
        });
      }
      return c;
    });

    res.json(commentiComposti);
  } catch (errore) {
    console.error("Errore caricamento commenti video:", errore);
    res.status(500).json({ message: "Errore caricamento commenti." });
  }
});

// --- CRUD COMMENTI ---

// POST: Creazione nuovo commento o risposta
app.post('/api/commenti', async (req, res) => {
  try {
    const { videoId, testo, parentCommentoId } = req.body;
    const utenteId = req.headers['x-user-id'];
    if (!utenteId) return res.status(401).json({ message: "Non autorizzato: X-User-Id mancante." });
    if (!videoId || !testo) return res.status(400).json({ message: "Dati mancanti." });

    const nuovoCommento = new Commento({
      utenteId, 
      videoId, 
      testo: testo.trim(), 
      parentCommentoId: parentCommentoId || null, 
      like: []
    });
    await nuovoCommento.save();
    const commentoCompleto = await Commento.findById(nuovoCommento._id);
    const commentoCompletoObj = commentoCompleto.toObject();
    const profiles = await fetchUserProfiles([commentoCompletoObj.utenteId]);
    const uId = commentoCompletoObj.utenteId ? commentoCompletoObj.utenteId.toString() : '';
    commentoCompletoObj.utenteId = profiles[uId] || { _id: commentoCompletoObj.utenteId, id: commentoCompletoObj.utenteId, nome: 'Utente', username: 'Utente' };
    res.status(201).json(commentoCompletoObj);
  } catch (errore) {
    console.error("Errore creazione commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

// PUT: Modifica del testo di un commento esistente (solo autore)
app.put('/api/commenti/:id', async (req, res) => {
  try {
    const { testo } = req.body;
    const utenteId = req.headers['x-user-id'];
    if (!utenteId) return res.status(401).json({ message: "Non autorizzato: X-User-Id mancante." });
    if (testo === undefined) return res.status(400).json({ message: "Dati mancanti." });

    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });
    
    if (commentoTrovato.utenteId.toString() !== utenteId) return res.status(403).json({ message: "Non autorizzato." });

    commentoTrovato.testo = testo.trim();
    const commentoAggiornato = await commentoTrovato.save();
    const commentoAggiornatoObj = commentoAggiornato.toObject();
    const profiles = await fetchUserProfiles([commentoAggiornatoObj.utenteId]);
    const uId = commentoAggiornatoObj.utenteId ? commentoAggiornatoObj.utenteId.toString() : '';
    commentoAggiornatoObj.utenteId = profiles[uId] || { _id: commentoAggiornatoObj.utenteId, id: commentoAggiornatoObj.utenteId, nome: 'Utente', username: 'Utente' };
    res.json(commentoAggiornatoObj);
  } catch (errore) {
    console.error("Errore modifica commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

// PUT: Gestione like (aggiungi/rimuovi like al commento)
app.put('/api/commenti/:id/like', async (req, res) => {
  try {
    const utenteId = req.headers['x-user-id'];
    if (!utenteId) return res.status(401).json({ message: "Non autorizzato: X-User-Id mancante." });
    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });

    const indiceMiPiace = commentoTrovato.like.indexOf(utenteId);
    if (indiceMiPiace === -1) commentoTrovato.like.push(utenteId); 
    else commentoTrovato.like.splice(indiceMiPiace, 1); 

    const commentoAggiornato = await commentoTrovato.save();
    await commentoAggiornato.populate('like', '_id');
    const commentoAggiornatoObj = commentoAggiornato.toObject();
    const profiles = await fetchUserProfiles([commentoAggiornatoObj.utenteId]);
    const uId = commentoAggiornatoObj.utenteId ? commentoAggiornatoObj.utenteId.toString() : '';
    commentoAggiornatoObj.utenteId = profiles[uId] || { _id: commentoAggiornatoObj.utenteId, id: commentoAggiornatoObj.utenteId, nome: 'Utente', username: 'Utente' };
    res.json(commentoAggiornatoObj);
  } catch (errore) {
    console.error("Errore like commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

// DELETE: Eliminazione di un commento e risposte (solo autore)
app.delete('/api/commenti/:id', async (req, res) => {
  try {
    const utenteId = req.headers['x-user-id'];
    if (!utenteId) return res.status(401).json({ message: "Non autorizzato: X-User-Id mancante." });
    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });
    
    if (commentoTrovato.utenteId.toString() !== utenteId) return res.status(403).json({ message: "Non autorizzato." });

    await Commento.deleteMany({ parentCommentoId: commentoTrovato._id });
    await commentoTrovato.deleteOne();
    res.json({ message: "Commento eliminato." });
  } catch (errore) {
    console.error("Errore eliminazione commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

const PORTA = process.env.PORT || 5006; 
app.listen(PORTA, () => { 
  console.log(`Microservizio Commenti avviato su porta ${PORTA}`);
});
