const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Read a JSON file
router.get('/read', (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).json({ message: 'File parameter required' });
  const filePath = path.join(__dirname, '..', '..', 'frontend', file);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Failed to read file', error: err.message });
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (parseErr) {
      res.status(500).json({ message: 'Invalid JSON format', error: parseErr.message });
    }
  });
});

// Update a JSON file
router.post('/update', (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).json({ message: 'File parameter required' });
  const filePath = path.join(__dirname, '..', '..', 'frontend', file);
  const jsonData = JSON.stringify(req.body, null, 2);
  fs.writeFile(filePath, jsonData, 'utf8', (err) => {
    if (err) return res.status(500).json({ message: 'Failed to write file', error: err.message });
    res.json({ message: 'File updated successfully' });
  });
});

module.exports = router; 