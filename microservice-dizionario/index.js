const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Utente = require('./models/Utente');
const Dizionario = require('./models/Dizionario');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connesso - Microservizio Dizionario'))
  .catch(err => console.error('Errore DB:', err));

// --- ROTTE ESTRATTE DAL MONOLITE ---

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

app.get('/api/user/:id/dizionario', async (req, res) => {
  try {
    const utenteTrovato = await Utente.findById(req.params.id);
    if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato" });
    const listaParole = utenteTrovato.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(listaParole);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

app.post('/api/user/:id/dizionario', async (req, res) => {
  try {
    const { original, translation, type, notes, learned } = req.body;
    const utenteTrovato = await Utente.findById(req.params.id);
    if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato" });

    const esisteGia = utenteTrovato.dizionario.find(w => w.original.toLowerCase() === original.toLowerCase());
    if (esisteGia) return res.status(400).json({ msg: "Parola già presente" });

    utenteTrovato.dizionario.push({ original, translation, type, notes: notes || '', learned: learned || false });
    await utenteTrovato.save();

    const paroleAggiornate = utenteTrovato.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(paroleAggiornate);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

app.delete('/api/user/:id/dizionario/:wordId', async (req, res) => {
  try {
    const utenteTrovato = await Utente.findById(req.params.id);
    if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato" });
    
    utenteTrovato.dizionario.pull({ _id: req.params.wordId });
    await utenteTrovato.save(); 
    
    const paroleAggiornate = utenteTrovato.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(paroleAggiornate);
  } catch (errore) {
    res.status(500).json({ msg: "Errore server" });
  }
});

app.put('/api/user/:id/dizionario/:wordId', async (req, res) => {
    try {
      const { notes, learned } = req.body;
      const { wordId } = req.params;
      const utenteTrovato = await Utente.findById(req.params.id);
      if (!utenteTrovato) return res.status(404).json({ msg: "Utente non trovato" });
  
      const parolaTrovata = utenteTrovato.dizionario.id(wordId);
      if (!parolaTrovata) return res.status(404).json({ msg: "Parola non trovata" });
  
      if (notes !== undefined) parolaTrovata.notes = notes;
      if (learned !== undefined) parolaTrovata.learned = learned;
  
      await utenteTrovato.save();
      const paroleAggiornate = utenteTrovato.dizionario.sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json(paroleAggiornate);
    } catch (errore) {
      res.status(500).json({ msg: "Errore server" });
    }
});

const PORTA = process.env.PORT || 5002;
app.listen(PORTA, () => {
  console.log(`Microservizio Dizionario in ascolto su porta ${PORTA}`);
});