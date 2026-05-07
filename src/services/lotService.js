/**
 * src/services/lotService.js
 *
 * Рівень бізнес-логіки (без змін у публічному API).
 * Єдина зміна відносно JSON-версії: placeBid тепер делегує
 * всю роботу в lotRepository.placeBid(), де виконується транзакція.
 */

const lotRepository = require('../repositories/lotRepository');
const { v4: uuidv4 } = require('uuid');


// ─── DTO — структура даних між рівнями ───────────────────────
class LotDTO {
  constructor(lot) {
    this.id           = lot.id;
    this.title        = lot.title;
    this.description  = lot.description;
    this.startPrice   = lot.startPrice;
    this.currentPrice = lot.currentPrice;
    this.ownerId      = lot.ownerId;
    this.ownerName    = lot.ownerName;
    this.status       = lot.status;
    this.keywords     = lot.keywords;
    this.imageUrl     = lot.imageUrl;
    this.createdAt    = lot.createdAt;
    this.bids         = lot.bids || [];
    this.publicUrl    = `/lots/${lot.id}`;
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


// ─── Усі активні лоти ────────────────────────────────────────
async function getActiveLots() {
  const lots = await lotRepository.findAll();
  return lots
    .filter(l => l.status === 'active')
    .map(l => new LotDTO(l));
}


// ─── Пошук за ключовими словами ──────────────────────────────
async function searchLots(query) {
  if (!query || !query.trim()) return getActiveLots();
  const q    = query.toLowerCase().trim();
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


// ─── Лот за id ───────────────────────────────────────────────
async function getLotById(id) {
  const lot = await lotRepository.findById(id);
  if (!lot) return null;
  return new LotDTO(lot);
}


// ─── Лоти конкретного власника ───────────────────────────────
async function getLotsByOwner(ownerId) {
  const lots = await lotRepository.findAll();
  return lots
    .filter(l => l.ownerId === ownerId)
    .map(l => new LotDTO(l));
}


// ─── Створити лот ────────────────────────────────────────────
async function createLot({ title, description, startPrice, keywords, ownerId, ownerName }) {
  if (!title || !description || !startPrice) {
    throw new Error('Заповніть всі обов\'язкові поля');
  }
  if (isNaN(startPrice) || Number(startPrice) <= 0) {
    throw new Error('Стартова ціна має бути позитивним числом');
  }

  const lot = {
    id:           `lot-${uuidv4().slice(0, 8)}`,
    title:        title.trim(),
    description:  description.trim(),
    startPrice:   Number(startPrice),
    currentPrice: Number(startPrice),
    ownerId,
    ownerName,
    status:      'stopped',
    keywords:     keywords
      ? keywords.split(',').map(k => k.trim()).filter(Boolean)
      : [],
    imageUrl:    `https://placehold.co/400x300/1a1a2e/e0e0e0?text=${encodeURIComponent(title.slice(0, 15))}`,
    createdAt:   new Date().toISOString(),
    bids:        [],
  };

  await lotRepository.save(lot);
  return new LotDTO(lot);
}


// ─── Зробити ставку (транзакція виконується в репозиторії) ───
async function placeBid(lotId, { bidderId, bidderName, amount }) {
  // Вся бізнес-валідація + UPDATE Lots + INSERT Bids — в одній транзакції
  await lotRepository.placeBid(lotId, { bidderId, bidderName, amount });
  // Повертаємо оновлений лот для відповіді клієнту
  return getLotById(lotId);
}


// ─── Видалити лот ────────────────────────────────────────────
async function deleteLot(lotId, requesterId) {
  const lot = await lotRepository.findById(lotId);
  if (!lot) throw new Error('Лот не знайдено');
  if (lot.ownerId !== requesterId) throw new Error('Тільки власник може видалити лот');
  await lotRepository.remove(lotId);
}


// ─── Запустити торги ─────────────────────────────────────────
async function startTrading(lotId, requesterId) {
  const lot = await lotRepository.findById(lotId);
  if (!lot) throw new Error('Лот не знайдено');
  if (lot.ownerId !== requesterId) throw new Error('Тільки власник може керувати торгами');
  if (lot.status === 'active') throw new Error('Торги вже активні');
  lot.status = 'active';
  await lotRepository.save(lot);
  return new LotDTO(lot);
}


// ─── Зупинити торги ──────────────────────────────────────────
async function stopTrading(lotId, requesterId) {
  const lot = await lotRepository.findById(lotId);
  if (!lot) throw new Error('Лот не знайдено');
  if (lot.ownerId !== requesterId) throw new Error('Тільки власник може керувати торгами');
  if (lot.status !== 'active') throw new Error('Торги не активні');
  lot.status = 'stopped';
  await lotRepository.save(lot);
  return new LotDTO(lot);
}


// ─── Згенерувати URL лоту ────────────────────────────────────
function generateLotUrl(lotId, baseUrl = 'http://localhost:3000') {
  return `${baseUrl}/lots/${lotId}`;
}


// ─── Демо методів вводу-виводу (залишаємо для сумісності) ────
function demoAllIOApproaches(callback) {
  // Тепер просто повертаємо результати SQL-запитів для демо-сторінки
  const results = {
    sync:       '✅ Синхронний: не застосовується (SQL — асинхронний)',
    callback:   '✅ Callback: підключення через mysql пул',
    promise:    '✅ Promise: pool.query()',
    asyncAwait: '✅ Async/Await: await pool.query()',
  };
  callback(results);
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
