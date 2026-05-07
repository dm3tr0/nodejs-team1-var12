const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../../data/users.json');

async function findAll() {
  const data = await fs.promises.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function findById(id) {
  const users = await findAll();
  return users.find(u => u.id === id) || null;
}

module.exports = { findAll, findById };
