const mongoose = require('mongoose');

const DizionarioSchema = new mongoose.Schema({
  word: { 
    type: String, 
    required: true, 
    unique: true, // Evita duplicati
    lowercase: true, // Salviamo tutto minuscolo per facilitare la ricerca
    trim: true 
  },
  translation: { 
    type: String, 
    required: true 
  }
});

// Indice per velocizzare la ricerca della parola
DizionarioSchema.index({ word: 1 });

module.exports = mongoose.model('Dizionario', DizionarioSchema);