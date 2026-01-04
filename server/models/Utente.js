const mongoose = require('mongoose');

// --- SOTTO-SCHEMA: ELEMENTO VOCABOLARIO ---
// Vive dentro l'Utente. Rappresenta la relazione "Gestisce" + "Origina".
const ElementoVocabolarioSchema = new mongoose.Schema({
  // ID_Vocabolario: Generato automaticamente come "_id"

  // RELAZIONE "ORIGINA": Puntatore all'ID dell'Approfondimento specifico
  approfondimentoId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true // Non ha senso salvare una nota se non sappiamo a che parola si riferisce
  },

  notePersonali: { 
    type: String, 
    trim: true 
  },

  stato: { 
    type: String, 
    required: true,
    enum: ['Da studiare', 'Ripasso', 'Imparato'],
    default: 'Da studiare'
  },

  dataSalvataggio: { 
    type: Date, 
    default: Date.now 
  }
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

  // RELAZIONE "GESTISCE": Un array di vocaboli salvati
  vocabolario: [ElementoVocabolarioSchema]
});

module.exports = mongoose.model('Utente', UtenteSchema);