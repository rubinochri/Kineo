const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Utente = require('./models/Utente');
const { connectRabbitMQ, publishUserDeleted } = require('./rabbitmq');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connesso - Microservizio User');
    connectRabbitMQ();
  })
  .catch(errore => console.error('Errore connessione DB User:', errore));

// GET: lista utenti per admin
app.get('/api/users', async (req, res) => {
  try {
    const listaUtenti = await Utente.find()
      .select('-password')
      .sort({ dataRegistrazione: -1 });

    res.json(listaUtenti);
  } catch (errore) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

// GET: profilo utente
app.get('/api/user/:id', async (req, res) => {
  try {
    const idUtente = req.headers['x-user-id'];
    if (!idUtente) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }
    const utenteTrovato = await Utente.findById(idUtente);

    if (!utenteTrovato) {
      return res.status(404).json({ msg: 'Utente non trovato.' });
    }

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
    res.status(500).json({ msg: 'Errore server.' });
  }
});

// PUT: modifica profilo utente
app.put('/api/user/:id', async (req, res) => {
  try {
    const idUtente = req.headers['x-user-id'];
    if (!idUtente) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }
    const { nome, cognome, username, email } = req.body;

    if (!nome || !cognome || !username || !email) {
      return res.status(400).json({ msg: 'Campi obbligatori.' });
    }

    const emailEsistente = await Utente.findOne({
      email,
      _id: { $ne: idUtente }
    });

    if (emailEsistente) {
      return res.status(400).json({ msg: 'Email già in uso.' });
    }

    const utenteAggiornato = await Utente.findByIdAndUpdate(
      idUtente,
      { nome, cognome, username, email },
      { new: true, runValidators: true }
    );

    if (!utenteAggiornato) {
      return res.status(404).json({ msg: 'Utente non trovato.' });
    }

    res.json({
      msg: 'Dati aggiornati!',
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
    res.status(500).json({ msg: 'Errore server.' });
  }
});

// DELETE: elimina profilo utente
app.delete('/api/user/:id', async (req, res) => {
  try {
    const idUtente = req.headers['x-user-id'];
    if (!idUtente) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }

    const utenteDaEliminare = await Utente.findById(idUtente);

    if (!utenteDaEliminare) {
      return res.status(404).json({ msg: 'Utente non trovato.' });
    }

    await Utente.findByIdAndDelete(idUtente);

    // Pubblica il messaggio sulla coda RabbitMQ
    try {
      await publishUserDeleted(idUtente);
    } catch (rabbitErr) {
      console.error(`[RABBITMQ] Errore nell'invio della notifica di cancellazione per l'utente ${idUtente}:`, rabbitErr.message);
    }

    res.json({ msg: 'Profilo eliminato.' });
  } catch (errore) {
    res.status(500).json({ msg: 'Errore server.' });
  }
});

const PORTA = process.env.PORT || 5007;

app.listen(PORTA, () => {
  console.log(`Microservizio User in ascolto su porta ${PORTA}`);
});