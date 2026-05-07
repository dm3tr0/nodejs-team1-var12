const express = require('express');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── НАЛАШТУВАННЯ ШАБЛОНІЗАТОРА EJS ──────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── МАРШРУТИ ─────────────────────────────────────────────────────────────
app.use('/', routes);

// ─── ОБРОБНИКИ ПОМИЛОК ────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── ЗАПУСК СЕРВЕРА ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🔨 Аукціон запущено: http://localhost:${PORT}`);
});

module.exports = app;
