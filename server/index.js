// 1. IMPORTAZIONE DELLE LIBRERIE
// 'require' è il comando Node.js per caricare moduli esterni installati con npm.
const express = require('express');   // Il framework web per creare il server e le API.
const mongoose = require('mongoose'); // Libreria (ODM) per interagire con MongoDB in modo semplice.
const cors = require('cors');         // Middleware per la sicurezza: permette al Frontend di parlare con il Backend.
const bcrypt = require('bcryptjs');   // Libreria crittografica per "hashare" (nascondere) le password.
require('dotenv').config();           // Carica le variabili nascoste nel file .env (es. la password del DB).

// 2. IMPORTAZIONE DEI MODELLI (DATABASE)
// Importiamo lo "stampino" (Schema) che definisce come sono fatti i dati nel DB.
const Video = require('./models/Video');
const Utente = require('./models/Utente');

// Inizializziamo l'applicazione Express
const app = express();

// 3. MIDDLEWARE (Funzioni che girano prima di ogni richiesta)
app.use(cors());          // Abilita le chiamate "Cross-Origin" (es. dal Client porta 5173 al Server porta 5001).
app.use(express.json());  // FONDAMENTALE: Dice al server di accettare dati in formato JSON e metterli in 'req.body'.

// 4. CONNESSIONE AL DATABASE
// process.env.MONGODB_URI recupera l'indirizzo segreto dal file .env
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connesso')) // .then() si attiva se la connessione ha successo.
  .catch(err => console.error('❌ Errore connessione DB:', err)); // .catch() cattura eventuali errori.

// ---------------------------------------------------------
// 5. API ROUTES (Le "porte" d'ingresso del server)
// ---------------------------------------------------------

// --- VIDEO ---

// GET /api/videos -> Restituisce la lista di tutti i video
// 'async' indica che la funzione contiene operazioni lente (database) che dobbiamo aspettare.
app.get('/api/videos', async (req, res) => {
  try {
    // 'await' mette in pausa il codice finché MongoDB non restituisce i dati.
    const videos = await Video.find(); 
    res.json(videos); // Invia i dati trovati al Frontend in formato JSON.
  } catch (err) {
    // Se qualcosa va storto, inviamo un codice 500 (Errore Server).
    res.status(500).json({ message: err.message });
  }
});

// GET /api/videos/:id -> Restituisce un singolo video specifico
// ':id' è un parametro dinamico. Se chiami /api/videos/123, 'req.params.id' varrà "123".
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id); // Cerca per ID univoco di MongoDB.
    if (!video) return res.status(404).json({ message: 'Video non trovato' }); // 404 = Not Found
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Codice aggiunto ora
// POST /api/videos -> Crea un nuovo video nel DB
app.post('/api/videos', async (req, res) => {
  try {
    // Estraiamo i dati dal corpo della richiesta
    const { titolo, url, livelloDifficolta, copertina, descrizione } = req.body;

    // Validazione base (i campi required dello Schema)
    if (!titolo || !url || !livelloDifficolta) {
      return res.status(400).json({ message: "Titolo, URL e Livello Difficoltà sono obbligatori." });
    }

    // Creazione oggetto Video
    // Nota: segmenti è inizializzato come array vuoto se non passato
    const nuovoVideo = new Video({
      titolo,
      url,
      livelloDifficolta,
      copertina,
      descrizione,
      segmenti: [] // Per ora salviamo senza sottotitoli complessi per testare il video
    });

    const videoSalvato = await nuovoVideo.save();
    res.status(201).json(videoSalvato);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- UTENTI (REGISTRAZIONE) ---

// POST /api/register -> Riceve dati dal form e crea un nuovo utente
app.post('/api/register', async (req, res) => {
  try {
    // 1. DESTRUTTURAZIONE: Estraiamo i dati inviati dal Frontend (dentro req.body)
    const { nome, cognome, username, email, password } = req.body;

    // 2. VALIDAZIONE: Controlliamo che nessun campo sia vuoto
    if (!nome || !cognome || !username || !email || !password) {
      // 400 = Bad Request (Colpa dell'utente che ha compilato male)
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori (inclusi Nome e Cognome)." });
    }

    // 3. CONTROLLO DUPLICATI: Verifichiamo se l'email esiste già nel DB
    const utenteEsistente = await Utente.findOne({ email });
    if (utenteEsistente) {
      return res.status(400).json({ msg: "Email già registrata." });
    }

    // 4. CRITTOGRAFIA (Hashing)
    // Generiamo un "sale" (stringa casuale) e mixiamolo alla password.
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt); 
    // Ora 'passwordHash' è una stringa incomprensibile (es. "$2a$10$XyZ...").

    // 5. CREAZIONE OGGETTO
    // Creiamo una nuova istanza del modello Utente in memoria (non ancora nel DB)
    const nuovoUtente = new Utente({
      nome,
      cognome,
      username,
      email,
      password: passwordHash // Salviamo l'hash, MAI la password vera.
    });

    // 6. SALVATAGGIO REALE
    // Scrive fisicamente il documento su MongoDB Atlas.
    await nuovoUtente.save();

    // 201 = Created (Tutto ok, risorsa creata)
    res.status(201).json({ msg: "Registrazione completata con successo!" });

  } catch (err) {
    // Cattura errori imprevisti (es. DB offline, bug nel codice)
    console.error("Errore server:", err);
    res.status(500).json({ msg: "Errore interno del server." });
  }
});

// 6. AVVIO DEL SERVER
// process.env.PORT usa la porta definita nel cloud, altrimenti usa la 5001.
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});