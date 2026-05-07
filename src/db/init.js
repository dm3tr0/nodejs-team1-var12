/**
 * src/db/init.js
 * Database initialization - creates database and tables if they don't exist
 */

const { getPool, mysql } = require('./pool');
const config = require('./config');

/**
 * Initialize database and tables
 */
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');

    // First connect without specifying database to create it
    const tempConfig = { ...config };
    delete tempConfig.database;
    
    const tempPool = mysql.createPool(tempConfig);
    const connection = await tempPool.getConnection();

    try {
      // Create database if it doesn't exist
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
      console.log(`✅ Database '${config.database}' created or already exists`);
    } finally {
      connection.release();
      await tempPool.end();
    }

    // Now connect to the specific database
    const pool = await getPool();
    
    // Create tables if they don't exist
    await createTables(pool);
    
    console.log('✅ Database initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

/**
 * Create all required tables
 */
async function createTables(pool) {
  const tables = [
    {
      name: 'Users',
      sql: `
        CREATE TABLE IF NOT EXISTS Users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL
        )
      `
    },
    {
      name: 'Lots',
      sql: `
        CREATE TABLE IF NOT EXISTS Lots (
          id VARCHAR(50) PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          description TEXT,
          start_price DECIMAL(18,2) NOT NULL,
          current_price DECIMAL(18,2) NOT NULL,
          owner_id VARCHAR(50) NOT NULL,
          owner_name VARCHAR(100) NOT NULL,
          status VARCHAR(10) DEFAULT 'active',
          keywords VARCHAR(500),
          image_url VARCHAR(500),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: 'Bids',
      sql: `
        CREATE TABLE IF NOT EXISTS Bids (
          lot_id VARCHAR(50) NOT NULL,
          bidder_id VARCHAR(50) NOT NULL,
          bidder_name VARCHAR(100) NOT NULL,
          amount DECIMAL(18,2) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (lot_id, bidder_id, created_at)
        )
      `
    }
  ];

  for (const table of tables) {
    try {
      await pool.query(table.sql);
      console.log(`✅ Table '${table.name}' created or already exists`);
    } catch (error) {
      console.error(`❌ Failed to create table '${table.name}':`, error.message);
      throw error;
    }
  }
}

module.exports = { initializeDatabase };
