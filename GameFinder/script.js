// Cache the sidebar controls used to open, close, and dismiss the menu.
const menubtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const closebtn = document.getElementById("closeBtn");
const overlay = document.getElementById("overlay");
const genreList = document.getElementById("genreList");

// Keep a reference to the add-game button for its future interaction.
const addbtn = document.getElementById("addBtn");

// Cache the search controls for filtering games.
const searchbar = document.getElementById("searchbar");
const submitbtn = document.getElementById("submitBtn");
const searchInput = document.querySelector(".search-input");
const sortSelect = document.getElementById("list");
const unfavoriteDialog = document.getElementById("unfavoriteDialog");
const unfavoriteGameName = document.getElementById("unfavoriteGameName");
const cancelUnfavoriteButton = document.getElementById("cancelUnfavorite");
const confirmUnfavoriteButton = document.getElementById("confirmUnfavorite");
const addGameDialog = document.getElementById("addGameDialog");
const addGameForm = document.getElementById("addGameForm");
const newGameNameInput = document.getElementById("newGameName");
const newGameGenresInput = document.getElementById("newGameGenres");
const newGamePriceInput = document.getElementById("newGamePrice");
const newGamePlaytimeInput = document.getElementById("newGamePlaytime");
const cancelAddGameButton = document.getElementById("cancelAddGame");
let gamePendingRemoval = null;

// Each object stores the information used to build one game's card.
const games = [
  {
    name: "Undertale",
    genres: ["Indie", "RPG", "Story"],
    price: 219,
    playtime: 6,
    pic: "images.jpg"
  },
  {
    name: "Terraria",
    genres: ["Indie", "RPG", "Action", "Adventure"],
    price: 220,
    playtime: 10,
    pic: "images.jpg" 
  },
  {
    name: "Stardew Valley",
    genres: ["Indie", "RPG", "Simulation"],
    price: 315,
    playtime: 54,
    pic: "images.jpg"
  },
  {
    name: "Hollow Knight",
    genres: ["Action", "Adventure", "Indie"],
    price: 315,
    playtime: 27,
    pic: "images.jpg"
  },
  {
    name: "Portal 2",
    genres: ["Action", "Adventure"],
    price: 189,
    playtime: 8,
    pic: "images.jpg"
  },
  {
    name: "Hades",
    genres: ["Action", "Indie", "RPG"],
    price: 495,
    playtime: 24,
    pic: "images.jpg"
  },
  {
    name: "Celeste",
    genres: ["Action", "Adventure", "Indie"],
    price: 99.75,
    playtime: 8,
    pic: "images.jpg"
  },
  {
    name: "Slay the Spire",
    genres: ["Indie", "Strategy"],
    price: 499,
    playtime: 21,
    pic: "images.jpg"
  },
  {
    name: "Left 4 Dead 2",
    genres: ["Action"],
    price: 189,
    playtime: 9,
    pic: "images.jpg"
  }
];

// Find the list element where the generated game cards will be added.
const gameList = document.getElementById("gamelist-ul");

// --- Game card functions ---

// Make an HTML element, give it a CSS class and text, then return it.
function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

// Take one game object and return a complete card to add to the page.
function createGameCard(game) {
  const card = document.createElement("li");
  card.className = "game-card";

  // Add an empty area for artwork so every card has the same layout.
  const imagePlaceholder = document.createElement("div");
  imagePlaceholder.className = "game-card__image";
  imagePlaceholder.setAttribute("aria-hidden", "true");
  card.appendChild(imagePlaceholder);

  // Put the game's name, genres, details, and button in one content container.
  const content = document.createElement("div");
  content.className = "game-card__content";
  content.appendChild(createTextElement("h3", "game-card__title", game.name));

  // Loop through the genres and make one list item for each genre.
  const genres = document.createElement("ul");
  genres.className = "game-card__genres";
  game.genres.forEach((genre) => {
    genres.appendChild(createTextElement("li", "game-card__genre", genre));
  });
  content.appendChild(genres);

  // Show the price and fixed playtime value together.
  const details = document.createElement("div");
  details.className = "game-card__details";
  details.appendChild(createTextElement("p", "game-card__price", `Price: ฿${game.price.toFixed(2)}`));
  details.appendChild(createTextElement("p", "game-card__playtime", `Playtime: ${game.playtime} hours`));
  content.appendChild(details);

  // Remember which game was clicked and open the confirmation dialog.
  const favoriteButton = createTextElement("button", "game-card__favorite", "Unfavorite");
  favoriteButton.type = "button";
  favoriteButton.addEventListener("click", () => {
    gamePendingRemoval = game;
    unfavoriteGameName.textContent = game.name;
    unfavoriteDialog.showModal();
  });
  content.appendChild(favoriteButton);
  card.appendChild(content);

  return card;
}

// Clear the old cards, then create and display a card for each supplied game.
function renderGames(gamesToRender) {
  gameList.replaceChildren();
  gamesToRender.forEach((game) => gameList.appendChild(createGameCard(game)));
}

// Display all games when the page first loads.
renderGames(games);

// Build a sorted menu of unique genres from the current game list.
function renderGenreNav() {
  genreList.replaceChildren();

  // Add an option that clears the search and shows every game.
  const allGamesItem = document.createElement("li");
  const allGamesButton = createTextElement("button", "sidebar__genre-button sidebar__genre-button--all", "All games");
  allGamesButton.type = "button";
  allGamesButton.addEventListener("click", () => {
    searchInput.value = "";
    filterGames();
    closeSidebar();
  });
  allGamesItem.appendChild(allGamesButton);
  genreList.appendChild(allGamesItem);

  // Collect every genre once and sort names alphabetically.
  const genres = [...new Set(games.flatMap((game) => game.genres))]
    .sort((firstGenre, secondGenre) => firstGenre.localeCompare(secondGenre));

  // Make a menu button for each genre; clicking it filters the game cards.
  genres.forEach((genre) => {
    const genreItem = document.createElement("li");
    const genreButton = createTextElement("button", "sidebar__genre-button", genre);
    genreButton.type = "button";
    genreButton.addEventListener("click", () => {
      searchInput.value = genre;
      filterGames();
      closeSidebar();
    });
    genreItem.appendChild(genreButton);
    genreList.appendChild(genreItem);
  });
}

// Show the genre menu when the page first loads.
renderGenreNav();

// Read the search and sort controls, then display the games that match them.
function filterGames() {
  // Clean up the search text so spaces and uppercase letters do not affect matches.
  const searchTerm = searchInput.value.trim().toLowerCase();

  // Keep games with a genre containing the search text; an empty search keeps all games.
  const matchingGames = searchTerm
    ? games.filter((game) =>
        game.genres.some((genre) => genre.toLowerCase().includes(searchTerm))
      )
    : [...games];

  // Sort the matching games from highest to lowest if a sort option was chosen.
  if (sortSelect.value === "price") {
    matchingGames.sort((firstGame, secondGame) => Number(secondGame.price) - Number(firstGame.price));
  } else if (sortSelect.value === "playtime") {
    matchingGames.sort((firstGame, secondGame) => secondGame.playtime - firstGame.playtime);
  }

  // Replace the visible cards with the filtered and sorted results.
  renderGames(matchingGames);
}

// Run the filter when Submit is clicked or the sort dropdown changes.
submitbtn.addEventListener("click", filterGames);
sortSelect.addEventListener("change", filterGames);

// Open the add-game form when the plus button is clicked.
addbtn.addEventListener("click", () => {
  addGameForm.reset();
  newGameGenresInput.setCustomValidity("");
  addGameDialog.showModal();
  newGameNameInput.focus();
});

// Close the add-game form without changing the list when Cancel is clicked.
cancelAddGameButton.addEventListener("click", () => {
  addGameDialog.close();
});

// Clear a genre validation message as soon as the user edits that field.
newGameGenresInput.addEventListener("input", () => {
  newGameGenresInput.setCustomValidity("");
});

// Turn the form values into a game object and add it to the list.
addGameForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Split comma-separated genres into a clean array of genre names.
  const genres = newGameGenresInput.value
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean);

  // Ask for at least one real genre instead of accepting only commas or spaces.
  if (genres.length === 0) {
    newGameGenresInput.setCustomValidity("Enter at least one genre.");
    newGameGenresInput.reportValidity();
    return;
  }

  // Store price and playtime as numbers so sorting can compare them correctly.
  games.push({
    name: newGameNameInput.value.trim(),
    genres,
    price: Number(newGamePriceInput.value),
    playtime: Number(newGamePlaytimeInput.value),
    pic: ""
  });

  // Clear the search so the new game is visible, then apply the selected sort.
  searchInput.value = "";
  filterGames();
  renderGenreNav();
  addGameForm.reset();
  addGameDialog.close();
});

// --- Unfavorite dialog actions ---

// Cancel closes the dialog and leaves the game list unchanged.
cancelUnfavoriteButton.addEventListener("click", () => {
  unfavoriteDialog.close();
});

// Remove the selected game after confirmation, then refresh the visible results.
confirmUnfavoriteButton.addEventListener("click", () => {
  const gameIndex = games.indexOf(gamePendingRemoval);
  if (gameIndex !== -1) {
    games.splice(gameIndex, 1);
    renderGenreNav();
    filterGames();
  }
  unfavoriteDialog.close();
});

// Forget the selected game whenever the dialog closes, including with Escape.
unfavoriteDialog.addEventListener("close", () => {
  gamePendingRemoval = null;
});

// --- Sidebar actions ---

// Open the sidebar and show the dark overlay behind it.
menubtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

// Close the sidebar if the close button or the dark overlay is clicked.
closebtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

// Hide the sidebar and overlay by removing their active CSS classes.
function closeSidebar() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}