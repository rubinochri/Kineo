// 1. IMPORTAZIONE DELLE LIBRERIE
const express = require('express');   
const mongoose = require('mongoose'); 
const cors = require('cors');
const bcrypt = require('bcryptjs'); // REINSERITO: Necessario per hash password
require('dotenv').config();           

// 2. IMPORTAZIONE DEI MODELLI (Schemi dei dati)
const Video = require('./models/Video');      
const Utente = require('./models/Utente');    

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

    await Utente.findByIdAndDelete(idUtente);
    res.json({ msg: "Profilo eliminato." });
  } catch (errore) {
    res.status(500).json({ msg: "Errore server." });
  }
});



// 6. AVVIO DEL SERVER
const PORTA = process.env.PORT || 5001; 
app.listen(PORTA, () => { 
  console.log(`Server avviato su http://localhost:${PORTA}`);
});