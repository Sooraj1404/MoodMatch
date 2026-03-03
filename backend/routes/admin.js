const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username and password required." });

    const admin = await Admin.findOne({ username });
    if (!admin || admin.password !== password)
      return res.status(401).json({ message: "Invalid credentials." });

    console.log("✅ Admin login successful:", username);
    res.status(200).json({ message: "Login successful", adminId: admin._id });
  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing user' });
  }
});

// Deactivate a user
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deactivating user' });
  }
});

// Activate a user
router.put('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User activated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error activating user' });
  }
});

module.exports = router;
