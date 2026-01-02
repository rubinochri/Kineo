const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importiamo il modello Video per poter fare le query
const Video = require('./models/Video');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connessione al Database
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kineo')
  .then(() => console.log('✅ MongoDB Connesso'))
  .catch(err => console.error('❌ Errore connessione DB:', err));

// ---------------------------------------------------------
// API ROUTES (Le "porte" per il Frontend)
// ---------------------------------------------------------

// 1. Prendi tutti i video (GET /api/videos)
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find(); // Cerca tutti i documenti nella collezione 'videos'
    res.json(videos); // Li manda al frontend in formato JSON
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Prendi un singolo video specifico (GET /api/videos/:id)
app.get('/api/videos/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video non trovato' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Avvio Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});