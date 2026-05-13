require('dotenv').config();
const express    = require('express');
const path       = require('path');
const cookieParser = require('cookie-parser');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes     = require('./routes/index');
const { getPool, closePool } = require('./db/pool');
const { initializeDatabase } = require('./db/init');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Шаблонізатор EJS ─────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ─── Middleware ───────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// ─── Маршрути ─────────────────────────────────────────────────
app.use('/', routes);

// ─── Обробники помилок ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Запуск: спочатку ініціалізуємо БД, потім слухаємо ─────
async function start() {
  try {
    // Initialize database and tables
    await initializeDatabase();
    
    // Test connection
    await getPool();
    
    app.listen(PORT, () => {
      console.log(`🔨 АукціонUA запущено: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Не вдалося підключитися до MySQL:', err.message);
    process.exit(1);
  }
}

// ─── Graceful shutdown ────────────────────────────────────────
process.on('SIGINT',  async () => { await closePool(); process.exit(0); });
process.on('SIGTERM', async () => { await closePool(); process.exit(0); });

start();

module.exports = app;
