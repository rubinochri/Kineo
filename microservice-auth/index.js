const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Utente = require('./models/Utente');

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[AUTH] Ricevuta richiesta: ${req.method} ${req.url}`);
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connesso - Microservizio Auth'))
  .catch(errore => console.error('Errore connessione DB Auth:', errore));

// --- ROTTE DI AUTENTICAZIONE ESTRATTE ---

// POST: Registrazione nuovo utente
app.post('/api/register', async (req, res) => {
  try {
    const { nome, cognome, username, email, password } = req.body;

    if (!nome || !cognome || !username || !email || !password) {
      return res.status(400).json({ msg: "Tutti i campi sono obbligatori." });
    }

    const utenteEsistente = await Utente.findOne({ email });
    if (utenteEsistente) return res.status(400).json({ msg: "Email già registrata." });

    const saltGenerato = await bcrypt.genSalt(10); 
    const passwordHash = await bcrypt.hash(password, saltGenerato); 

    const nuovoUtente = new Utente({
      nome, cognome, username, email, password: passwordHash 
    });

    await nuovoUtente.save(); 
    res.status(201).json({ msg: "Registrazione completata con successo!" });
  } catch (errore) {
    console.error("Errore server registrazione:", errore);
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

    // Generazione JWT
    const token = jwt.sign(
      { 
        id: utenteTrovato._id, 
        ruolo: utenteTrovato.ruolo,
        iss: 'KineoSecretKey2026'
      },
      'KineoSecretKey2026',
      { expiresIn: '1d' }
    );

    res.json({
      msg: "Login effettuato con successo!",
      token,
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

const PORTA = process.env.PORT || 5005; 
app.listen(PORTA, () => { 
  console.log(`Microservizio Auth avviato su porta ${PORTA}`);
});