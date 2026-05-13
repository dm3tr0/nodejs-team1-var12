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
    const dbName = tempConfig.database || 'auction';
    tempConfig.database = undefined;
    
    const tempPool = mysql.createPool(tempConfig);
    const connection = await tempPool.getConnection();
    
    if (!dbName) {
      throw new Error('Database name is not configured. Set DB_DATABASE in .env or environment variables.');
    }

    try {
      // Create database if it doesn't exist
      await connection.query('CREATE DATABASE IF NOT EXISTS ??', [dbName]);
      console.log(`✅ Database '${dbName}' created or already exists`);

    } finally {
      connection.release();
      await tempPool.end();
    }

    // Now connect to the specific database
    config.database = dbName;
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
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

  // Alter existing tables to add missing columns
  await alterTables(pool);
}

/**
 * Alter existing tables to add missing columns
 */
async function alterTables(pool) {
  try {
    // Check and add password column to Users table
    const passwordColumnExists = await columnExists(pool, 'Users', 'password');
    if (!passwordColumnExists) {
      await pool.query('ALTER TABLE Users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ""');
      console.log('✅ Added password column to Users table');
    }

    // Check and add role column to Users table
    const roleColumnExists = await columnExists(pool, 'Users', 'role');
    if (!roleColumnExists) {
      await pool.query('ALTER TABLE Users ADD COLUMN role VARCHAR(20) DEFAULT "user"');
      console.log('✅ Added role column to Users table');
    }

    // Check and add created_at column to Users table
    const createdAtColumnExists = await columnExists(pool, 'Users', 'created_at');
    if (!createdAtColumnExists) {
      await pool.query('ALTER TABLE Users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ Added created_at column to Users table');
    }

    // Check and add updated_at column to Users table
    const updatedAtColumnExists = await columnExists(pool, 'Users', 'updated_at');
    if (!updatedAtColumnExists) {
      await pool.query('ALTER TABLE Users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      console.log('✅ Added updated_at column to Users table');
    }

  } catch (error) {
    console.error('❌ Failed to alter tables:', error.message);
    throw error;
  }
}

/**
 * Check if a column exists in a table
 */
async function columnExists(pool, tableName, columnName) {
  try {
    const result = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [tableName, columnName]);
    return result[0].length > 0;
  } catch (error) {
    console.error(`❌ Failed to check if column ${columnName} exists in ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Run database migrations for existing tables
 */
async function runMigrations(pool) {
  console.log('🔄 Running database migrations...');

  try {
    // Check if Users table has password column
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'password'
    `, [config.database]);

    if (columns.length === 0) {
      console.log('📝 Adding password column to Users table...');
      await pool.query(`
        ALTER TABLE Users 
        ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '',
        ADD COLUMN role VARCHAR(20) DEFAULT 'user',
        ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✅ Users table migrated successfully');
    } else {
      console.log('✅ Users table already has required columns');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    // Don't throw error for migrations, just log it
  }
}

module.exports = { initializeDatabase };
