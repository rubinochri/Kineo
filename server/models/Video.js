const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema({
  token: String,
  type: { type: String, enum: ['Idioma', 'Phrasal Verb', 'Grammatica', 'Vocabolo'] },
  meaning: String
});

const SegmentSchema = new mongoose.Schema({
  startTimeMs: Number,
  endTimeMs: Number,
  textEnglish: String,
  textItalian: String,
  insights: [InsightSchema]
});

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  cover: String,
  description: String,
  url: { type: String, required: true },
  durationSeconds: Number,
  difficultyLevel: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
  uploadDate: { type: Date, default: Date.now },
  segments: [SegmentSchema]
});

module.exports = mongoose.model('Video', VideoSchema);