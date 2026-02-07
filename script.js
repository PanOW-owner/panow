/* ===== CONFIG ===== */
const ROWS = 6;
const COLS = 5;
const DAY_KEY = "panow-day-played";

let currentRow = 0;
let currentCol = 0;
let grid = [];
let gameOver = false;
let answer = "";
let emojiGrid = [];

/* ===== DAY INDEX ===== */
function getDayIndex() {
  const start = new Date("2024-01-01");
  const today = new Date();
  return Math.floor((today - start) / 86400000);
}

const todayIndex = getDayIndex();

/* ===== DAILY LOCK ===== */
if (localStorage.getItem(DAY_KEY) == todayIndex) {
  gameOver = true;
  setTimeout(() => document.getElementById("statsModal").classList.add("show"), 300);
}

/* ===== LOAD WORD ===== */
fetch("words.txt")
  .then(r => r.text())
  .then(text => {
    const words = text.split("\n").map(w => w.trim()).filter(w => w.length === 5);
    answer = words[todayIndex % words.length].toUpperCase();
  });

/* ===== GRID ===== */
const gridEl = document.getElementById("grid");
for (let r = 0; r < ROWS; r++) {
  grid[r] = [];
  for (let c = 0; c < COLS; c++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    gridEl.appendChild(tile);
    grid[r][c] = tile;
  }
}

/* ===== KEYBOARD ===== */
const keyboardLayout = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"]
];

const keyboardEl = document.getElementById("keyboard");
const keyMap = {};

keyboardLayout.forEach(row => {
  const rowEl = document.createElement("div");
  rowEl.className = "key-row";

  row.forEach(k => {
    const key = document.createElement("div");
    key.className = "key";
    key.textContent = k;

    if (k === "ENTER") key.onclick = submitGuess;
    else if (k === "⌫") key.onclick = backspace;
    else {
      key.onclick = () => handleKey(k);
      keyMap[k] = key;
    }

    rowEl.appendChild(key);
  });

  keyboardEl.appendChild(rowEl);
});

/* ===== INPUT ===== */
document.addEventListener("keydown", e => {
  if (gameOver) return;
  if (/^[a-z]$/i.test(e.key)) handleKey(e.key.toUpperCase());
  if (e.key === "Backspace") backspace();
  if (e.key === "Enter") submitGuess();
});

function handleKey(l) {
  if (currentCol < COLS) {
    grid[currentRow][currentCol].textContent = l;
    currentCol++;
  }
}

function backspace() {
  if (currentCol > 0) {
    currentCol--;
    grid[currentRow][currentCol].textContent = "";
  }
}

function submitGuess() {
  if (currentCol < COLS || !answer) return;

  const guess = grid[currentRow].map(t => t.textContent).join("");
  evaluateGuess(guess);

  if (guess === answer || currentRow === ROWS - 1) {
    gameOver = true;
    localStorage.setItem(DAY_KEY, todayIndex);
    setTimeout(showStats, 1800);
  }

  currentRow++;
  currentCol = 0;
}

/* ===== FLIP + EVALUATE ===== */
function evaluateGuess(guess) {
  const result = Array(COLS).fill("⬛");
  const ans = answer.split("");

  for (let i = 0; i < COLS; i++) {
    if (guess[i] === ans[i]) {
      result[i] = "🟩";
      ans[i] = null;
    }
  }

  for (let i = 0; i < COLS; i++) {
    if (result[i] === "⬛") {
      const idx = ans.indexOf(guess[i]);
      if (idx !== -1) {
        result[i] = "🟨";
        ans[idx] = null;
      }
    }
  }

  emojiGrid.push(result.join(""));

  result.forEach((r, i) => {
    const tile = grid[currentRow][i];
    const key = keyMap[guess[i]];

    setTimeout(() => {
      tile.classList.add("flip");
      setTimeout(() => {
        tile.classList.remove("flip");
        tile.classList.add(
          r === "🟩" ? "correct" : r === "🟨" ? "present" : "absent"
        );
        if (key) key.classList.add(
          r === "🟩" ? "correct" : r === "🟨" ? "present" : "absent"
        );
      }, 300);
    }, i * 300);
  });
}

/* ===== STATS + SHARE ===== */
const statsModal = document.getElementById("statsModal");
document.getElementById("statsBtn").onclick = () => statsModal.classList.add("show");
document.getElementById("closeStats").onclick = () => statsModal.classList.remove("show");

function showStats() {
  document.getElementById("stats").innerText =
    `PanOW ${currentRow + 1}/6`;
  statsModal.classList.add("show");
}

document.getElementById("shareBtn").onclick = () => {
  navigator.clipboard.writeText(
    `PanOW ${currentRow + 1}/6\n${emojiGrid.join("\n")}`
  );
  alert("Copied!");
};
