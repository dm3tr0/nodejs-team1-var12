const express = require('express');
const router = express.Router();
const lotController = require('../controllers/lotController');
const ormRoutes = require('./orm');
const apiRoutes = require('../api/routes');
const apiTesterRoutes = require('./api-tester');
const authRoutes = require('./auth');
const { webAuthenticate, requireAuth } = require('../auth/middleware/webAuth');

// Apply web authentication to all routes
router.use(webAuthenticate);

// Auth routes
router.use('/auth', authRoutes);

// Головна сторінка — список активних лотів + пошук
router.get('/', lotController.index);

// Демо методів вводу-виводу
router.get('/io-demo', lotController.ioDemo);

// Мої лоти
router.get('/my-lots', requireAuth, lotController.myLots);

// Форма створення лоту
router.get('/lots/new', requireAuth, lotController.newForm);

// Створити лот
router.post('/lots', requireAuth, lotController.create);

// Деталі лоту
router.get('/lots/:id', lotController.show);

// Зробити ставку
router.post('/lots/:id/bid', requireAuth, lotController.bid);

// Видалити лот
router.post('/lots/:id/delete', requireAuth, lotController.destroy);

// Запустити торги
router.post('/lots/:id/start', requireAuth, lotController.startTrading);

// Зупинити торги
router.post('/lots/:id/stop', requireAuth, lotController.stopTrading);

// ORM demonstration routes
router.use('/orm', ormRoutes);

// REST API routes
router.use('/api', apiRoutes);

// API Tester route
router.use('/api-tester', apiTesterRoutes);

module.exports = router;
