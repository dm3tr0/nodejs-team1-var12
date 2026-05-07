/**
 * src/routes/orm.js
 * Routes for ORM demonstration endpoints
 */

const express = require('express');
const router = express.Router();
const ORMController = require('../controllers/ormController');

// Main demonstration endpoint - shows all ORM functionality
router.get('/demonstrate', ORMController.demonstrate);

// Individual demonstration endpoints
router.get('/crud', ORMController.demonstrateCRUD);
router.get('/transactions', ORMController.demonstrateTransactions);
router.get('/business', ORMController.demonstrateBusiness);
router.get('/relationships', ORMController.demonstrateRelationships);

module.exports = router;
