/**
 * LotRepository — рівень доступу до даних (заглушка)
 * Демонструє 4 підходи до вводу-виводу:
 *  1. Синхронний
 *  2. Асинхронний з callback
 *  3. Асинхронний з Promise
 *  4. Асинхронний з async/await
 */

const fs = require('fs');
const path = require('path');

const LOTS_FILE = path.join(__dirname, '../../data/lots.json');

// ─── 1. СИНХРОННИЙ ВВІД-ВИВІД ───────────────────────────────────────────────
function getAllLotsSync() {
  const raw = fs.readFileSync(LOTS_FILE, 'utf-8');
  return JSON.parse(raw);
}

function saveLotsSync(lots) {
  fs.writeFileSync(LOTS_FILE, JSON.stringify(lots, null, 2), 'utf-8');
}

// ─── 2. АСИНХРОННИЙ З CALLBACK ───────────────────────────────────────────────
function getAllLotsCallback(callback) {
  fs.readFile(LOTS_FILE, 'utf-8', (err, data) => {
    if (err) return callback(err, null);
    try {
      callback(null, JSON.parse(data));
    } catch (parseErr) {
      callback(parseErr, null);
    }
  });
}

function saveLotsCallback(lots, callback) {
  fs.writeFile(LOTS_FILE, JSON.stringify(lots, null, 2), 'utf-8', callback);
}

// ─── 3. АСИНХРОННИЙ З PROMISE ─────────────────────────────────────────────
function getAllLotsPromise() {
  return new Promise((resolve, reject) => {
    fs.readFile(LOTS_FILE, 'utf-8', (err, data) => {
      if (err) return reject(err);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function saveLotsPromise(lots) {
  return new Promise((resolve, reject) => {
    fs.writeFile(LOTS_FILE, JSON.stringify(lots, null, 2), 'utf-8', (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ─── 4. АСИНХРОННИЙ З ASYNC/AWAIT ─────────────────────────────────────────
async function getAllLotsAsync() {
  const data = await fs.promises.readFile(LOTS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveLotsAsync(lots) {
  await fs.promises.writeFile(LOTS_FILE, JSON.stringify(lots, null, 2), 'utf-8');
}

// ─── ПУБЛІЧНИЙ API РЕПОЗИТОРІЮ ────────────────────────────────────────────
// Основний інтерфейс: використовуємо async/await (найчистіший підхід),
// але зберігаємо всі варіанти для демонстрації

async function findAll() {
  return getAllLotsAsync();
}

async function findById(id) {
  const lots = await getAllLotsAsync();
  return lots.find(lot => lot.id === id) || null;
}

async function save(lot) {
  const lots = await getAllLotsAsync();
  const idx = lots.findIndex(l => l.id === lot.id);
  if (idx >= 0) {
    lots[idx] = lot;
  } else {
    lots.push(lot);
  }
  await saveLotsAsync(lots);
  return lot;
}

async function remove(id) {
  const lots = await getAllLotsAsync();
  const filtered = lots.filter(l => l.id !== id);
  await saveLotsAsync(filtered);
}

module.exports = {
  // Основний API
  findAll,
  findById,
  save,
  remove,
  // Варіанти для демонстрації
  getAllLotsSync,
  saveLotsSync,
  getAllLotsCallback,
  saveLotsCallback,
  getAllLotsPromise,
  saveLotsPromise,
  getAllLotsAsync,
  saveLotsAsync,
};
