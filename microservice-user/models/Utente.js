const mongoose = require('mongoose');

// --- SCHEMA PRINCIPALE: UTENTE (PROFILE ONLY) ---
const UtenteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    maxlength: 255
  },

  cognome: {
    type: String,
    required: true,
    maxlength: 255
  },

  username: {
    type: String,
    required: true, 
    unique: true,   
    trim: true,
    minlength: 3
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
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