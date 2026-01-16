const mongoose = require('mongoose');

// --- SOTTO-SCHEMA: ELEMENTO VOCABOLARIO ---
const ElementoVocabolarioSchema = new mongoose.Schema({
  approfondimentoId: { type: mongoose.Schema.Types.ObjectId, required: true },
  notePersonali: { type: String, trim: true },
  stato: { 
    type: String, 
    required: true,
    enum: ['Da studiare', 'Ripasso', 'Imparato'],
    default: 'Da studiare'
  },
  dataSalvataggio: { type: Date, default: Date.now }
});

// --- SCHEMA PRINCIPALE: UTENTE ---
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

  // *** AGGIUNTA FONDAMENTALE ***
  username: {
    type: String,
    required: true, 
    unique: true,   
    trim: true,
    minlength: 3
  },
  // *****************************

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
  },

  vocabolario: [ElementoVocabolarioSchema]
});

module.exports = mongoose.model('Utente', UtenteSchema);