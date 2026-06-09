const mongoose = require('mongoose');

// --- SCHEMA PER IL DIZIONARIO PERSONALE (Aggiornato) ---
const ParolaSalvataSchema = new mongoose.Schema({
  original: { type: String, required: true },
  translation: { type: String, required: true },
  type: { type: String, default: 'Generic' },
  date: { type: Date, default: Date.now },
  
  // --- NUOVI CAMPI AGGIUNTI ---
  notes: { type: String, default: '' },       // Qui salviamo gli appunti
  learned: { type: Boolean, default: false }  // Qui salviamo se è verde (imparata) o rossa
});

// --- SOTTO-SCHEMA: ELEMENTO VOCABOLARIO (Vecchio - compatibilità) ---
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

  // Qui salviamo le parole del dizionario
  dizionario: [ParolaSalvataSchema],
  
  // Manteniamo anche il vecchio campo se serviva a qualcosa
  vocabolario: [ElementoVocabolarioSchema]
});

module.exports = mongoose.model('Utente', UtenteSchema);
