const mongoose = require('mongoose');

// 1. Schema APPROFONDIMENTO
const ApprofondimentoSchema = new mongoose.Schema({
  token: { 
    type: String,       
    required: true, 
    trim: true,
    maxlength: 255
  },
  tipo: {
    type: String,
    required: true,
    enum: ['Idioma', 'Phrasal Verb', 'Grammatica', 'Vocabolo'] 
  },
  significato: {
    type: String,       
    required: true
  }
});

// 2. Schema SEGMENTO 
const SegmentoSchema = new mongoose.Schema({
  startTime: { 
    type: Number, 
    required: true,
    min: 0 
  },
  endTime: { 
    type: Number, 
    required: true,
    min: 0 
  },
  testoInglese: { 
    type: String, 
    required: true,
    trim: true 
  },
  testoItaliano: { 
    type: String, 
    trim: true 
  },
  approfondimenti: [ApprofondimentoSchema] 
});

// 3. Schema VIDEO 
const VideoSchema = new mongoose.Schema({
  titolo: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 255
  },

  copertina: { 
    type: String, 
    trim: true,
    maxlength: 2048 
  },

  descrizione: { 
    type: String 
  },

  url: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 2048 
  },

  durataSecondi: { 
    type: Number,
    min: 0 
  },

  livelloDifficolta: { 
    type: String,
    required: true,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    uppercase: true
  },
  
  // --- NUOVI CAMPI PER SERIE TV ---
  serie: {
    type: String,
    trim: true,
    index: true, // Indicizzato per raggruppamento veloce
    default: null
  },
  
  episodio: {
    type: Number,
    min: 1,
    default: null
  },
  // -------------------------------

  dataCaricamento: { 
    type: Date, 
    default: Date.now 
  },

  segmenti: [SegmentoSchema]
});

VideoSchema.index({ titolo: 'text', serie: 'text' }); 

module.exports = mongoose.model('Video', VideoSchema);
