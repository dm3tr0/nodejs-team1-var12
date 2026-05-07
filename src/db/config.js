module.exports = {
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_DATABASE,
  user:     process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  connectionLimit: parseInt(process.env.DB_POOL_MAX) || 10,
  ssl: {
    rejectUnauthorized: false,
    allowPublicKeyRetrieval: true
  }
};