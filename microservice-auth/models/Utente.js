const mongoose = require('mongoose');

// --- SCHEMA PRINCIPALE: UTENTE (CREDENTIALS ONLY) ---
const UtenteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  ruolo: {
    type: String,
    enum: ['Studente', 'Admin'],
    default: 'Studente'
  },

  dataRegistrazione: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Utente', UtenteSchema);