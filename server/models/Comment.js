const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true }
});

module.exports = mongoose.model('Comment', CommentSchema);