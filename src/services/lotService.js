/**
 * LotService — рівень сервісів (бізнес-логіка)
 * Інкапсулює всі бізнес-правила системи аукціонів.
 */

const lotRepository = require('../repositories/lotRepository');
const { v4: uuidv4 } = require('uuid');

// DTO — структура даних для передачі між рівнями
class LotDTO {
  constructor(lot) {
    this.id = lot.id;
    this.title = lot.title;
    this.description = lot.description;
    this.startPrice = lot.startPrice;
    this.currentPrice = lot.currentPrice;
    this.ownerId = lot.ownerId;
    this.ownerName = lot.ownerName;
    this.status = lot.status; // 'active' | 'stopped'
    this.keywords = lot.keywords;
    this.imageUrl = lot.imageUrl;
    this.createdAt = lot.createdAt;
    this.bids = lot.bids || [];
    this.publicUrl = `/lots/${lot.id}`;
  }

  get highestBid() {
    if (!this.bids.length) return null;
    return this.bids.reduce((max, b) => (b.amount > max.amount ? b : max));
  }

  get displayPrice() {
    return this.bids.length ? this.currentPrice : this.startPrice;
  }

  get bidsCount() {
    return this.bids.length;
  }
}

// ─── ОТРИМАТИ ВСІ АКТИВНІ ЛОТИ ───────────────────────────────────────────
async function getActiveLots() {
  const lots = await lotRepository.findAll();
  return lots
    .filter(l => l.status === 'active')
    .map(l => new LotDTO(l));
}

// ─── ПОШУК ЗА КЛЮЧОВИМИ СЛОВАМИ ──────────────────────────────────────────
async function searchLots(query) {
  if (!query || !query.trim()) return getActiveLots();
  const q = query.toLowerCase().trim();
  const lots = await lotRepository.findAll();
  return lots
    .filter(l => l.status === 'active')
    .filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      (l.keywords || []).some(kw => kw.toLowerCase().includes(q))
    )
    .map(l => new LotDTO(l));
}

// ─── ОТРИМАТИ ЛОТ ЗА ID ──────────────────────────────────────────────────
async function getLotById(id) {
  const lot = await lotRepository.findById(id);
  if (!lot) return null;
  return new LotDTO(lot);
}

// ─── ОТРИМАТИ ЛОТИ КОРИСТУВАЧА ────────────────────────────────────────────
async function getLotsByOwner(ownerId) {
  const lots = await lotRepository.findAll();
  return lots
    .filter(l => l.ownerId === ownerId)
    .map(l => new LotDTO(l));
}

// ─── СТВОРИТИ ЛОТ ────────────────────────────────────────────────────────
async function createLot({ title, description, startPrice, keywords, ownerId, ownerName }) {
  if (!title || !description || !startPrice) {
    throw new Error('Заповніть всі обов\'язкові поля');
  }
  if (isNaN(startPrice) || Number(startPrice) <= 0) {
    throw new Error('Стартова ціна має бути позитивним числом');
  }

  const lot = {
    id: `lot-${uuidv4().slice(0, 8)}`,
    title: title.trim(),
    description: description.trim(),
    startPrice: Number(startPrice),
    currentPrice: Number(startPrice),
    ownerId,
    ownerName,
    status: 'stopped',
    keywords: keywords
      ? keywords.split(',').map(k => k.trim()).filter(Boolean)
      : [],
    imageUrl: `https://placehold.co/400x300/1a1a2e/e0e0e0?text=${encodeURIComponent(title.slice(0, 15))}`,
    createdAt: new Date().toISOString(),
    bids: [],
  };

  await lotRepository.save(lot);
  return new LotDTO(lot);
}

// ─── ЗРОБИТИ СТАВКУ ──────────────────────────────────────────────────────
async function placeBid(lotId, { bidderId, bidderName, amount }) {
  const lot = await lotRepository.findById(lotId);
  if (!lot) throw new Error('Лот не знайдено');
  if (lot.status !== 'active') throw new Error('Торги на цьому лоті не активні');
  if (lot.ownerId === bidderId) throw new Error('Власник не може робити ставки на свій лот');

  const bidAmount = Number(amount);
  if (!Number.isInteger(bidAmount) || bidAmount <= lot.currentPrice) {
    throw new Error(`Ставка має бути цілим числом, більшим за ${lot.currentPrice} грн`);
  }

  const bid = {
    bidderId,
    bidderName,
    amount: bidAmount,
    createdAt: new Date().toISOString(),
  };

  lot.bids.push(bid);
  lot.currentPrice = bidAmount;
  await lotRepository.save(lot);
  return new LotDTO(lot);
}

// ─── ВИДАЛИТИ ЛОТ ────────────────────────────────────────────────────────
async function deleteLot(lotId, requesterId) {
  const lot = await lotRepository.findById(lotId);
  if (!lot) throw new Error('Лот не знайдено');
  if (lot.ownerId !== requesterId) throw new Error('Тільки власник може видалити лот');
  await lotRepository.remove(lotId);
}

// ─── ЗАПУСТИТИ ТОРГИ ──────────────────────────────────────────────────────
async function startTrading(lotId, requesterId) {
  const lot = await lotRepository.findById(lotId);
  if (!lot) throw new Error('Лот не знайдено');
  if (lot.ownerId !== requesterId) throw new Error('Тільки власник може керувати торгами');
  if (lot.status === 'active') throw new Error('Торги вже активні');
  lot.status = 'active';
  await lotRepository.save(lot);
  return new LotDTO(lot);
}

// ─── ЗУПИНИТИ ТОРГИ ───────────────────────────────────────────────────────
async function stopTrading(lotId, requesterId) {
  const lot = await lotRepository.findById(lotId);
  if (!lot) throw new Error('Лот не знайдено');
  if (lot.ownerId !== requesterId) throw new Error('Тільки власник може керувати торгами');
  if (lot.status !== 'active') throw new Error('Торги не активні');
  lot.status = 'stopped';
  await lotRepository.save(lot);
  return new LotDTO(lot);
}

// ─── ЗГЕНЕРУВАТИ URL ──────────────────────────────────────────────────────
function generateLotUrl(lotId, baseUrl = 'http://localhost:3000') {
  return `${baseUrl}/lots/${lotId}`;
}

// ─── ДЕМОНСТРАЦІЯ ВСІХ ПІДХОДІВ ВВ ──────────────────────────────────────
function demoAllIOApproaches(callback) {
  const results = {};

  // 1. Синхронний
  try {
    const syncLots = lotRepository.getAllLotsSync();
    results.sync = `✅ Синхронний: завантажено ${syncLots.length} лотів`;
  } catch (e) {
    results.sync = `❌ Синхронний: ${e.message}`;
  }

  // 2. Callback
  lotRepository.getAllLotsCallback((err, callbackLots) => {
    results.callback = err
      ? `❌ Callback: ${err.message}`
      : `✅ Callback: завантажено ${callbackLots.length} лотів`;

    // 3. Promise
    lotRepository.getAllLotsPromise()
      .then(promiseLots => {
        results.promise = `✅ Promise: завантажено ${promiseLots.length} лотів`;
      })
      .catch(e => { results.promise = `❌ Promise: ${e.message}`; })
      .finally(async () => {
        // 4. Async/await
        try {
          const asyncLots = await lotRepository.getAllLotsAsync();
          results.asyncAwait = `✅ Async/Await: завантажено ${asyncLots.length} лотів`;
        } catch (e) {
          results.asyncAwait = `❌ Async/Await: ${e.message}`;
        }
        callback(results);
      });
  });
}

module.exports = {
  getActiveLots,
  searchLots,
  getLotById,
  getLotsByOwner,
  createLot,
  placeBid,
  deleteLot,
  startTrading,
  stopTrading,
  generateLotUrl,
  demoAllIOApproaches,
};
