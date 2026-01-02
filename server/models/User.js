const mongoose = require('mongoose');

const VocabularyItemSchema = new mongoose.Schema({
  originalWord: String,
  meaning: String,
  personalNotes: String,
  status: { type: String, enum: ['Da studiare', 'Ripasso', 'Imparato'], default: 'Da studiare' },
  savedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Studente', 'Admin'], default: 'Studente' },
  vocabulary: [VocabularyItemSchema]
});

module.exports = mongoose.model('User', UserSchema);