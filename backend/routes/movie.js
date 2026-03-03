const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// TMDB Search
router.get('/search', async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    res.json(data.results);
  } catch (err) {
    console.error('TMDB API Error:', err);
    res.status(500).json({ error: 'Failed to fetch from TMDB' });
  }
});

module.exports = router;
