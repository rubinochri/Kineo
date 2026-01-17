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
const Commento = require('./models/Commento');

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

// GET /api/user/:id (Ottiene i dati completi dell'utente)
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await Utente.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: "Utente non trovato." });
    }

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
    console.error("Errore GET user:", err);
    res.status(500).json({ msg: "Errore server." });
  }
});

// PUT /api/user/:id (Aggiorna i dati dell'utente)
app.put('/api/user/:id', async (req, res) => {
  try {
    const { nome, cognome, username, email } = req.body;

    // Validazione input
    if (!nome || !cognome || !username || !email) {
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori." });
    }

    // Verifica che email non sia già usata da un altro utente
    const emailEsistente = await Utente.findOne({ 
      email: email,
      _id: { $ne: req.params.id } // Esclude l'utente corrente
    });

    if (emailEsistente) {
      return res.status(400).json({ msg: "Email già registrata da un altro utente." });
    }

    // Aggiorna l'utente
    const userAggiornato = await Utente.findByIdAndUpdate(
      req.params.id,
      { nome, cognome, username, email },
      { new: true, runValidators: true }
    );

    if (!userAggiornato) {
      return res.status(404).json({ msg: "Utente non trovato." });
    }

    res.json({
      msg: "Dati aggiornati con successo!",
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
    console.error("Errore PUT user:", err);
    res.status(500).json({ msg: "Errore server." });
  }
});

//AGGIUNTE PER FAR PASSARE PAROLE A DIZIONARIO
// --- DIZIONARIO PERSONALE (Salvataggio su DB) ---

// 1. GET Dizionario: Ottieni tutte le parole salvate dall'utente
app.get('/api/user/:id/dizionario', async (req, res) => {
  try {
    const user = await Utente.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Utente non trovato" });
    
    // Ordina per data (le più recenti in alto)
    const parole = user.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(parole);
  } catch (err) {
    console.error("Errore GET dizionario:", err);
    res.status(500).json({ msg: "Errore server" });
  }
});

// 2. POST Dizionario: Aggiungi una parola
app.post('/api/user/:id/dizionario', async (req, res) => {
  try {
    const { original, translation, type } = req.body;
    
    // Trova l'utente
    const user = await Utente.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Utente non trovato" });

    // Controlla se la parola esiste già (case insensitive)
    const esisteGia = user.dizionario.find(
      w => w.original.toLowerCase() === original.toLowerCase()
    );

    if (esisteGia) {
      return res.status(400).json({ msg: "Parola già presente nel dizionario" });
    }

    // Aggiungi la parola
    user.dizionario.push({ original, translation, type });
    await user.save();

    // Restituisci il dizionario aggiornato
    const paroleAggiornate = user.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(paroleAggiornate);

  } catch (err) {
    console.error("Errore POST dizionario:", err);
    res.status(500).json({ msg: "Errore server" });
  }
});

// 3. DELETE Dizionario: Rimuovi una parola
app.delete('/api/user/:id/dizionario/:wordId', async (req, res) => {
  try {
    const user = await Utente.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Utente non trovato" });

    // Rimuovi la parola dall'array usando il suo ID
    user.dizionario.pull({ _id: req.params.wordId });
    await user.save();

    const paroleAggiornate = user.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(paroleAggiornate);

  } catch (err) {
    console.error("Errore DELETE dizionario:", err);
    res.status(500).json({ msg: "Errore server" });
  }
});

//FINE PARTE PER DIZIONARIO

// --- COMMENTI ---

// GET /api/commenti/video/:videoId (Ottiene tutti i commenti di un video con risposte)
app.get('/api/commenti/video/:videoId', async (req, res) => {
  try {
    const commenti = await Commento.find({ videoId: req.params.videoId, parentCommentoId: null })
      .populate('utenteId', 'nome username')
      .populate('like', '_id')
      .sort({ dataCreazione: -1 });
    
    // Carica le risposte per ogni commento
    const commentiConRisposte = await Promise.all(
      commenti.map(async (commento) => {
        const risposte = await Commento.find({ parentCommentoId: commento._id })
          .populate('utenteId', 'nome username')
          .populate('like', '_id')
          .sort({ dataCreazione: 1 });
        
        return {
          ...commento.toObject(),
          risposte: risposte
        };
      })
    );
    
    res.json(commentiConRisposte);
  } catch (err) {
    console.error("Errore GET commenti:", err);
    res.status(500).json({ message: "Errore durante il caricamento dei commenti." });
  }
});

// POST /api/commenti (Crea un nuovo commento o risposta)
app.post('/api/commenti', async (req, res) => {
  try {
    const { utenteId, videoId, testo, parentCommentoId } = req.body;

    if (!utenteId || !videoId || !testo) {
      return res.status(400).json({ message: "utenteId, videoId e testo sono obbligatori." });
    }

    const nuovoCommento = new Commento({
      utenteId,
      videoId,
      testo: testo.trim(),
      parentCommentoId: parentCommentoId || null,
      like: []
    });

    const commentoSalvato = await nuovoCommento.save();
    
    // Populate dei dati utente per la risposta
    await commentoSalvato.populate('utenteId', 'nome username');
    
    res.status(201).json(commentoSalvato);
  } catch (err) {
    console.error("Errore POST commenti:", err);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/commenti/:id/like (Aggiunge/Rimuove un like)
app.put('/api/commenti/:id/like', async (req, res) => {
  try {
    const { utenteId } = req.body;

    if (!utenteId) {
      return res.status(400).json({ message: "utenteId è obbligatorio." });
    }

    const commento = await Commento.findById(req.params.id);
    if (!commento) {
      return res.status(404).json({ message: "Commento non trovato." });
    }

    // Controlla se l'utente ha già messo like
    const likeIndex = commento.like.indexOf(utenteId);
    
    if (likeIndex === -1) {
      // Aggiungi like
      commento.like.push(utenteId);
    } else {
      // Rimuovi like
      commento.like.splice(likeIndex, 1);
    }

    const commentoAggiornato = await commento.save();
    await commentoAggiornato.populate('utenteId', 'nome username');
    await commentoAggiornato.populate('like', '_id');

    res.json(commentoAggiornato);
  } catch (err) {
    console.error("Errore PUT like commento:", err);
    res.status(400).json({ message: err.message });
  }
});

// 6. AVVIO DEL SERVER
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});