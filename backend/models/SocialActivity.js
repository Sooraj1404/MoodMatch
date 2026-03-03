const mongoose = require('mongoose');

const socialActivitySchema = new mongoose.Schema({
  username: String,
  type: String, // e.g. 'watched', 'mood', 'recommendation'
  message: String, // e.g. 'Just watched ...', 'Recommended ...', etc.
  movie: String, // optional
  mood: String, // optional
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SocialActivity', socialActivitySchema); 