// 1. IMPORTAZIONE DELLE LIBRERIE
const express = require('express');   
const mongoose = require('mongoose'); 
const cors = require('cors');
const bcrypt = require('bcryptjs'); // REINSERITO: Necessario per hash password
require('dotenv').config();           

// 2. IMPORTAZIONE DEI MODELLI (Schemi dei dati)
const Video = require('./models/Video');      
const Utente = require('./models/Utente');    
const Commento = require('./models/Commento'); 

// Inizializziamo l'applicazione Express
const app = express();

// 3. MIDDLEWARE
app.use(cors());          
app.use(express.json());  

// 4. CONNESSIONE AL DATABASE MONGODB
mongoose.connect(process.env.MONGODB_URI) 
  .then(() => console.log('MongoDB Connesso')) 
  .catch(errore => console.error('Errore connessione DB:', errore)); 

// ---------------------------------------------------------
// 5. API ROUTES (Punti di accesso per il Frontend)
// ---------------------------------------------------------

// --- ADMIN DASHBOARD ROUTES ---

app.get('/api/users', async (req, res) => {
  try {
    const listaUtenti = await Utente.find().select('-password').sort({ dataRegistrazione: -1 }); 
    res.json(listaUtenti);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

app.get('/api/comments/all', async (req, res) => {
  try {
    const commenti = await Commento.find()
      .populate('utenteId', 'username email') 
      .populate('videoId', 'titolo')          
      .sort({ dataCreazione: -1 });           
    res.json(commenti);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

app.delete('/api/admin/comments/:id', async (req, res) => {
  try {
    await Commento.findByIdAndDelete(req.params.id); 
    await Commento.deleteMany({ parentCommentoId: req.params.id });
    res.json({ msg: "Commento eliminato dall'admin." });
  } catch (errore) {
    res.status(500).json({ msg: "Errore eliminazione." });
  }
});


// --- AUTENTICAZIONE (Login e Registrazione) ---

// REINSERITO: Intestazione rotta di registrazione mancante
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
    const saltGenerato = await bcrypt.genSalt(10); 
    const passwordHash = await bcrypt.hash(password, saltGenerato); 

    // Crea l'oggetto utente
    const nuovoUtente = new Utente({
      nome, cognome, username, email, password: passwordHash 
    });

    await nuovoUtente.save(); 
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

    const utenteTrovato = await Utente.findOne({ email });
    if (!utenteTrovato) return res.status(400).json({ msg: "Credenziali non valide." }); 

    const passwordCorrisponde = await bcrypt.compare(password, utenteTrovato.password);
    if (!passwordCorrisponde) return res.status(400).json({ msg: "Credenziali non valide." }); 

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

// --- UTENTI (Gestione Profilo ) ---

app.get('/api/user/:id', async (req, res) => {
  try {
    const utenteTrovato = await Utente.findById(req.params.id);
    if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato." });

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

app.put('/api/user/:id', async (req, res) => {
  try {
    const { nome, cognome, username, email } = req.body;
    if (!nome || !cognome || !username || !email) return res.status(400).json({ msg: "Campi obbligatori." });

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

app.delete('/api/user/:id', async (req, res) => {
  try {
    const idUtente = req.params.id;
    const utenteDaEliminare = await Utente.findById(idUtente);
    if (!utenteDaEliminare) return res.status(404).json({ msg: "Utente non trovato." });

    await Commento.deleteMany({ utenteId: idUtente });
    await Utente.findByIdAndDelete(idUtente);
    res.json({ msg: "Profilo eliminato." });
  } catch (errore) {
    res.status(500).json({ msg: "Errore server." });
  }
});


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

// --- ALTRE ROTTE ---

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
  } catch (errore) {
    res.status(400).json({ message: errore.message });
  }
});

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
    res.status(400).json({ message: errore.message });
  }
});

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
    res.status(400).json({ message: errore.message });
  }
});

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
    res.status(400).json({ message: errore.message });
  }
});

// 6. AVVIO DEL SERVER
const PORTA = process.env.PORT || 5001; 
app.listen(PORTA, () => { 
  console.log(`Server avviato su http://localhost:${PORTA}`);
});