const express = require('express');
const router = express.Router();
const lotController = require('../controllers/lotController');

// Головна сторінка — список активних лотів + пошук
router.get('/', lotController.index);

// Демо методів вводу-виводу
router.get('/io-demo', lotController.ioDemo);

// Мої лоти
router.get('/my-lots', lotController.myLots);

// Форма створення лоту
router.get('/lots/new', lotController.newForm);

// Створити лот
router.post('/lots', lotController.create);

// Деталі лоту
router.get('/lots/:id', lotController.show);

// Зробити ставку
router.post('/lots/:id/bid', lotController.bid);

// Видалити лот
router.post('/lots/:id/delete', lotController.destroy);

// Запустити торги
router.post('/lots/:id/start', lotController.startTrading);

// Зупинити торги
router.post('/lots/:id/stop', lotController.stopTrading);

module.exports = router;
