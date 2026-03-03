const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
    // You can later add: select: false, for extra security
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  watchedMovies: [
    {
      title: String,
      poster_path: String,
      watchedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  moodHistory: [
    {
      mood: String,
      timestamp: { type: Date, default: Date.now },
      movie: String
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
