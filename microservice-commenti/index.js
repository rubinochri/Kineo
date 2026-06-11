const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const Commento = require('./models/Commento');
const { connectRabbitMQ } = require('./rabbitmq');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user:5007';

// Inizializzazione Redis Client
const { createClient } = require('redis');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({
  url: REDIS_URL
});

redisClient.on('connect', () => {
  console.log(`[REDIS] Connessione in corso a Redis su ${REDIS_URL}...`);
});

redisClient.on('ready', () => {
  console.log(`[REDIS] Client Redis connesso e pronto per l'uso su ${REDIS_URL}`);
});

redisClient.on('error', (err) => {
  console.error('[REDIS] Errore riscontrato nel Client Redis:', err);
});

// Esegui la connessione all'avvio
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('[REDIS] Errore di connessione iniziale a Redis:', err);
  }
})();

async function fetchUserProfiles(userIds) {
  if (!userIds || userIds.length === 0) return {};
  
  const uniqueIds = [...new Set(userIds.map(id => id ? id.toString() : null).filter(Boolean))];
  const profiles = {};
  
  await Promise.all(
    uniqueIds.map(async (id) => {
      const cacheKey = `user:profile:${id}`;
      let cachedProfile = null;
      
      // Controlla se il profilo dell'utente è già presente in cache su Redis
      try {
        if (redisClient.isOpen) {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
            cachedProfile = JSON.parse(cachedData);
          }
        }
      } catch (err) {
        console.error(`[REDIS-CACHE] Errore nel recupero della chiave ${cacheKey} da Redis:`, err.message);
      }
      
      if (cachedProfile) {
        console.log(`[REDIS-CACHE] Cache Hit per profilo utente ${id}`);
        profiles[id] = cachedProfile;
      } else {
        console.log(`[REDIS-CACHE] Cache Miss per profilo utente ${id}`);
        try {
          const response = await axios.get(`${USER_SERVICE_URL}/api/user/${id}`);
          console.log(`[API-COMPOSITION] Risposta da user-service per ID ${id}:`, JSON.stringify(response.data));
          
          const profileData = {
            _id: response.data.id || response.data._id || id,
            id: response.data.id || response.data._id || id,
            nome: response.data.nome || response.data.name || 'Utente',
            username: response.data.username || response.data.name || 'Utente',
            email: response.data.email || ''
          };
          
          profiles[id] = profileData;
          
          // Salva su Redis con TTL 3600 secondi (1 ora)
          try {
            if (redisClient.isOpen) {
              await redisClient.set(cacheKey, JSON.stringify(profileData), {
                EX: 3600
              });
              console.log(`[REDIS-CACHE] Profilo utente ${id} memorizzato in Redis con TTL 3600s`);
            }
          } catch (cacheErr) {
            console.error(`[REDIS-CACHE] Errore nel salvataggio in cache per utente ${id}:`, cacheErr.message);
          }
          
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
      }
    })
  );
  
  return profiles;
}

async function fetchVideoTitles(videoIds) {
  if (!videoIds || videoIds.length === 0) return {};
  
  const uniqueIds = [...new Set(videoIds.map(id => id ? id.toString() : null).filter(Boolean))];
  const videos = {};
  
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const response = await axios.get(`http://kineo_catalogo:5003/api/videos/${id}`);
        videos[id] = {
          _id: id,
          id: id,
          titolo: response.data.titolo || 'Video'
        };
      } catch (err) {
        console.error(`[API-COMPOSITION] Errore nel recupero video per id ${id}:`, err.message);
        videos[id] = {
          _id: id,
          id: id,
          titolo: 'Video rimosso'
        };
      }
    })
  );
  
  return videos;
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
      .sort({ dataCreazione: -1 });           

    const userIds = commenti.map(c => c.utenteId).filter(Boolean);
    const videoIds = commenti.map(c => c.videoId).filter(Boolean);

    const [profiles, videos] = await Promise.all([
      fetchUserProfiles(userIds),
      fetchVideoTitles(videoIds)
    ]);

    const mappedCommenti = commenti.map(c => {
      const cObj = c.toObject();
      const uId = cObj.utenteId ? cObj.utenteId.toString() : '';
      cObj.utenteId = profiles[uId] || { _id: cObj.utenteId, id: cObj.utenteId, nome: 'Utente', username: 'Utente', email: '' };
      cObj.utente = cObj.utenteId;
      
      const vId = cObj.videoId ? cObj.videoId.toString() : '';
      cObj.videoId = videos[vId] || { _id: cObj.videoId, id: cObj.videoId, titolo: 'Video rimosso' };
      
      cObj.like = (cObj.like || []).map(id => id ? id.toString() : null).filter(Boolean);
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
      .sort({ dataCreazione: -1 }); 

    const videoIds = commenti.map(c => c.videoId).filter(Boolean);
    const videos = await fetchVideoTitles(videoIds);

    const mappedCommenti = commenti.map(c => {
      const cObj = c.toObject();
      const vId = cObj.videoId ? cObj.videoId.toString() : '';
      cObj.videoId = videos[vId] || { _id: cObj.videoId, id: cObj.videoId, titolo: 'Video rimosso' };
      cObj.like = (cObj.like || []).map(id => id ? id.toString() : null).filter(Boolean);
      return cObj;
    });

    res.json(mappedCommenti);
  } catch (errore) {
    console.error("Errore fetch commenti utente:", errore);
    res.status(500).json({ msg: 'Errore server nel recupero commenti' });
  }
});

// GET: Recupera i commenti principali di un video con le relative risposte annidate
app.get('/api/commenti/video/:videoId', async (req, res) => {
  try {
    const commentiPrincipali = await Commento.find({ videoId: req.params.videoId, parentCommentoId: null })
      .sort({ dataCreazione: -1 });
    
    const commentiConRisposte = await Promise.all(
      commentiPrincipali.map(async (commento) => {
        const risposte = await Commento.find({ parentCommentoId: commento._id })
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
      c.utente = c.utenteId;
      c.like = (c.like || []).map(id => id ? id.toString() : null).filter(Boolean);
      
      if (c.risposte) {
        c.risposte = c.risposte.map(r => {
          const ruId = r.utenteId ? r.utenteId.toString() : '';
          r.utenteId = profiles[ruId] || { _id: r.utenteId, id: r.utenteId, nome: 'Utente', username: 'Utente' };
          r.utente = r.utenteId;
          r.like = (r.like || []).map(id => id ? id.toString() : null).filter(Boolean);
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
    const utenteId = req.headers['x-user-id'] || req.body.utenteId;
    if (!utenteId) return res.status(401).json({ message: "Non autorizzato: X-User-Id o utenteId mancante." });
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
    commentoCompletoObj.utente = commentoCompletoObj.utenteId;
    commentoCompletoObj.like = (commentoCompletoObj.like || []).map(id => id ? id.toString() : null).filter(Boolean);
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
    const utenteId = req.headers['x-user-id'] || req.body.utenteId;
    if (!utenteId) return res.status(401).json({ message: "Non autorizzato: X-User-Id o utenteId mancante." });
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
    commentoAggiornatoObj.utente = commentoAggiornatoObj.utenteId;
    commentoAggiornatoObj.like = (commentoAggiornatoObj.like || []).map(id => id ? id.toString() : null).filter(Boolean);
    res.json(commentoAggiornatoObj);
  } catch (errore) {
    console.error("Errore modifica commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

// PUT: Gestione like (aggiungi/rimuovi like al commento)
app.put('/api/commenti/:id/like', async (req, res) => {
  try {
    const utenteId = req.headers['x-user-id'] || req.body.utenteId;
    if (!utenteId) return res.status(401).json({ message: "Non autorizzato: X-User-Id o utenteId mancante." });
    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });

    const indiceMiPiace = commentoTrovato.like.indexOf(utenteId);
    if (indiceMiPiace === -1) commentoTrovato.like.push(utenteId); 
    else commentoTrovato.like.splice(indiceMiPiace, 1); 

    const commentoAggiornato = await commentoTrovato.save();
    const commentoAggiornatoObj = commentoAggiornato.toObject();
    const profiles = await fetchUserProfiles([commentoAggiornatoObj.utenteId]);
    const uId = commentoAggiornatoObj.utenteId ? commentoAggiornatoObj.utenteId.toString() : '';
    commentoAggiornatoObj.utenteId = profiles[uId] || { _id: commentoAggiornatoObj.utenteId, id: commentoAggiornatoObj.utenteId, nome: 'Utente', username: 'Utente' };
    commentoAggiornatoObj.utente = commentoAggiornatoObj.utenteId;
    commentoAggiornatoObj.like = (commentoAggiornatoObj.like || []).map(id => id ? id.toString() : null).filter(Boolean);
    res.json(commentoAggiornatoObj);
  } catch (errore) {
    console.error("Errore like commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

// DELETE: Eliminazione di un commento e risposte (solo autore)
app.delete('/api/commenti/:id', async (req, res) => {
  try {
    const utenteId = req.headers['x-user-id'] || req.body.utenteId;
    if (!utenteId) return res.status(401).json({ message: "Non autorizzato: X-User-Id o utenteId mancante." });
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
