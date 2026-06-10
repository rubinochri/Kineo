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

// POST: Inizializzazione profilo (chiamata inter-servizio sincrona da Auth)
app.post('/api/user/init', async (req, res) => {
  try {
    const { id, nome, cognome, username, email, ruolo } = req.body;

    if (!id || !nome || !cognome || !username || !email) {
      return res.status(400).json({ msg: 'Dati incompleti per inizializzazione profilo.' });
    }

    const utenteEsistente = await Utente.findById(id);
    if (utenteEsistente) {
      return res.status(400).json({ msg: 'Profilo già esistente per questo ID.' });
    }

    const nuovoProfilo = new Utente({
      _id: id,
      nome,
      cognome,
      username,
      email,
      ruolo: ruolo || 'Studente'
    });

    await nuovoProfilo.save();
    console.log(`[USER] Profilo inizializzato con successo per utente ${id}`);
    res.status(201).json({ msg: 'Profilo inizializzato con successo!' });
  } catch (errore) {
    console.error("Errore inizializzazione profilo:", errore);
    res.status(500).json({ msg: 'Errore server durante inizializzazione.' });
  }
});

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
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ msg: 'Parametro ID utente mancante.' });
    }

    const utenteTrovato = await Utente.findById(targetId);

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
    console.error("Errore recupero profilo utente:", errore);
    res.status(500).json({ msg: 'Errore server.' });
  }
});

// PUT: modifica profilo utente
app.put('/api/user/:id', async (req, res) => {
  try {
    const operatorId = req.headers['x-user-id'];
    if (!operatorId) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }

    const targetId = req.params.id;

    // Controllo Ruolo / Autorizzazione
    if (operatorId !== targetId) {
      const operatore = await Utente.findById(operatorId);
      if (!operatore || (operatore.ruolo !== 'Admin' && operatore.ruolo?.toLowerCase() !== 'admin')) {
        return res.status(403).json({ msg: 'Non autorizzato: Permessi insufficienti.' });
      }
    }

    const { nome, cognome, username, email } = req.body;

    if (!nome || !cognome || !username || !email) {
      return res.status(400).json({ msg: 'Campi obbligatori.' });
    }

    const emailEsistente = await Utente.findOne({
      email,
      _id: { $ne: targetId }
    });

    if (emailEsistente) {
      return res.status(400).json({ msg: 'Email già in uso.' });
    }

    const utenteAggiornato = await Utente.findByIdAndUpdate(
      targetId,
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
    console.error("Errore modifica profilo utente:", errore);
    res.status(500).json({ msg: 'Errore server.' });
  }
});

// DELETE: elimina profilo utente
app.delete('/api/user/:id', async (req, res) => {
  try {
    const operatorId = req.headers['x-user-id'];
    if (!operatorId) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }

    const targetId = req.params.id;

    // Controllo Ruolo / Autorizzazione
    if (operatorId !== targetId) {
      const operatore = await Utente.findById(operatorId);
      if (!operatore || (operatore.ruolo !== 'Admin' && operatore.ruolo?.toLowerCase() !== 'admin')) {
        return res.status(403).json({ msg: 'Non autorizzato: Permessi insufficienti.' });
      }
    }

    const utenteDaEliminare = await Utente.findById(targetId);

    if (!utenteDaEliminare) {
      return res.status(404).json({ msg: 'Utente non trovato.' });
    }

    await Utente.findByIdAndDelete(targetId);

    // Pubblica il messaggio sulla coda RabbitMQ
    try {
      await publishUserDeleted(targetId);
    } catch (rabbitErr) {
      console.error(`[RABBITMQ] Errore nell'invio della notifica di cancellazione per l'utente ${targetId}:`, rabbitErr.message);
    }

    res.json({ msg: 'Profilo eliminato.' });
  } catch (errore) {
    console.error("Errore eliminazione profilo utente:", errore);
    res.status(500).json({ msg: 'Errore server.' });
  }
});

const PORTA = process.env.PORT || 5007;

app.listen(PORTA, () => {
  console.log(`Microservizio User in ascolto su porta ${PORTA}`);
});