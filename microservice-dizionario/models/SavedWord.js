const mongoose = require('mongoose');

const SavedWordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  originale: { type: String, required: true },
  traduzione: { type: String, required: true },
  lingua: { type: String },
  dataCreazione: { type: Date, default: Date.now },
  // Optional compatibility fields
  notes: { type: String, default: '' },
  learned: { type: Boolean, default: false }
});

module.exports = mongoose.model('SavedWord', SavedWordSchema);
