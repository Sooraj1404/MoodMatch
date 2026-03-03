// Fetch and display trending movies
async function loadTrendingMovies() {
    try {
      const res = await fetch("/api/trending");
      const movies = await res.json();
      displayMovies(movies);
    } catch (err) {
      console.error("Error loading trending movies:", err);
    }
  }
  
  // Fetch movies by mood
  function searchByMood() {
    const mood = document.getElementById("searchBox") ? document.getElementById("searchBox").value.trim().toLowerCase() : document.getElementById("moodInput").value.trim().toLowerCase();
    if (!mood) return alert("Please enter a mood to search.");
    fetch(`/api/movies/search?query=${mood}`)
      .then(res => res.json())
      .then(data => displayMovies(data))
      .catch(err => console.error(err));
  }
  
  // Mood card click handler (should be set inline in HTML)
  function loadMood(mood) {
    fetch(`/api/movies/search?query=${mood}`)
      .then(res => res.json())
      .then(data => displayMovies(data))
      .catch(err => console.error(err));
  }
  
  // Render movie cards to the main #results grid
  function displayMovies(movies) {
    const container = document.getElementById("results");
    container.innerHTML = "";
    if (!movies || movies.length === 0) {
      container.innerHTML = "<p style='color:white;text-align:center;'>No movies found.</p>";
      return;
    }
    movies.forEach(movie => {
      const card = document.createElement("div");
      card.className = "movie-card fade-in";
      const title = movie.title || "Untitled";
      const image = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://via.placeholder.com/200x300?text=No+Image";
      card.innerHTML = `
        <img src="${image}" alt="${title}" />
        <h3>${title}</h3>
      `;
      container.appendChild(card);
    });
  }
  
  // Click "Discover" to show trending
  if (document.getElementById("discoverBtn")) {
    document.getElementById("discoverBtn").addEventListener("click", loadTrendingMovies);
  }
  