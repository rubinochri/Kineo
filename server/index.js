// 1. IMPORTAZIONE DELLE LIBRERIE
const express = require('express');   
const mongoose = require('mongoose'); 
const cors = require('cors');         
const bcrypt = require('bcryptjs');   
require('dotenv').config();           

// 2. IMPORTAZIONE DEI MODELLI
const Video = require('./models/Video');
const Utente = require('./models/Utente');
const Dizionario = require('./models/Dizionario');
const Commento = require('./models/Commento');

// Inizializziamo Express
const app = express();

// 3. MIDDLEWARE
app.use(cors());          
app.use(express.json());  

// 4. CONNESSIONE AL DATABASE
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connesso')) 
  .catch(err => console.error('❌ Errore connessione DB:', err)); 

// ---------------------------------------------------------
// 5. API ROUTES
// ---------------------------------------------------------

// --- VIDEO ROUTES (CRUD COMPLETO) ---

// GET: Lista video
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find(); 
    res.json(videos); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Video singolo
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id); 
    if (!video) return res.status(404).json({ message: 'Video non trovato' }); 
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Crea video (Admin) - AGGIORNATO CON SERIE/EPISODIO
app.post('/api/videos', async (req, res) => {
  try {
    const { titolo, url, livelloDifficolta, copertina, descrizione, serie, episodio } = req.body;

    if (!titolo || !url || !livelloDifficolta) {
      return res.status(400).json({ message: "Titolo, URL e Livello Difficoltà sono obbligatori." });
    }

    const nuovoVideo = new Video({
      titolo,
      url,
      livelloDifficolta,
      copertina,
      descrizione,
      serie: serie || '',       // Supporto Serie
      episodio: episodio || '', // Supporto Episodio
      segmenti: [] 
    });

    const videoSalvato = await nuovoVideo.save();
    res.status(201).json(videoSalvato);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH: Aggiorna dati video (Admin)
app.patch('/api/videos/:id', async (req, res) => {
  try {
    const updates = req.body;
    const options = { new: true, runValidators: true }; 

    const videoAggiornato = await Video.findByIdAndUpdate(
      req.params.id,
      updates,
      options
    );

    if (!videoAggiornato) return res.status(404).json({ message: "Video non trovato" });
    res.json(videoAggiornato);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH: Aggiorna segmenti video (Sottotitoli)
app.patch('/api/videos/:id/segmenti', async (req, res) => {
  try {
    const { segmenti } = req.body; 

    if (!Array.isArray(segmenti)) {
      return res.status(400).json({ message: "Il body deve contenere un array 'segmenti'." });
    }

    const videoAggiornato = await Video.findByIdAndUpdate(
      req.params.id,
      { segmenti: segmenti },
      { new: true, runValidators: true } 
    );

    if (!videoAggiornato) return res.status(404).json({ message: 'Video non trovato' });
    res.json(videoAggiornato);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE: Elimina video (Admin)
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const videoCancellato = await Video.findByIdAndDelete(req.params.id);
    if (!videoCancellato) return res.status(404).json({ message: "Video non trovato" });
    res.json({ message: "Video eliminato con successo" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ADMIN DASHBOARD ROUTES (NUOVE) ---

// GET: Lista di TUTTI gli utenti
app.get('/api/users', async (req, res) => {
  try {
    const users = await Utente.find().select('-password').sort({ dataRegistrazione: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// GET: Lista di TUTTI i commenti (per moderazione)
app.get('/api/comments/all', async (req, res) => {
  try {
    const commenti = await Commento.find()
      .populate('utenteId', 'username email')
      .populate('videoId', 'titolo')
      .sort({ dataCreazione: -1 });
    res.json(commenti);
  } catch (err) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// DELETE: Elimina commento (Admin Override)
app.delete('/api/admin/comments/:id', async (req, res) => {
  try {
    await Commento.findByIdAndDelete(req.params.id);
    // Elimina anche eventuali risposte
    await Commento.deleteMany({ parentCommentoId: req.params.id });
    res.json({ msg: "Commento eliminato dall'admin." });
  } catch (err) {
    res.status(500).json({ msg: "Errore eliminazione." });
  }
});

// --- AUTH ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { nome, cognome, username, email, password } = req.body;

    if (!nome || !cognome || !username || !email || !password) {
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori." });
    }

    const utenteEsistente = await Utente.findOne({ email });
    if (utenteEsistente) return res.status(400).json({ msg: "Email già registrata." });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt); 

    const nuovoUtente = new Utente({
      nome, cognome, username, email, password: passwordHash 
    });

    await nuovoUtente.save();
    res.status(201).json({ msg: "Registrazione completata con successo!" });
  } catch (err) {
    console.error("Errore server:", err);
    res.status(500).json({ msg: "Errore interno del server." });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ msg: "Inserisci email e password." });

    const user = await Utente.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Credenziali non valide." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Credenziali non valide." });

    res.json({
      msg: "Login effettuato con successo!",
      user: {
        id: user._id,
        nome: user.nome,
        username: user.username,
        email: user.email,
        ruolo: user.ruolo
      }
    });
  } catch (err) {
    console.error("Errore Login:", err);
    res.status(500).json({ msg: "Errore server." });
  }
});

// --- UTENTI (CRUD & DIZIONARIO) ---

app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await Utente.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Utente non trovato." });

    res.json({
      id: user._id,
      nome: user.nome,
      cognome: user.cognome,
      username: user.username,
      email: user.email,
      ruolo: user.ruolo,
      dataRegistrazione: user.dataRegistrazione
    });
  } catch (err) {
    res.status(500).json({ msg: "Errore server." });
  }
});

// PUT User
app.put('/api/user/:id', async (req, res) => {
  try {
    const { nome, cognome, username, email } = req.body;
    if (!nome || !cognome || !username || !email) return res.status(400).json({ msg: "Campi obbligatori." });

    const emailEsistente = await Utente.findOne({ email: email, _id: { $ne: req.params.id } });
    if (emailEsistente) return res.status(400).json({ msg: "Email già in uso." });

    const userAggiornato = await Utente.findByIdAndUpdate(
      req.params.id,
      { nome, cognome, username, email },
      { new: true, runValidators: true }
    );

    if (!userAggiornato) return res.status(404).json({ msg: "Utente non trovato." });

    res.json({
      msg: "Dati aggiornati!",
      user: {
        id: userAggiornato._id,
        nome: userAggiornato.nome,
        cognome: userAggiornato.cognome,
        username: userAggiornato.username,
        email: userAggiornato.email,
        ruolo: userAggiornato.ruolo
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Errore server." });
  }
});

// DELETE User
app.delete('/api/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await Utente.findById(userId);
    if (!user) return res.status(404).json({ msg: "Utente non trovato." });

    await Commento.deleteMany({ utenteId: userId });
    await Utente.findByIdAndDelete(userId);
    res.json({ msg: "Profilo eliminato." });
  } catch (err) {
    res.status(500).json({ msg: "Errore server." });
  }
});

// Dizionario GET
app.get('/api/user/:id/dizionario', async (req, res) => {
  try {
    const user = await Utente.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Utente non trovato" });
    const parole = user.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(parole);
  } catch (err) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// Dizionario POST
app.post('/api/user/:id/dizionario', async (req, res) => {
  try {
    const { original, translation, type, notes, learned } = req.body;
    const user = await Utente.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Utente non trovato" });

    const esisteGia = user.dizionario.find(w => w.original.toLowerCase() === original.toLowerCase());
    if (esisteGia) return res.status(400).json({ msg: "Parola già presente" });

    user.dizionario.push({ original, translation, type, notes: notes || '', learned: learned || false });
    await user.save();

    const paroleAggiornate = user.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(paroleAggiornate);
  } catch (err) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// Dizionario DELETE
app.delete('/api/user/:id/dizionario/:wordId', async (req, res) => {
  try {
    const user = await Utente.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Utente non trovato" });
    user.dizionario.pull({ _id: req.params.wordId });
    await user.save();
    const paroleAggiornate = user.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(paroleAggiornate);
  } catch (err) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// Dizionario PUT (Update)
app.put('/api/user/:id/dizionario/:wordId', async (req, res) => {
    try {
      const { notes, learned } = req.body;
      const { wordId } = req.params;
      const user = await Utente.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "Utente non trovato" });
  
      const parola = user.dizionario.id(wordId);
      if (!parola) return res.status(404).json({ msg: "Parola non trovata" });
  
      if (notes !== undefined) parola.notes = notes;
      if (learned !== undefined) parola.learned = learned;
  
      await user.save();
      const paroleAggiornate = user.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json(paroleAggiornate);
    } catch (err) {
      res.status(500).json({ msg: "Errore server" });
    }
});

// --- ALTRE ROTTE ---

// Traduzione
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Testo mancante" });
    const cleanWord = text.trim().toLowerCase();
    const entry = await Dizionario.findOne({ word: cleanWord });
    if (entry) res.json({ translation: entry.translation });
    else res.json({ translation: "Traduzione non presente nel dizionario demo." });
  } catch (err) {
    res.status(500).json({ message: "Errore dizionario." });
  }
});

// Commenti (Get, Post, Put, Delete, Like)
app.get('/api/commenti/video/:videoId', async (req, res) => {
  try {
    const commenti = await Commento.find({ videoId: req.params.videoId, parentCommentoId: null })
      .populate('utenteId', 'nome username')
      .populate('like', '_id')
      .sort({ dataCreazione: -1 });
    
    const commentiConRisposte = await Promise.all(
      commenti.map(async (commento) => {
        const risposte = await Commento.find({ parentCommentoId: commento._id })
          .populate('utenteId', 'nome username')
          .populate('like', '_id')
          .sort({ dataCreazione: 1 });
        return { ...commento.toObject(), risposte: risposte };
      })
    );
    res.json(commentiConRisposte);
  } catch (err) {
    res.status(500).json({ message: "Errore caricamento commenti." });
  }
});

app.post('/api/commenti', async (req, res) => {
  try {
    const { utenteId, videoId, testo, parentCommentoId } = req.body;
    if (!utenteId || !videoId || !testo) return res.status(400).json({ message: "Dati mancanti." });

    const nuovoCommento = new Commento({
      utenteId, videoId, testo: testo.trim(), parentCommentoId: parentCommentoId || null, like: []
    });
    await nuovoCommento.save();
    const commentoCompleto = await Commento.findById(nuovoCommento._id).populate('utenteId', 'nome username');
    res.status(201).json(commentoCompleto);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/commenti/:id', async (req, res) => {
  try {
    const { utenteId, testo } = req.body;
    if (!utenteId || testo === undefined) return res.status(400).json({ message: "Dati mancanti." });

    const commento = await Commento.findById(req.params.id);
    if (!commento) return res.status(404).json({ message: "Commento non trovato." });
    if (commento.utenteId.toString() !== utenteId) return res.status(403).json({ message: "Non autorizzato." });

    commento.testo = testo.trim();
    const commentoAggiornato = await commento.save();
    await commentoAggiornato.populate('utenteId', 'nome username');
    res.json(commentoAggiornato);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/commenti/:id/like', async (req, res) => {
  try {
    const { utenteId } = req.body;
    if (!utenteId) return res.status(400).json({ message: "Utente mancante." });
    const commento = await Commento.findById(req.params.id);
    if (!commento) return res.status(404).json({ message: "Commento non trovato." });

    const likeIndex = commento.like.indexOf(utenteId);
    if (likeIndex === -1) commento.like.push(utenteId);
    else commento.like.splice(likeIndex, 1);

    const commentoAggiornato = await commento.save();
    await commentoAggiornato.populate('utenteId', 'nome username');
    await commentoAggiornato.populate('like', '_id');
    res.json(commentoAggiornato);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/commenti/:id', async (req, res) => {
  try {
    const { utenteId } = req.body;
    if (!utenteId) return res.status(400).json({ message: "Utente mancante." });
    const commento = await Commento.findById(req.params.id);
    if (!commento) return res.status(404).json({ message: "Commento non trovato." });
    if (commento.utenteId.toString() !== utenteId) return res.status(403).json({ message: "Non autorizzato." });

    await Commento.deleteMany({ parentCommentoId: commento._id });
    await commento.deleteOne();
    res.json({ message: "Commento eliminato." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 6. AVVIO DEL SERVER
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});