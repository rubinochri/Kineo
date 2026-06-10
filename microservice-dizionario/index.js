const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const SavedWord = require('./models/SavedWord');
const Dizionario = require('./models/Dizionario');
const { connectRabbitMQ } = require('./rabbitmq');

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI;
const maskedUri = mongoUri ? mongoUri.replace(/:([^@]+)@/, ':******@') : 'undefined';
console.log(`[DIZIONARIO] Tentativo di connessione a MongoDB: ${maskedUri}`);

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB Connesso - Microservizio Dizionario');
    connectRabbitMQ();
  })
  .catch(err => console.error('Errore DB Dizionario:', err));

// Helper function to map flat database schema to the expected frontend/monolith keys
function mapSavedWord(word) {
  const obj = word.toObject ? word.toObject() : word;
  return {
    _id: obj._id,
    userId: obj.userId,
    originale: obj.originale,
    traduzione: obj.traduzione,
    lingua: obj.lingua,
    dataCreazione: obj.dataCreazione,
    notes: obj.notes,
    learned: obj.learned,
    // Legacy fields for backward compatibility with the frontend client
    id: obj._id,
    original: obj.originale,
    translation: obj.traduzione,
    type: obj.lingua,
    date: obj.dataCreazione
  };
}

// --- ROTTE DI DIZIONARIO ---

// POST: Traduci una parola (Demo)
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Testo mancante" });
    const parolaPulita = text.trim().toLowerCase();
    
    const voceDizionario = await Dizionario.findOne({ word: parolaPulita });
    if (voceDizionario) res.json({ translation: voceDizionario.translation });
    else res.json({ translation: "Traduzione non presente nel dizionario demo." });
  } catch (errore) {
    res.status(500).json({ message: "Errore dizionario." });
  }
});

// GET: Recupera tutte le parole salvate da un utente specifico
app.get('/api/user/:id/dizionario', async (req, res) => {
  try {
    const idUtente = req.headers['x-user-id'];
    if (!idUtente) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }
    const listaParole = await SavedWord.find({ userId: idUtente }).sort({ dataCreazione: -1 });
    res.json(listaParole.map(mapSavedWord));
  } catch (errore) {
    console.error("Errore recupero dizionario:", errore);
    res.status(500).json({ msg: "Errore server" });
  }
});

// POST: Aggiungi una parola al dizionario personale dell'utente
app.post('/api/user/:id/dizionario', async (req, res) => {
  try {
    const idUtente = req.headers['x-user-id'];
    if (!idUtente) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }
    const { original, translation, type, notes, learned, originale, traduzione, lingua } = req.body;

    const wordOriginale = originale || original;
    const wordTraduzione = traduzione || translation;
    const wordLingua = lingua || type || 'Generic';

    if (!wordOriginale || !wordTraduzione) {
      return res.status(400).json({ msg: "Campi obbligatori mancanti." });
    }

    const cleanedOriginale = wordOriginale.trim();

    // Check if the word is already saved by this user
    const esisteGia = await SavedWord.findOne({
      userId: idUtente,
      originale: { $regex: new RegExp(`^${cleanedOriginale}$`, 'i') }
    });
    if (esisteGia) return res.status(400).json({ msg: "Parola già presente" });

    const nuovaParola = new SavedWord({
      userId: idUtente,
      originale: cleanedOriginale,
      traduzione: wordTraduzione.trim(),
      lingua: wordLingua,
      notes: notes || '',
      learned: learned || false
    });

    await nuovaParola.save();

    const paroleAggiornate = await SavedWord.find({ userId: idUtente }).sort({ dataCreazione: -1 });
    res.json(paroleAggiornate.map(mapSavedWord));
  } catch (errore) {
    console.error("Errore salvataggio parola:", errore);
    res.status(500).json({ msg: "Errore server" });
  }
});

// DELETE: Elimina una parola dal dizionario personale
app.delete('/api/user/:id/dizionario/:wordId', async (req, res) => {
  try {
    const idUtente = req.headers['x-user-id'];
    if (!idUtente) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }
    const { wordId } = req.params;
    
    const parolaEliminata = await SavedWord.findOneAndDelete({ _id: wordId, userId: idUtente });
    if (!parolaEliminata) {
      return res.status(404).json({ msg: "Parola non trovata per questo utente." });
    }

    const paroleAggiornate = await SavedWord.find({ userId: idUtente }).sort({ dataCreazione: -1 });
    res.json(paroleAggiornate.map(mapSavedWord));
  } catch (errore) {
    console.error("Errore eliminazione parola:", errore);
    res.status(500).json({ msg: "Errore server" });
  }
});

// PUT: Modifica note o stato di apprendimento di una parola
app.put('/api/user/:id/dizionario/:wordId', async (req, res) => {
  try {
    const idUtente = req.headers['x-user-id'];
    if (!idUtente) {
      return res.status(401).json({ msg: 'Non autorizzato: X-User-Id mancante.' });
    }
    const { wordId } = req.params;
    const { notes, learned, originale, traduzione, lingua } = req.body;

    const updates = {};
    if (notes !== undefined) updates.notes = notes;
    if (learned !== undefined) updates.learned = learned;
    if (originale !== undefined) updates.originale = originale;
    if (traduzione !== undefined) updates.traduzione = traduzione;
    if (lingua !== undefined) updates.lingua = lingua;

    const parolaAggiornata = await SavedWord.findOneAndUpdate(
      { _id: wordId, userId: idUtente },
      { $set: updates },
      { new: true }
    );

    if (!parolaAggiornata) {
      return res.status(404).json({ msg: "Parola non trovata per questo utente." });
    }

    const paroleAggiornate = await SavedWord.find({ userId: idUtente }).sort({ dataCreazione: -1 });
    res.json(paroleAggiornate.map(mapSavedWord));
  } catch (errore) {
    console.error("Errore modifica parola:", errore);
    res.status(500).json({ msg: "Errore server" });
  }
});

const PORTA = process.env.PORT || 5002;
app.listen(PORTA, () => {
  console.log(`Microservizio Dizionario in ascolto su porta ${PORTA}`);
});