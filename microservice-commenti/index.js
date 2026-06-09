const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Commento = require('./models/Commento');
const Utente = require('./models/Utente');
const Video = require('./models/Video');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[COMMENTI] Ricevuta richiesta: ${req.method} ${req.url}`);
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connesso - Microservizio Commenti'))
  .catch(errore => console.error('Errore connessione DB Commenti:', errore));

// --- ROTTE ADMIN ---

// GET: Recupera tutti i commenti per la dashboard admin
app.get('/api/comments/all', async (req, res) => {
  try {
    const commenti = await Commento.find()
      .populate('utenteId', 'username email') 
      .populate('videoId', 'titolo')          
      .sort({ dataCreazione: -1 });           
    res.json(commenti);
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
    const { id } = req.params;
    
    const commenti = await Commento.find({ utenteId: id })
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
      .populate('utenteId', 'nome username') 
      .populate('like', '_id') 
      .sort({ dataCreazione: -1 });
    
    const commentiConRisposte = await Promise.all(
      commentiPrincipali.map(async (commento) => {
        const risposte = await Commento.find({ parentCommentoId: commento._id })
          .populate('utenteId', 'nome username')
          .populate('like', '_id')
          .sort({ dataCreazione: 1 }); 
        return { ...commento.toObject(), risposte: risposte }; 
      })
    );
    res.json(commentiConRisposte);
  } catch (errore) {
    console.error("Errore caricamento commenti video:", errore);
    res.status(500).json({ message: "Errore caricamento commenti." });
  }
});

// --- CRUD COMMENTI ---

// POST: Creazione nuovo commento o risposta
app.post('/api/commenti', async (req, res) => {
  try {
    const { utenteId, videoId, testo, parentCommentoId } = req.body;
    if (!utenteId || !videoId || !testo) return res.status(400).json({ message: "Dati mancanti." });

    const nuovoCommento = new Commento({
      utenteId, 
      videoId, 
      testo: testo.trim(), 
      parentCommentoId: parentCommentoId || null, 
      like: []
    });
    await nuovoCommento.save();
    const commentoCompleto = await Commento.findById(nuovoCommento._id).populate('utenteId', 'nome username');
    res.status(201).json(commentoCompleto);
  } catch (errore) {
    console.error("Errore creazione commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

// PUT: Modifica del testo di un commento esistente (solo autore)
app.put('/api/commenti/:id', async (req, res) => {
  try {
    const { utenteId, testo } = req.body;
    if (!utenteId || testo === undefined) return res.status(400).json({ message: "Dati mancanti." });

    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });
    
    if (commentoTrovato.utenteId.toString() !== utenteId) return res.status(403).json({ message: "Non autorizzato." });

    commentoTrovato.testo = testo.trim();
    const commentoAggiornato = await commentoTrovato.save();
    await commentoAggiornato.populate('utenteId', 'nome username'); 
    res.json(commentoAggiornato);
  } catch (errore) {
    console.error("Errore modifica commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

// PUT: Gestione like (aggiungi/rimuovi like al commento)
app.put('/api/commenti/:id/like', async (req, res) => {
  try {
    const { utenteId } = req.body;
    if (!utenteId) return res.status(400).json({ message: "Utente mancante." });
    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });

    const indiceMiPiace = commentoTrovato.like.indexOf(utenteId);
    if (indiceMiPiace === -1) commentoTrovato.like.push(utenteId); 
    else commentoTrovato.like.splice(indiceMiPiace, 1); 

    const commentoAggiornato = await commentoTrovato.save();
    await commentoAggiornato.populate('utenteId', 'nome username');
    await commentoAggiornato.populate('like', '_id');
    res.json(commentoAggiornato);
  } catch (errore) {
    console.error("Errore like commento:", errore);
    res.status(400).json({ message: errore.message });
  }
});

// DELETE: Eliminazione di un commento e risposte (solo autore)
app.delete('/api/commenti/:id', async (req, res) => {
  try {
    const { utenteId } = req.body;
    if (!utenteId) return res.status(400).json({ message: "Utente mancante." });
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
