// Called on pressing Enter in input
function handleKeyPress(event) {
  if (event.key === "Enter") {
    searchSpotify();
  }
}

// Search tracks using Deezer API JSONP workaround (no auth required)
function searchSpotify() {
  const query = document.getElementById("searchInput").value.trim();
  const resultsContainer = document.getElementById("results");
  if (!query) return;

  resultsContainer.innerHTML = `
    <div class="d-flex justify-content-center my-4">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  // JSONP callback for Deezer API (to bypass CORS)
  window.jsonpCallback = function (data) {
    const resultsContainer = document.getElementById("results");
    document.body.removeChild(document.getElementById("jsonpScript"));

    if (!data || !data.data || data.data.length === 0) {
      resultsContainer.innerHTML = `<p class="text-warning text-center">No tracks found.</p>`;
      return;
    }

    resultsContainer.innerHTML = "";
    data.data.forEach((track) => {
      const { id, title, artist, album, link, preview } = track;
      const artistName = artist.name;
      const imageUrl = album.cover_medium;

      const card = document.createElement("div");
      card.className = "col";

      card.innerHTML = `
        <div class="card bg-secondary text-white mb-3 h-100">
          <img src="${imageUrl}" class="card-img-top" alt="${title}">
          <div class="card-body">
            <h5 class="card-title" title="${title}">${title}</h5>
            <p class="card-text">Artist: ${artistName}</p>
            <a href="${link}" target="_blank" class="btn btn-outline-light btn-sm mb-2">▶️ Play on Deezer</a>
            ${preview ? `<audio controls src="${preview}" class="w-100 mt-2"></audio>` : ""}
            <button class="btn btn-light btn-sm me-2" onclick="getLyrics('${artistName}', '${title}')">📄 Get Lyrics</button>
            <button class="btn btn-info btn-sm" onclick="checkFollowArtist('${artist.id}')">Check Follow Artist</button>
          </div>
        </div>`;

      resultsContainer.appendChild(card);
    });
  };

  // Remove existing script if any
  const oldScript = document.getElementById("jsonpScript");
  if (oldScript) oldScript.remove();

  // Create new script tag for JSONP
  const script = document.createElement("script");
  script.src = `https://api.deezer.com/search?q=${encodeURIComponent(
    query
  )}&limit=9&output=jsonp&callback=jsonpCallback`;
  script.id = "jsonpScript";
  document.body.appendChild(script);
}

// Call your RapidAPI POST endpoint to check if user follows artist
async function checkFollowArtist(artistId) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = `
    <div class="d-flex justify-content-center my-4">
      <div class="spinner-border text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>`;

  const url = "https://spotifyuserapiserg-osipchukv1.p.rapidapi.com/checkFollowArtist";

  const formData = new URLSearchParams();
  formData.append("artistId", artistId);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-rapidapi-host": "SpotifyUserAPIserg-osipchukV1.p.rapidapi.com",
        "x-rapidapi-key": "01c260e61fmsh7b098867d1c0fb1p1c1399", // Put your full key here
      },
      body: formData.toString(),
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);

    const data = await response.json();
    resultsContainer.innerHTML = `<pre class="text-white">${JSON.stringify(data, null, 2)}</pre>`;
  } catch (error) {
    console.error(error);
    resultsContainer.innerHTML = `<p class="text-danger text-center">Error: ${error.message}</p>`;
  }
}

// Fetch lyrics from lyrics.ovh and show in modal
async function getLyrics(artist, title) {
  const lyricsModal = new bootstrap.Modal(document.getElementById("lyricsModal"));
  const lyricsContent = document.getElementById("lyricsContent");
  lyricsContent.textContent = "Loading lyrics...";
  lyricsModal.show();

  try {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    );
    if (!response.ok) throw new Error("Lyrics not found");
    const data = await response.json();
    lyricsContent.textContent = data.lyrics || "Lyrics not found.";
  } catch {
    lyricsContent.textContent = "Lyrics not found.";
  }
}
