/**
 * src/repositories/lotRepository.js
 *
 * Репозиторій лотів — працює з MS SQL Server через пул з'єднань.
 * Публічний API залишився таким самим, як у попередній JSON-версії,
 * тому lotService.js не потребує змін.
 *
 * CRUD для Lots:
 *   findAll()           — READ (усі)
 *   findById(id)        — READ (один)
 *   save(lot)           — CREATE або UPDATE (upsert)
 *   remove(id)          — DELETE
 *
 * Додатково:
 *   placeBid(lotId, bid) — бізнес-операція з транзакцією:
 *                          UPDATE lots + INSERT bids атомарно.
 *                          При помилці — автоматичний ROLLBACK.
 */

const { getPool, mysql } = require('../db/pool');


// ─── Допоміжна функція: рядок keywords → масив ───────────────
function parseKeywords(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ─── Допоміжна функція: рядок бази → об'єкт лоту ────────────
function rowToLot(row) {
  return {
    id:           row.id,
    title:        row.title,
    description:  row.description,
    startPrice:   Number(row.start_price),
    currentPrice: Number(row.current_price),
    ownerId:      row.owner_id,
    ownerName:    row.owner_name,
    status:       row.status,
    keywords:     parseKeywords(row.keywords),
    imageUrl:     row.image_url,
    createdAt:    row.created_at,
    bids:         [],           // заповнюється окремим запитом
  };
}

// ─── Допоміжна функція: завантажити ставки для списку lot_id ─
async function loadBids(pool, lotIds) {
  if (!lotIds.length) return {};

  // будуємо IN-список через MySQL placeholders (?, ?, ...)
  const placeholders = lotIds.map(() => '?').join(',');

  const result = await pool.query(`
    SELECT lot_id, bidder_id, bidder_name, amount, created_at
    FROM   Bids
    WHERE  lot_id IN (${placeholders})
    ORDER  BY created_at ASC
  `, lotIds);

  const map = {};
  for (const row of result[0]) {
    if (!map[row.lot_id]) map[row.lot_id] = [];
    map[row.lot_id].push({
      bidderId:   row.bidder_id,
      bidderName: row.bidder_name,
      amount:     Number(row.amount),
      createdAt:  row.created_at,
    });
  }
  return map;
}


// ═══════════════════════════════════════════════════════════════
// READ — отримати всі лоти
// ═══════════════════════════════════════════════════════════════
async function findAll() {
  const pool   = await getPool();
  const result = await pool.query(`
    SELECT id, title, description, start_price, current_price,
           owner_id, owner_name, status, keywords, image_url, created_at
    FROM   Lots
    ORDER  BY created_at DESC
  `);

  const lots   = result[0].map(rowToLot);
  const lotIds = lots.map(l => l.id);
  const bidsMap = await loadBids(pool, lotIds);

  for (const lot of lots) {
    lot.bids = bidsMap[lot.id] || [];
  }
  return lots;
}


// ═══════════════════════════════════════════════════════════════
// READ — знайти один лот за id
// ═══════════════════════════════════════════════════════════════
async function findById(id) {
  const pool   = await getPool();
  const result = await pool.query(`
      SELECT id, title, description, start_price, current_price,
             owner_id, owner_name, status, keywords, image_url, created_at
      FROM   Lots
      WHERE  id = ?
    `, [id]);

  if (!result[0].length) return null;

  const lot = rowToLot(result[0][0]);

  const bidsResult = await pool.query(`
      SELECT bidder_id, bidder_name, amount, created_at
      FROM   Bids
      WHERE  lot_id = ?
      ORDER  BY created_at ASC
    `, [id]);

  lot.bids = bidsResult[0].map(r => ({
    bidderId:   r.bidder_id,
    bidderName: r.bidder_name,
    amount:     Number(r.amount),
    createdAt:  r.created_at,
  }));

  return lot;
}


// ═══════════════════════════════════════════════════════════════
// CREATE / UPDATE — зберегти лот (upsert)
// ═══════════════════════════════════════════════════════════════
async function save(lot) {
  const pool = await getPool();

  // Перевіряємо чи існує запис
  const exists = await pool.query('SELECT 1 FROM Lots WHERE id = ?', [lot.id]);

  const keywordsJson = JSON.stringify(lot.keywords || []);

  if (exists[0].length === 0) {
    // ── CREATE ────────────────────────────────────────────────
    await pool.query(`
        INSERT INTO Lots
          (id, title, description, start_price, current_price,
           owner_id, owner_name, status, keywords, image_url, created_at)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        lot.id,
        lot.title,
        lot.description,
        lot.startPrice,
        lot.currentPrice,
        lot.ownerId,
        lot.ownerName,
        lot.status,
        keywordsJson,
        lot.imageUrl || null,
        new Date(lot.createdAt)
      ]);
  } else {
    // ── UPDATE ────────────────────────────────────────────────
    await pool.query(`
        UPDATE Lots SET
          title         = ?,
          description   = ?,
          current_price = ?,
          status        = ?,
          keywords      = ?,
          image_url     = ?
        WHERE id = ?
      `, [
        lot.title,
        lot.description,
        lot.currentPrice,
        lot.status,
        keywordsJson,
        lot.imageUrl || null,
        lot.id
      ]);
  }

  return lot;
}


// ═══════════════════════════════════════════════════════════════
// DELETE — видалити лот (каскадно видаляє Bids через ON DELETE CASCADE)
// ═══════════════════════════════════════════════════════════════
async function remove(id) {
  const pool = await getPool();
  await pool.query('DELETE FROM Lots WHERE id = ?', [id]);
}


// ═══════════════════════════════════════════════════════════════
// ТРАНЗАКЦІЯ — зробити ставку
//
// Бізнес-правила:
//   1. Лот існує і активний
//   2. Власник не може ставити на свій лот
//   3. Сума більша за поточну ціну
//
// Якщо все ок  → COMMIT (UPDATE Lots + INSERT Bids)
// Якщо помилка → ROLLBACK (БД залишається незмінною)
// ═══════════════════════════════════════════════════════════════
async function placeBid(lotId, { bidderId, bidderName, amount }) {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Зчитати поточний стан лоту (з блокуванням рядка)
    const lotResult = await connection.query(`
      SELECT id, owner_id, status, current_price
      FROM   Lots
      WHERE  id = ? FOR UPDATE
    `, [lotId]);

    if (!lotResult[0].length) {
      throw new Error('Лот не знайдено');
    }

    const lot = lotResult[0][0];

    // 2. Бізнес-валідація (усередині транзакції)
    if (lot.status !== 'active') {
      throw new Error('Торги на цьому лоті не активні');
    }
    if (lot.owner_id === bidderId) {
      throw new Error('Власник не може робити ставки на свій лот');
    }

    const bidAmount = Number(amount);
    if (!Number.isInteger(bidAmount) || bidAmount <= Number(lot.current_price)) {
      throw new Error(`Ставка має бути цілим числом, більшим за ${lot.current_price} грн`);
    }

    // 3. Оновити поточну ціну лоту
    await connection.query(
      'UPDATE Lots SET current_price = ? WHERE id = ?',
      [bidAmount, lotId]
    );

    // 4. Додати ставку
    await connection.query(`
      INSERT INTO Bids (lot_id, bidder_id, bidder_name, amount, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [lotId, bidderId, bidderName, bidAmount, new Date()]);

    // ✅ COMMIT — обидві операції виконані успішно
    await connection.commit();
    console.log(`✅ Ставку ${bidAmount} грн на лот ${lotId} підтверджено`);

  } catch (err) {
    // ❌ ROLLBACK — будь-яка помилка відкочує всі зміни
    try { await connection.rollback(); } catch (_) {}
    console.error(`❌ Ставку відкинуто: ${err.message}`);
    throw err; // пробрасуємо далі — контролер покаже помилку користувачу
  } finally {
    connection.release();
  }
}


// ═══════════════════════════════════════════════════════════════
// Публічний API (той самий інтерфейс, що і JSON-версія)
// ═══════════════════════════════════════════════════════════════
module.exports = {
  findAll,
  findById,
  save,
  remove,
  placeBid,     // нова — замінює логіку в lotService
};
