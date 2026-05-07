// 404 handler
function notFound(req, res) {
  res.status(404).render('error', {
    title: '404 — Сторінку не знайдено',
    message: `Сторінка "${req.originalUrl}" не існує.`,
  });
}

// Global error handler
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Помилка сервера',
    message: err.message || 'Щось пішло не так',
  });
}

module.exports = { notFound, errorHandler };
