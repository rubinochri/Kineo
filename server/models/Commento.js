const mongoose = require('mongoose');

const CommentoSchema = new mongoose.Schema({
  // ID_Commento: Generato automaticamente come "_id"

  // --- RELAZIONE: SCARICA (Foreign Key verso UTENTE) ---
  utenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utente',    // Deve coincidere ESATTAMENTE con il nome in mongoose.model('Utente', ...)
    required: true
  },

  // --- RELAZIONE: RICEVE (Foreign Key verso VIDEO) ---
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',     // Deve coincidere ESATTAMENTE con il nome in mongoose.model('Video', ...)
    required: true
  },

  testo: {
    type: String,     // TEXT
    required: true,
    trim: true
  },

  dataCreazione: {
    type: Date,       // DATETIME
    default: Date.now
  },

  // --- LIKE ---
  like: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utente'     // Array di ID utenti che hanno messo like
  }],

  // --- RISPOSTE ---
  parentCommentoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commento',  // ID del commento padre se è una risposta
    default: null
  }
});

// Indici per velocizzare le query comuni:
// 1. "Dammi tutti i commenti di questo video" (Usatissimo)
CommentoSchema.index({ videoId: 1, dataCreazione: -1 }); 
// 2. "Dammi tutte le risposte di questo commento"
CommentoSchema.index({ parentCommentoId: 1, dataCreazione: -1 });

module.exports = mongoose.model('Commento', CommentoSchema);