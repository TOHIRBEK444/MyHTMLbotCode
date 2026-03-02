const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");

searchBtn.addEventListener("click", async () => {
  let query = searchInput.value.trim();
  if (!query) return;

  let url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=30`;

  try {
    let response = await fetch(url);
    let data = await response.json();
    displayResults(data.results);
  } catch (err) {
    console.error("Error:", err);
  }
});

function displayResults(items) {
  results.innerHTML = "";
  if (!items.length) {
    results.innerHTML = `<p class="text-center text-red-600">No results found!</p>`;
    return;
  }

  items.forEach(item => {
    let card = document.createElement("div");
    card.classList.add("col-md-4", "col-lg-3");

    card.innerHTML = `
      <div class="card shadow-sm hover:shadow-lg transition-all">
        <img src="${item.artworkUrl100}" class="card-img-top" alt="${item.trackName}">
        <div class="card-body">
          <h5 class="card-title text-indigo-800 text-lg font-semibold">${item.trackName}</h5>
          <p class="card-text text-gray-700">${item.artistName}</p>
          <audio controls class="w-full mt-2">
            <source src="${item.previewUrl}" type="audio/mpeg">
          </audio>
          <a href="${item.trackViewUrl}" target="_blank" class="btn btn-indigo bg-indigo-500 hover:bg-indigo-600 text-white w-full mt-3">View in iTunes</a>
        </div>
      </div>
    `;
    results.appendChild(card);
  });
}