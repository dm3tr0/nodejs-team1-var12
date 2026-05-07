/**
 * src/db/pool.js
 * Singleton пулу з'єднань до MySQL.
 *
 * Використання:
 *   const pool = require('./pool');
 *   const result = await pool.query('SELECT 1');
 */

const mysql  = require('mysql2/promise');
const config = require('./config');

let _pool = null;

/**
 * Повертає (або створює) singleton пул з'єднань.
 * @returns {Promise<mysql.Pool>}
 */
async function getPool() {
  if (_pool) return _pool;

  try {
    _pool = mysql.createPool(config);

    // Add error handling for the pool
    _pool.on('error', (err) => {
      console.error('❌ MySQL Pool error:', err);
      if (err.fatal) {
        _pool = null; // Reset pool for reconnection
      }
    });

    console.log('✅ MySQL: пул підключень встановлено');
    return _pool;
  } catch (err) {
    console.error('❌ Не вдалося створити пул MySQL:', err.message);
    _pool = null;
    throw err;
  }
}

/**
 * Закриває пул (для graceful shutdown).
 */
async function closePool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    console.log('🔌 MySQL Pool: закрито');
  }
}

module.exports = { getPool, closePool, mysql };
