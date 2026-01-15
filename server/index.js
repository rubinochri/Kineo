// 1. IMPORTAZIONE DELLE LIBRERIE
const express = require('express');   
const mongoose = require('mongoose'); 
const cors = require('cors');         
const bcrypt = require('bcryptjs');   
require('dotenv').config();           

// 2. IMPORTAZIONE DEI MODELLI (DATABASE)
const Video = require('./models/Video');
const Utente = require('./models/Utente');
// NUOVO: Importiamo il modello del Dizionario
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
// Questa rotta sostituisce quella di Google API
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    
    // Validazione input
    if (!text) return res.status(400).json({ message: "Testo mancante" });

    // Pulizia del testo: togliamo spazi e rendiamo minuscolo
    // Es. "  Bird  " diventa "bird" per trovarlo nel DB
    const cleanWord = text.trim().toLowerCase();

    // Cerchiamo nel nostro Dizionario locale
    const entry = await Dizionario.findOne({ word: cleanWord });

    if (entry) {
      // TROVATO: Restituiamo la traduzione dal DB
      res.json({ translation: entry.translation });
    } else {
      // NON TROVATO: Messaggio standard (senza errori server)
      // Questo simula una risposta "vuota" gestita
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

// --- UTENTI (REGISTRAZIONE) ---

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { nome, cognome, username, email, password } = req.body;

    if (!nome || !cognome || !username || !email || !password) {
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori (inclusi Nome e Cognome)." });
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

// 6. AVVIO DEL SERVER
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});