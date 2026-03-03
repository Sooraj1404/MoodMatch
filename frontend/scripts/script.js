// Fetch trending movies on load
async function fetchTrendingMovies() {
  try {
    const res = await fetch("/api/trending");
    const movies = await res.json();
    displayMovies(movies);
  } catch (err) {
    console.error("Failed to load trending movies", err);
  }
}

// Movies to exclude by title (case-insensitive)
const excludedTitles = ["Jokōsei torio: seikan shiken", "Stepmom's Desire"];

// Display movie cards in the container
function displayMovies(movies) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  // Filter out excluded titles (case-insensitive)
  const filteredMovies = movies.filter(
    movie => !excludedTitles.some(
      title => title.toLowerCase() === (movie.title || movie.name || "").toLowerCase()
    )
  )
  // Filter out R-rated and adult movies
  .filter(movie => {
    // Remove if 'adult' is true
    if (movie.adult === true) return false;
    // Remove if US certification is 'R' (if available)
    if (movie.release_dates && Array.isArray(movie.release_dates.results)) {
      const usRelease = movie.release_dates.results.find(r => r.iso_3166_1 === 'US');
      if (usRelease && usRelease.release_dates) {
        if (usRelease.release_dates.some(rd => rd.certification === 'R')) return false;
      }
    }
    // Remove if 'certification' is 'R' (sometimes present)
    if (movie.certification && movie.certification === 'R') return false;
    return true;
  });

  filteredMovies.forEach((movie) => {
    const card = document.createElement("div");
    card.className = "movie-card";

    const title = movie.title || movie.name || "Untitled";
    const imagePath = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    card.innerHTML = `
      <img src="${imagePath}" alt="${title}">
      <h3>${title}</h3>
      <div class="movie-rating">⭐ ${rating}</div>
      <button class="watch-btn" data-title="${title}" data-img="${imagePath}">
        Mark as Watched
      </button>
      <button class="like-btn" data-title="${title}">Like</button>
      <button class="dislike-btn" data-title="${title}">Dislike</button>
    `;

    container.appendChild(card);
  });

  // Attach event listeners to buttons
  document.querySelectorAll(".watch-btn").forEach((btn) => {
    btn.addEventListener("click", markAsWatched);
  });
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", likeMovie);
  });
  document.querySelectorAll(".dislike-btn").forEach((btn) => {
    btn.addEventListener("click", dislikeMovie);
  });
}

// Handle "Mark as Watched" click
async function markAsWatched(e) {
  const title = e.target.dataset.title;
  const image = e.target.dataset.img;
  const username = localStorage.getItem("username");

  if (!username) {
    alert("User not logged in.");
    return;
  }

  try {
    const res = await fetch("/api/users/watched", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, image, userEmail: username }),
    });
    const data = await res.json();
    if (res.ok) {
      // Post to social feed
      await fetch('/api/users/social-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, type: 'watched', message: `Just watched ${title}`, movie: title })
      });
      alert(`✅ "${title}" marked as watched!`);
      loadSocialFeed();
      loadWatchedMovies();
    } else {
      alert(data.message || "Failed to mark movie");
    }
  } catch (err) {
    console.error("Mark as watched error:", err);
    alert("Something went wrong.");
  }
}

// Like a movie
async function likeMovie(e) {
  const title = e.target.dataset.title;
  const username = localStorage.getItem("username");
  if (!username) {
    alert("User not logged in.");
    return;
  }
  try {
    const res = await fetch("/api/users/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, movie: title })
    });
    if (res.ok) {
      alert(`👍 You liked "${title}"!`);
      loadSocialFeed();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to like movie");
    }
  } catch (err) {
    console.error("Like movie error:", err);
    alert("Something went wrong.");
  }
}

// Dislike a movie
async function dislikeMovie(e) {
  const title = e.target.dataset.title;
  const username = localStorage.getItem("username");
  if (!username) {
    alert("User not logged in.");
    return;
  }
  try {
    const res = await fetch("/api/users/dislike", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, movie: title })
    });
    if (res.ok) {
      alert(`👎 You disliked "${title}"!`);
      loadSocialFeed();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to dislike movie");
    }
  } catch (err) {
    console.error("Dislike movie error:", err);
    alert("Something went wrong.");
  }
}

// Mood to TMDb Genre ID mapping
const moodGenreMap = {
  happy: 35,        // Comedy
  sad: 18,          // Drama
  excited: 28,      // Action
  romantic: 10749,  // Romance
  scared: 27,       // Horror
  angry: 53,        // Thriller
  adventurous: 12,  // Adventure
  nostalgic: 16,    // Animation
  bored: 9648       // Mystery
};

// Mood card to TMDb genre mapping for dashboard cards
const moodCardGenreMap = {
  feelgood: 35,      // Comedy
  heartbreak: 18,    // Drama
  adrenaline: 28,    // Action
  mindbender: 9648,  // Mystery
  laughter: 35       // Comedy
};

// TMDb API Key // replace if needed

// Mood search input function with TMDb fetch integrated
document.getElementById("moodSearchBtn").addEventListener("click", async () => {
  const mood = document.getElementById("moodInput").value.trim().toLowerCase();
  const region = document.getElementById("regionSelect").value;
  const language = document.getElementById("languageSelect").value;

  if (!mood) return;

  const genreId = moodGenreMap[mood] || 18; // Default to Drama

  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;

  if (region !== "ALL") {
    url += `&region=${region}&with_origin_country=${region}`;
  }
  if (language !== "ALL") {
    url += `&with_original_language=${language}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (res.ok && data.results && data.results.length > 0) {
      displayMovies(data.results.slice(0, 18));
    } else {
      alert("No movies found for this mood and region.");
    }
  } catch (err) {
    console.error("Mood search error:", err);
    alert("Failed to fetch mood-based movies.");
  }
});

// Record mood for user
async function recordMood(mood, movie = null) {
  const username = localStorage.getItem("username");
  if (!username) return;
  await fetch("/api/users/mood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, mood, movie })
  });
  // Post to social feed
  await fetch('/api/users/social-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, type: 'mood', message: `Feeling ${mood}`, mood })
  });
  loadSocialFeed();
  updateFavoriteMoods();
}

// Fetch and update mood chart (now based on watched movies)
async function updateMoodChart() {
  const username = localStorage.getItem("username");
  if (!username) return;
  const res = await fetch(`/api/users/watched?user=${username}`);
  const watched = await res.json();
  // Count movies watched by day (last 7 days)
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const watchedCounts = [0,0,0,0,0,0,0];
  const now = new Date();
  watched.forEach(entry => {
    const d = new Date(entry.watchedAt);
    if ((now - d) < 7*24*60*60*1000) {
      watchedCounts[d.getDay()]++;
    }
  });
  // Update chart
  if(window.moodChartInstance) window.moodChartInstance.destroy();
  const ctx = document.getElementById('moodChart').getContext('2d');
  window.moodChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Movies Watched',
        data: watchedCounts,
        backgroundColor: ['#a78bfa', '#facc15', '#60a5fa', '#fb7185', '#10b981', '#f472b6', '#6366f1']
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// Patch mood search to record mood
const origMoodSearch = document.getElementById("moodSearchBtn").onclick;
document.getElementById("moodSearchBtn").onclick = async function() {
  const mood = document.getElementById("moodInput").value.trim().toLowerCase();
  if (mood) await recordMood(mood);
  if (origMoodSearch) origMoodSearch();
  updateMoodChart();
};

// Fetch and display movies for a mood card
window.loadMood = async function(mood) {
  await recordMood(mood);
  const genreId = moodCardGenreMap[mood] || 18; // Default to Drama
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok && data.results && data.results.length > 0) {
      displayMovies(data.results.slice(0, 18));
    } else {
      alert("No movies found for this mood.");
    }
  } catch (err) {
    console.error("Mood card fetch error:", err);
    alert("Failed to fetch movies for this mood.");
  }
  updateMoodChart();
};

// Call the fetch function on page load
document.addEventListener("DOMContentLoaded", fetchTrendingMovies);

// Update mood chart on page load
if (document.getElementById('moodChart')) {
  document.addEventListener("DOMContentLoaded", updateMoodChart);
}

// Fetch and display social feed
async function loadSocialFeed() {
  const res = await fetch('/api/users/social-feed');
  const feed = await res.json();
  const container = document.querySelector('#social-sync .sync-grid');
  container.innerHTML = '';
  feed.forEach(activity => {
    if (activity.type === 'liked') {
      const user = activity.username ? `@${activity.username}` : 'Someone';
      const msg = `Liked <strong>${activity.movie}</strong>`;
      container.innerHTML += `<div class=\"sync-card\"><h4>${user}</h4><p>${msg}</p></div>`;
    }
  });
}

document.addEventListener('DOMContentLoaded', loadSocialFeed);

// Update favorite moods
async function updateFavoriteMoods() {
  const username = localStorage.getItem("username");
  if (!username) return;
  const res = await fetch(`/api/users/mood-history?user=${username}`);
  const history = await res.json();
  const moodCounts = {};
  history.forEach(entry => {
    if (entry.mood) moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });
  // Sort moods by frequency
  const sorted = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const container = document.querySelector('.favorite-moods');
  container.innerHTML = '';
  sorted.slice(0, 5).forEach(([mood, count]) => {
    container.innerHTML += `<div class="progress-bar"><span>${mood.charAt(0).toUpperCase() + mood.slice(1)} (${count})</span></div>`;
  });
  if (sorted.length === 0) {
    container.innerHTML = '<div class="progress-bar"><span>No moods yet</span></div>';
  }
}

document.addEventListener("DOMContentLoaded", updateFavoriteMoods);

// Load watch again list from backend
async function loadWatchedMovies() {
  const username = localStorage.getItem("username");
  if (!username) return;
  const res = await fetch("/api/users/watched?user=" + username);
  const movies = await res.json();
  const container = document.getElementById("watchAgain");
  container.innerHTML = "";
  if (!movies.length) {
    container.innerHTML = "<p>No watched movies yet.</p>";
    return;
  }
  // Sort by most recent
  // Remove duplicates by title, keeping only the most recent
  const uniqueMovies = [];
  const seenTitles = new Set();
  for (const movie of movies) {
    if (!seenTitles.has(movie.title)) {
      uniqueMovies.push(movie);
      seenTitles.add(movie.title);
    }
  }
  uniqueMovies.forEach(movie => {
    const div = document.createElement("div");
    div.className = "watch-card";
    div.innerHTML = `<strong>${movie.title}</strong><small> — Last watched: ${movie.watchedAt ? new Date(movie.watchedAt).toLocaleDateString() : "recently"}</small>`;
    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", loadWatchedMovies);




const crypto = require('crypto');

const secret = 'seckey'; // Your verification secret key
const userId = current_user.id // A string UUID to identify your user

const hash = crypto.createHmac('sha256', secret).update(userId).digest('hex');