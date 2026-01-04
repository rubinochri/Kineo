const mongoose = require('mongoose');

// 1. Schema APPROFONDIMENTO (Livello 3 - Il più interno)
// Rappresenta la singola parola/frase cliccabile
const ApprofondimentoSchema = new mongoose.Schema({
  // ID_Approfondimento: Generato automaticamente da MongoDB come "_id"

  token: { 
    type: String,       // La parola o frase esatta (es. "Give up")
    required: true, 
    trim: true,
    maxlength: 255
  },

  tipo: {
    type: String,
    required: true,
    enum: ['Idioma', 'Phrasal Verb', 'Grammatica', 'Vocabolo'] // Lista chiusa valori ammessi
  },

  significato: {
    type: String,       // TEXT
    required: true
  }
});

// 2. Schema SEGMENTO (Livello 2 - Sottotitolo)
const SegmentoSchema = new mongoose.Schema({
  // ID_Segmento: Generato automaticamente come "_id"

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

  // RELAZIONE: Un segmento CONTIENE molti Approfondimenti
  approfondimenti: [ApprofondimentoSchema] 
});

// 3. Schema VIDEO (Livello 1 - Entità Principale)
const VideoSchema = new mongoose.Schema({
  // ID_Video: Generato automaticamente come "_id"

  titolo: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 255
  },

  copertina: { 
    type: String, 
    trim: true,
    maxlength: 255 
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

  dataCaricamento: { 
    type: Date, 
    default: Date.now 
  },

  // RELAZIONE: Un Video INCLUDE molti Segmenti
  segmenti: [SegmentoSchema]
});

// Indici per velocizzare le ricerche
VideoSchema.index({ titolo: 'text' }); 

module.exports = mongoose.model('Video', VideoSchema);