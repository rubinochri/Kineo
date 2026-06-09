// 1. IMPORTAZIONE DELLE LIBRERIE
const express = require('express');   // Importa il framework Express per gestire server e rotte API
const mongoose = require('mongoose'); // Importa Mongoose per interagire con il database MongoDB
const cors = require('cors');         // Importa CORS per permettere al Frontend (React) di chiamare questo Backend
const bcrypt = require('bcryptjs');   // Importa Bcrypt per criptare (hashare) le password degli utenti
require('dotenv').config();           // Carica le variabili d'ambiente (es. password DB) dal file .env

// 2. IMPORTAZIONE DEI MODELLI (Schemi dei dati)
const Video = require('./models/Video');      // Importa lo schema dei Video
const Utente = require('./models/Utente');    // Importa lo schema degli Utenti
const Dizionario = require('./models/Dizionario'); // Importa lo schema del Dizionario (Nota: usato solo in /translate)
const Commento = require('./models/Commento'); // Importa lo schema dei Commenti

// Inizializziamo l'applicazione Express
const app = express();

// 3. MIDDLEWARE (Funzioni eseguite prima di arrivare alle rotte)
app.use(cors());          // Abilita le richieste da domini diversi (es. localhost:5173 chiama localhost:5001)
app.use(express.json());  // Permette al server di leggere i dati JSON inviati nel "body" delle richieste POST/PUT

// 4. CONNESSIONE AL DATABASE MONGODB
mongoose.connect(process.env.MONGODB_URI) // Si connette all'indirizzo del DB salvato nel file .env
  .then(() => console.log('MongoDB Connesso')) // Se ha successo, stampa conferma in console
  .catch(errore => console.error('Errore connessione DB:', errore)); // Se fallisce, stampa l'errore

// ---------------------------------------------------------
// 5. API ROUTES (Punti di accesso per il Frontend)
// ---------------------------------------------------------

// --- ADMIN DASHBOARD ROUTES ---

// GET: Lista di TUTTI gli utenti (per pannello Admin)
app.get('/api/users', async (req, res) => {
  try {
    // Trova tutti, esclude il campo 'password' per sicurezza, ordina per i più recenti
    const listaUtenti = await Utente.find().select('-password').sort({ dataRegistrazione: -1 }); //con -1 indichiamo l'ordine decrescente
    res.json(listaUtenti);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// GET: Lista di TUTTI i commenti globali (per moderazione Admin)
app.get('/api/comments/all', async (req, res) => {
  try {
    const commenti = await Commento.find()
      .populate('utenteId', 'username email') // Sostituisce l'ID utente con i dati reali (username/email)
      .populate('videoId', 'titolo')          // Sostituisce l'ID video con il titolo del video
      .sort({ dataCreazione: -1 });           // Ordina dal più recente
    res.json(commenti);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// DELETE: L'Admin forza l'eliminazione di un commento
app.delete('/api/admin/comments/:id', async (req, res) => {
  try {
    await Commento.findByIdAndDelete(req.params.id); // Elimina il commento target
    // Elimina a cascata anche tutte le risposte collegate a quel commento
    await Commento.deleteMany({ parentCommentoId: req.params.id });
    res.json({ msg: "Commento eliminato dall'admin." });
  } catch (errore) {
    res.status(500).json({ msg: "Errore eliminazione." });
  }
});

// --- AUTH ROUTES (Autenticazione) ---

// POST: Registrazione nuovo utente
app.post('/api/register', async (req, res) => {
  try {
    const { nome, cognome, username, email, password } = req.body;

    // Validazione campi obbligatori
    if (!nome || !cognome || !username || !email || !password) {
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori." });
    }

    // Controlla se l'email esiste già nel DB
    const utenteEsistente = await Utente.findOne({ email });
    if (utenteEsistente) return res.status(400).json({ msg: "Email già registrata." });

    // Criptazione password
    const saltGenerato = await bcrypt.genSalt(10); // Genera una stringa casuale "salt"
    const passwordHash = await bcrypt.hash(password, saltGenerato); // Crea l'hash combinando psw + salt

    // Crea l'oggetto utente (nota: salva l'hash, NON la password in chiaro)
    const nuovoUtente = new Utente({
      nome, cognome, username, email, password: passwordHash 
    });

    await nuovoUtente.save(); // Salva nel DB
    res.status(201).json({ msg: "Registrazione completata con successo!" });
  } catch (errore) {
    console.error("Errore server:", errore);
    res.status(500).json({ msg: "Errore interno del server." });
  }
});

// POST: Login utente
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ msg: "Inserisci email e password." });

    // Cerca l'utente per email
    const utenteTrovato = await Utente.findOne({ email });
    if (!utenteTrovato) return res.status(400).json({ msg: "Credenziali non valide." }); // Email non trovata

    // Confronta la password inviata con l'hash salvato nel DB
    const passwordCorrisponde = await bcrypt.compare(password, utenteTrovato.password);
    if (!passwordCorrisponde) return res.status(400).json({ msg: "Credenziali non valide." }); // Password errata

    // Login OK: Invia i dati utente al frontend (senza token JWT in questo codice base)
    res.json({
      msg: "Login effettuato con successo!",
      user: {
        id: utenteTrovato._id,
        nome: utenteTrovato.nome,
        username: utenteTrovato.username,
        email: utenteTrovato.email,
        ruolo: utenteTrovato.ruolo
      }
    });
  } catch (errore) {
    console.error("Errore Login:", errore);
    res.status(500).json({ msg: "Errore server." });
  }
});

// --- UTENTI (Gestione Profilo & Dizionario Personale) ---

// GET: Ottieni dati profilo utente
app.get('/api/user/:id', async (req, res) => {
  try {
    const utenteTrovato = await Utente.findById(req.params.id);
    if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato." });

    // Restituisce solo i dati pubblici (evita password e version keys)
    res.json({
      id: utenteTrovato._id,
      nome: utenteTrovato.nome,
      cognome: utenteTrovato.cognome,
      username: utenteTrovato.username,
      email: utenteTrovato.email,
      ruolo: utenteTrovato.ruolo,
      dataRegistrazione: utenteTrovato.dataRegistrazione
    });
  } catch (errore) {
    res.status(500).json({ msg: "Errore server." });
  }
});

// PUT: Aggiorna dati profilo
app.put('/api/user/:id', async (req, res) => {
  try {
    const { nome, cognome, username, email } = req.body;
    if (!nome || !cognome || !username || !email) return res.status(400).json({ msg: "Campi obbligatori." });

    // Controlla se la nuova email è già usata da qualcun altro ($ne: not equal to current ID)
    const emailEsistente = await Utente.findOne({ email: email, _id: { $ne: req.params.id } });
    if (emailEsistente) return res.status(400).json({ msg: "Email già in uso." });

    const utenteAggiornato = await Utente.findByIdAndUpdate(
      req.params.id,
      { nome, cognome, username, email },
      { new: true, runValidators: true }
    );

    if (!utenteAggiornato) return res.status(404).json({ msg: "Utente non trovato." });

    res.json({
      msg: "Dati aggiornati!",
      user: {
        id: utenteAggiornato._id,
        nome: utenteAggiornato.nome,
        // ...altri campi aggiornati inviati al client
        cognome: utenteAggiornato.cognome,
        username: utenteAggiornato.username,
        email: utenteAggiornato.email,
        ruolo: utenteAggiornato.ruolo
      }
    });
  } catch (errore) {
    res.status(500).json({ msg: "Errore server." });
  }
});

// DELETE: Elimina il proprio account
app.delete('/api/user/:id', async (req, res) => {
  try {
    const idUtente = req.params.id;
    const utenteDaEliminare = await Utente.findById(idUtente);
    if (!utenteDaEliminare) return res.status(404).json({ msg: "Utente non trovato." });

    // Pulizia: elimina prima tutti i commenti scritti da questo utente
    await Commento.deleteMany({ utenteId: idUtente });
    // Poi elimina l'utente
    await Utente.findByIdAndDelete(idUtente);
    res.json({ msg: "Profilo eliminato." });
  } catch (errore) {
    res.status(500).json({ msg: "Errore server." });
  }
});

// GET: Recupera il dizionario personale (array dentro l'oggetto Utente)
app.get('/api/user/:id/dizionario', async (req, res) => {
  try {
    const utenteTrovato = await Utente.findById(req.params.id);
    if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato" });
    // Ordina le parole per data decrescente (dalla più recente)
    const listaParole = utenteTrovato.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(listaParole);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// POST: Aggiunge una parola al dizionario personale
app.post('/api/user/:id/dizionario', async (req, res) => {
  try {
    const { original, translation, type, notes, learned } = req.body;
    const utenteTrovato = await Utente.findById(req.params.id);
    if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato" });

    // Verifica duplicati: controlla se la parola esiste già nell'array
    const esisteGia = utenteTrovato.dizionario.find(w => w.original.toLowerCase() === original.toLowerCase());
    if (esisteGia) return res.status(400).json({ msg: "Parola già presente" });

    // Aggiunge la nuova parola all'array 'dizionario' dell'utente (operazione in memoria)
    utenteTrovato.dizionario.push({ original, translation, type, notes: notes || '', learned: learned || false });
    await utenteTrovato.save(); // Salva l'intero documento utente con il nuovo array

    // Restituisce l'array aggiornato
    const paroleAggiornate = utenteTrovato.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(paroleAggiornate);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// DELETE: Rimuove una parola dal dizionario
app.delete('/api/user/:id/dizionario/:wordId', async (req, res) => {
  try {
    const utenteTrovato = await Utente.findById(req.params.id);
    if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato" });
    
    // Metodo Mongoose per rimuovere un sotto-documento da un array tramite ID
    utenteTrovato.dizionario.pull({ _id: req.params.wordId });
    await utenteTrovato.save(); // Salva le modifiche
    
    const paroleAggiornate = utenteTrovato.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(paroleAggiornate);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

// PUT: Aggiorna stato parola (es. note o stato "imparato")
app.put('/api/user/:id/dizionario/:wordId', async (req, res) => {
    try {
      const { notes, learned } = req.body;
      const { wordId } = req.params;
      const utenteTrovato = await Utente.findById(req.params.id);
      if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato" });
  
      // Trova il sotto-documento specifico nell'array
      const parolaTrovata = utenteTrovato.dizionario.id(wordId);
      if (!parolaTrovata) return res.status(404).json({ msg: "Parola non trovata" });
  
      // Aggiorna solo se i campi sono stati inviati
      if (notes !== undefined) parolaTrovata.notes = notes;
      if (learned !== undefined) parolaTrovata.learned = learned;
  
      await utenteTrovato.save(); // Salva l'utente
      const paroleAggiornate = utenteTrovato.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json(paroleAggiornate);
    } catch (errore) {
      res.status(500).json({ msg: "Errore server" });
    }
});

// GET: Recupera tutti i commenti di un singolo utente
app.get('/api/user/:id/commenti', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cerca i commenti scritti da questo utente
    // .populate('videoId', 'titolo') serve per mostrare "Video: Titolo Del Video" nel frontend
    const commenti = await Commento.find({ utenteId: id })
      .populate('videoId', 'titolo') 
      .sort({ dataCreazione: -1 }); // Ordina dal più recente

    res.json(commenti);
  } catch (errore) {
    console.error("Errore fetch commenti utente:", errore);
    res.status(500).json({ msg: 'Errore server nel recupero commenti' });
  }
});

// --- ALTRE ROTTE ---

// POST: Traduzione semplice (usa il DB come dizionario statico)
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Testo mancante" });
    const parolaPulita = text.trim().toLowerCase(); // Pulisce spazi e minuscole
    
    // Cerca nel modello 'Dizionario' (separato dagli utenti)
    const voceDizionario = await Dizionario.findOne({ word: parolaPulita });
    if (voceDizionario) res.json({ translation: voceDizionario.translation });
    else res.json({ translation: "Traduzione non presente nel dizionario demo." });
  } catch (errore) {
    res.status(500).json({ message: "Errore dizionario." });
  }
});

// GET: Recupera commenti di un video specifico
app.get('/api/commenti/video/:videoId', async (req, res) => {
  try {
    // 1. Trova i commenti "Principali" (quelli senza genitore/parent)
    const commentiPrincipali = await Commento.find({ videoId: req.params.videoId, parentCommentoId: null })
      .populate('utenteId', 'nome username') // Espande l'ID utente nei dati reali
      .populate('like', '_id') // Espande i like
      .sort({ dataCreazione: -1 });
    
    // 2. Per ogni commento principale, cerca le risposte (Nested comments)
    const commentiConRisposte = await Promise.all(
      commentiPrincipali.map(async (commento) => {
        const risposte = await Commento.find({ parentCommentoId: commento._id })
          .populate('utenteId', 'nome username')
          .populate('like', '_id')
          .sort({ dataCreazione: 1 }); // Ordine cronologico per le risposte
        return { ...commento.toObject(), risposte: risposte }; // Unisce commento + array risposte
      })
    );
    res.json(commentiConRisposte);
  } catch (errore) {
    res.status(500).json({ message: "Errore caricamento commenti." });
  }
});

// POST: Aggiungi un nuovo commento
app.post('/api/commenti', async (req, res) => {
  try {
    const { utenteId, videoId, testo, parentCommentoId } = req.body;
    if (!utenteId || !videoId || !testo) return res.status(400).json({ message: "Dati mancanti." });

    const nuovoCommento = new Commento({
      utenteId, videoId, testo: testo.trim(), parentCommentoId: parentCommentoId || null, like: []
    });
    await nuovoCommento.save();
    // Recupera il commento appena creato con i dati utente popolati per mostrarlo subito
    const commentoCompleto = await Commento.findById(nuovoCommento._id).populate('utenteId', 'nome username');
    res.status(201).json(commentoCompleto);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// PUT: Modifica testo commento
app.put('/api/commenti/:id', async (req, res) => {
  try {
    const { utenteId, testo } = req.body;
    if (!utenteId || testo === undefined) return res.status(400).json({ message: "Dati mancanti." });

    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });
    
    // Controllo sicurezza: solo l'autore può modificare
    if (commentoTrovato.utenteId.toString() !== utenteId) return res.status(403).json({ message: "Non autorizzato." });

    commentoTrovato.testo = testo.trim();
    const commentoAggiornato = await commentoTrovato.save();
    await commentoAggiornato.populate('utenteId', 'nome username'); // Ripopola per il frontend
    res.json(commentoAggiornato);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// PUT: Aggiungi/Rimuovi Like (Toggle). l'azione di cliccare il toggle viene gestito dal frontend.
app.put('/api/commenti/:id/like', async (req, res) => {
  try {
    const { utenteId } = req.body;
    if (!utenteId) return res.status(400).json({ message: "Utente mancante." });
    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });

    // Controlla se l'utente ha già messo like
    const indiceMiPiace = commentoTrovato.like.indexOf(utenteId);
    if (indiceMiPiace === -1) commentoTrovato.like.push(utenteId); // Se no, aggiungi
    else commentoTrovato.like.splice(indiceMiPiace, 1); // Se sì, rimuovi (splice)

    const commentoAggiornato = await commentoTrovato.save();
    // Popola i dati necessari per aggiornare la UI
    await commentoAggiornato.populate('utenteId', 'nome username');
    await commentoAggiornato.populate('like', '_id');
    res.json(commentoAggiornato);
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// DELETE: Utente elimina il proprio commento
app.delete('/api/commenti/:id', async (req, res) => {
  try {
    const { utenteId } = req.body;
    if (!utenteId) return res.status(400).json({ message: "Utente mancante." });
    const commentoTrovato = await Commento.findById(req.params.id);
    if (!commentoTrovato) return res.status(404).json({ message: "Commento non trovato." });
    
    // Controllo Autore
    if (commentoTrovato.utenteId.toString() !== utenteId) return res.status(403).json({ message: "Non autorizzato." });

    // Elimina eventuali risposte figlie
    await Commento.deleteMany({ parentCommentoId: commentoTrovato._id });
    await commentoTrovato.deleteOne();
    res.json({ message: "Commento eliminato." });
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

// 6. AVVIO DEL SERVER
const PORTA = process.env.PORT || 5001; // Usa la porta nel .env oppure la 5001 di default. Nel nostro caso va in quella di default
app.listen(PORTA, () => { //Questi sono i 2 argomenti che accetta.
  console.log(`Server avviato su http://localhost:${PORTA}`);
});