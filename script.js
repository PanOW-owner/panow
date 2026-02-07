const ROWS = 6;
const COLS = 5;

let board = [];
let row = 0;
let col = 0;
let gameOver = false;
let secret = "";
let emojiGrid = [];

const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const message = document.getElementById("message");
const shareBtn = document.getElementById("shareBtn");
const statsBtn = document.getElementById("statsBtn");
const statsModal = document.getElementById("statsModal");
const statsDiv = document.getElementById("stats");

const keyStates = {};

const startDate = new Date("2024-01-01");
const today = new Date();
const dayIndex = Math.floor((today - startDate) / 86400000);
const todayKey = `panow-${dayIndex}`;

/* ---------- STATS ---------- */
let stats = JSON.parse(localStorage.getItem("panow-stats")) || {
  played: 0,
  wins: 0,
  streak: 0,
  maxStreak: 0,
  guessDist: [0,0,0,0,0,0]
};

/* ---------- LOAD WORD ---------- */
fetch("words.txt")
  .then(res => res.text())
  .then(text => {
    const words = text.trim().split("\n");
    secret = words[dayIndex % words.length].toLowerCase();
    init();
  });

function init() {
  if (localStorage.getItem(todayKey)) {
    message.textContent = "You already played today’s PanOW";
    gameOver = true;
    shareBtn.hidden = false;
  }

  createBoard();
  createKeyboard();
}

/* ---------- BOARD ---------- */
function createBoard() {
  for (let r = 0; r < ROWS; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      rowEl.appendChild(tile);
      board[r][c] = tile;
    }
    boardEl.appendChild(rowEl);
  }
}

/* ---------- KEYBOARD ---------- */
const keys = [
  ..."qwertyuiop",
  ..."asdfghjkl",
  "Enter",
  ..."zxcvbnm",
  "⌫"
];

function createKeyboard() {
  keys.forEach(k => {
    const key = document.createElement("div");
    key.className = "key";
    key.textContent = k;
    if (k === "Enter" || k === "⌫") key.classList.add("wide");
    key.onclick = () => handleKey(k);
    keyboardEl.appendChild(key);
  });
}

/* ---------- INPUT ---------- */
document.addEventListener("keydown", e => {
  if (gameOver) return;
  if (e.key === "Enter") submit();
  else if (e.key === "Backspace") backspace();
  else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key);
});

function handleKey(k) {
  if (gameOver) return;
  if (k === "Enter") return submit();
  if (k === "⌫") return backspace();
  if (col < COLS) {
    board[row][col].textContent = k.toUpperCase();
    col++;
  }
}

function backspace() {
  if (col > 0) {
    col--;
    board[row][col].textContent = "";
  }
}

/* ---------- SUBMIT ---------- */
function submit() {
  if (col < COLS) return;

  const guess = board[row].map(t => t.textContent.toLowerCase());
  const temp = secret.split("");
  let emojiRow = "";

  // Correct
  guess.forEach((l, i) => {
    if (l === temp[i]) {
      board[row][i].classList.add("correct", "flip");
      updateKey(l, "correct");
      temp[i] = null;
      emojiRow += "🟩";
    }
  });

  // Present / Absent
  guess.forEach((l, i) => {
    if (board[row][i].classList.contains("correct")) return;
    if (temp.includes(l)) {
      board[row][i].classList.add("present", "flip");
      updateKey(l, "present");
      temp[temp.indexOf(l)] = null;
      emojiRow += "🟨";
    } else {
      board[row][i].classList.add("absent", "flip");
      updateKey(l, "absent");
      emojiRow += "⬛";
    }
  });

  emojiGrid.push(emojiRow);

  if (guess.join("") === secret) return endGame(true);
  row++;
  col = 0;
  if (row === ROWS) endGame(false);
}

/* ---------- KEY COLORS ---------- */
function updateKey(letter, state) {
  const priority = { absent: 1, present: 2, correct: 3 };
  if (keyStates[letter] && priority[keyStates[letter]] >= priority[state]) return;
  keyStates[letter] = state;

  document.querySelectorAll(".key").forEach(k => {
    if (k.textContent === letter) {
      k.classList.remove("correct", "present", "absent");
      k.classList.add(state);
    }
  });
}

/* ---------- END GAME ---------- */
function endGame(win) {
  gameOver = true;
  stats.played++;

  if (win) {
    message.textContent = "You Win!";
    stats.wins++;
    stats.streak++;
    stats.maxStreak = Math.max(stats.streak, stats.maxStreak);
    stats.guessDist[row]++;
  } else {
    message.textContent = `Word was: ${secret.toUpperCase()}`;
    stats.streak = 0;
  }

  localStorage.setItem("panow-stats", JSON.stringify(stats));
  localStorage.setItem(todayKey, JSON.stringify({ done: true }));
  shareBtn.hidden = false;
}

/* ---------- SHARE ---------- */
shareBtn.onclick = () => {
  const text = `PanOW ${row + 1}/6\n` + emojiGrid.join("\n");
  navigator.clipboard.writeText(text);
  alert("Copied to clipboard!");
};

/* ---------- STATS ---------- */
statsBtn.onclick = () => {
  renderStats();
  statsModal.classList.remove("hidden");
};

function closeStats() {
  statsModal.classList.add("hidden");
}

function renderStats() {
  statsDiv.innerHTML = `
    Played: ${stats.played}<br>
    Wins: ${stats.wins}<br>
    Streak: ${stats.streak}<br>
    Max Streak: ${stats.maxStreak}<br><br>
    Guess Distribution:
  `;

  stats.guessDist.forEach((n, i) => {
    const bar = document.createElement("div");
    bar.style.background = "#538d4e";
    bar.style.margin = "4px 0";
    bar.style.height = "18px";
    bar.style.width = `${10 + n * 20}px`;
    bar.textContent = `${i + 1}  ${n}`;
    bar.style.paddingLeft = "6px";
    statsDiv.appendChild(bar);
  });
}
