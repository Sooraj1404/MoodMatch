// routes/users.js
//------------------------------
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SocialActivity = require('../models/SocialActivity');

// User Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username and password required." });

    const user = await User.findOne({ username });
    if (!user || user.password !== password)
      return res.status(401).json({ message: "Invalid credentials." });
    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is deactivated. Please contact admin." });
    }

    console.log("✅ Login successful for user:", username);

    res.status(200).json({ message: "Login successful", userId: user._id });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// User Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ message: "Email, username, and password required." });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(409).json({ message: "Username already exists." });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(409).json({ message: "Email already registered." });

    const newUser = new User({ email, username, password });
    await newUser.save();

    console.log("\u2705 New user registered:", username, email);

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("\u274c Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark a movie as watched
router.post('/watched', async (req, res) => {
  try {
    const { title, image, userEmail } = req.body;

    if (!userEmail || !title)
      return res.status(400).json({ message: "Incomplete data." });

    const user = await User.findOne({ username: userEmail });
    if (!user)
      return res.status(404).json({ message: "User not found." });

    user.watchedMovies.push({
      title,
      poster_path: image,
      watchedAt: new Date()
    });

    await user.save();

    await new SocialActivity({
      username: userEmail,
      type: 'watched',
      message: `Just watched ${title}`,
      movie: title
    }).save();

    console.log(`✅ Movie "${title}" marked as watched by ${userEmail}`);
    res.status(200).json({ message: "Movie marked as watched." });
  } catch (err) {
    console.error("❌ Mark as watched error:", err);
    res.status(500).json({ message: "Failed to mark movie as watched." });
  }
});

// Fetch watched movies
router.get('/watched', async (req, res) => {
  try {
    const username = req.query.user;
    if (!username)
      return res.status(400).json({ message: "Username required." });

    const user = await User.findOne({ username });
    if (!user)
      return res.status(404).json({ message: "User not found." });

    res.status(200).json(user.watchedMovies);
  } catch (err) {
    console.error("❌ Fetch watched error:", err);
    res.status(500).json({ message: "Failed to retrieve watched movies." });
  }
});

// Record a new mood for a user
router.post('/mood', async (req, res) => {
  try {
    const { username, mood, movie } = req.body;
    if (!username || !mood) return res.status(400).json({ message: 'Username and mood required.' });
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.moodHistory.push({ mood, movie });
    await user.save();

    await new SocialActivity({
      username,
      type: 'mood',
      message: `Feeling ${mood}`,
      mood
    }).save();

    res.status(200).json({ message: 'Mood recorded.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record mood.' });
  }
});

// Fetch a user\'s mood history
router.get('/mood-history', async (req, res) => {
  try {
    const username = req.query.user;
    if (!username) return res.status(400).json({ message: 'Username required.' });
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user.moodHistory || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mood history.' });
  }
});

// Add social activity endpoint
router.post('/social-activity', async (req, res) => {
  try {
    const { username, type, message, movie, mood } = req.body;
    const activity = new SocialActivity({ username, type, message, movie, mood });
    await activity.save();
    res.status(201).json({ message: 'Activity posted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to post activity.' });
  }
});

// Fetch recent social activities
router.get('/social-feed', async (req, res) => {
  try {
    const activities = await SocialActivity.find().sort({ timestamp: -1 }).limit(20);
    res.status(200).json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch social feed.' });
  }
});

// Like a movie
router.post('/like', async (req, res) => {
  try {
    const { username, movie } = req.body;
    if (!username || !movie) return res.status(400).json({ message: 'Username and movie required.' });
    // Optionally, you could store likes in the user or movie model
    await new SocialActivity({
      username,
      type: 'liked',
      message: `Liked ${movie}`,
      movie
    }).save();
    res.status(200).json({ message: 'Movie liked.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to like movie.' });
  }
});

// Dislike a movie
router.post('/dislike', async (req, res) => {
  try {
    const { username, movie } = req.body;
    if (!username || !movie) return res.status(400).json({ message: 'Username and movie required.' });
    await new SocialActivity({
      username,
      type: 'disliked',
      message: `Disliked ${movie}`,
      movie
    }).save();
    res.status(200).json({ message: 'Movie disliked.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to dislike movie.' });
  }
});

// TEMP: Clear a user's moodHistory
router.post('/clear-moodhistory', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username required.' });
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.moodHistory = [];
    await user.save();
    res.status(200).json({ message: 'Mood history cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear mood history.' });
  }
});

module.exports = router;
