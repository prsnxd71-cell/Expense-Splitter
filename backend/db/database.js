const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'store.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory cache synced with store.json
let state = {
  users: [],
  groups: [],
  expenses: []
};

// Load existing data if file exists
function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      state = JSON.parse(raw);
    } else {
      save();
    }
  } catch (err) {
    console.error('Error reading database file:', err.message);
  }
}

// Persist data atomically to disk
function save() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err.message);
  }
}

load();

module.exports = {
  state,
  save
};

