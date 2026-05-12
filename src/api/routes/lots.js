/**
 * src/api/routes/lots.js
 * REST API routes for Lots resource with validation
 */

const express = require('express');
const router = express.Router();
const LotsController = require('../controllers/lotsController');
const { lotValidation, paramValidation, queryValidation } = require('../validators/validation');
const { authenticate, authorize, requireOwnership } = require('../../auth/middleware/auth');

// CRUD Routes for Lots

// GET /api/lots - Read all lots with filtering and pagination
router.get('/', 
  queryValidation.pagination,
  queryValidation.lotFilters,
  LotsController.getAll
);

// GET /api/lots/:id - Read a single lot
router.get('/:id', 
  paramValidation.id,
  LotsController.getById
);

// POST /api/lots - Create a new lot (authenticated)
router.post('/', 
  authenticate,
  lotValidation.create,
  LotsController.create
);

// PUT /api/lots/:id - Update a lot (owner or admin)
router.put('/:id', 
  authenticate,
  paramValidation.id,
  requireOwnership('ownerId'),
  lotValidation.update,
  LotsController.update
);

// DELETE /api/lots/:id - Delete a lot (owner or admin)
router.delete('/:id', 
  authenticate,
  paramValidation.id,
  requireOwnership('ownerId'),
  LotsController.delete
);

// Business Operation Routes

// POST /api/lots/:id/bid - Place a bid on a lot (authenticated)
router.post('/:id/bid', 
  authenticate,
  paramValidation.id,
  lotValidation.bid,
  LotsController.placeBid
);

// GET /api/lots/:id/statistics - Get lot statistics
router.get('/:id/statistics', 
  paramValidation.id,
  LotsController.getStatistics
);

module.exports = router;
