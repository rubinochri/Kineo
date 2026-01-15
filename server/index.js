// 1. IMPORTAZIONE DELLE LIBRERIE
const express = require('express');   
const mongoose = require('mongoose'); 
const cors = require('cors');         
const bcrypt = require('bcryptjs');   
require('dotenv').config();           

// 2. IMPORTAZIONE DEI MODELLI (DATABASE)
const Video = require('./models/Video');
const Utente = require('./models/Utente');
const Dizionario = require('./models/Dizionario');

// Inizializziamo l'applicazione Express
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

// --- TRADUZIONE (DIZIONARIO LOCALE) --- 
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) return res.status(400).json({ message: "Testo mancante" });

    const cleanWord = text.trim().toLowerCase();
    const entry = await Dizionario.findOne({ word: cleanWord });

    if (entry) {
      res.json({ translation: entry.translation });
    } else {
      res.json({ translation: "Traduzione non presente nel dizionario demo." });
    }

  } catch (err) {
    console.error("Errore dizionario:", err);
    res.status(500).json({ message: "Errore durante la ricerca nel dizionario." });
  }
});

// --- VIDEO ---

// PATCH /api/videos/:id/segmenti
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

// GET /api/videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find(); 
    res.json(videos); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/videos/:id
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id); 
    if (!video) return res.status(404).json({ message: 'Video non trovato' }); 
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/videos
app.post('/api/videos', async (req, res) => {
  try {
    const { titolo, url, livelloDifficolta, copertina, descrizione } = req.body;

    if (!titolo || !url || !livelloDifficolta) {
      return res.status(400).json({ message: "Titolo, URL e Livello Difficoltà sono obbligatori." });
    }

    const nuovoVideo = new Video({
      titolo,
      url,
      livelloDifficolta,
      copertina,
      descrizione,
      segmenti: [] 
    });

    const videoSalvato = await nuovoVideo.save();
    res.status(201).json(videoSalvato);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- UTENTI (AUTH) ---

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { nome, cognome, username, email, password } = req.body;

    if (!nome || !cognome || !username || !email || !password) {
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori." });
    }

    const utenteEsistente = await Utente.findOne({ email });
    if (utenteEsistente) {
      return res.status(400).json({ msg: "Email già registrata." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt); 

    const nuovoUtente = new Utente({
      nome,
      cognome,
      username,
      email,
      password: passwordHash 
    });

    await nuovoUtente.save();
    res.status(201).json({ msg: "Registrazione completata con successo!" });

  } catch (err) {
    console.error("Errore server:", err);
    res.status(500).json({ msg: "Errore interno del server." });
  }
});

// POST /api/login (NUOVA ROTTA)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validazione input
    if (!email || !password) {
      return res.status(400).json({ msg: "Inserisci email e password." });
    }

    // 2. Verifica esistenza utente
    const user = await Utente.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Credenziali non valide." });
    }

    // 3. Verifica password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Credenziali non valide." });
    }

    // 4. Login riuscito (Restituisce dati utente)
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

// 6. AVVIO DEL SERVER
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});