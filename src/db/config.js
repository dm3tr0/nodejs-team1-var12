module.exports = {
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT, 10) || 3306,
  database: process.env.DB_DATABASE || 'auction',
  user:     process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  connectionLimit: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  ssl: {
    rejectUnauthorized: false,
    allowPublicKeyRetrieval: true
  }
};