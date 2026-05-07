/**
 * src/repositories/userRepository.js
 *
 * Репозиторій користувачів для MS SQL Server.
 * Публічний API збігається з попередньою JSON-версією.
 */

const { getPool, mysql } = require('../db/pool');


async function findAll() {
  const pool   = await getPool();
  const result = await pool.query(
    'SELECT id, name, email FROM Users ORDER BY name'
  );
  return result[0];
}


async function findById(id) {
  const pool   = await getPool();
  const result = await pool.query(
    'SELECT id, name, email FROM Users WHERE id = ?', [id]
  );

  return result[0][0] || null;
}


module.exports = { findAll, findById };
