/**
 * src/api/routes/users.js
 * REST API routes for Users resource with validation
 */

const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/usersController');
const { userValidation, paramValidation, queryValidation } = require('../validators/validation');
const { authenticate, authorize, requireOwnership } = require('../../auth/middleware/auth');

// CRUD Routes for Users

// GET /api/users - Read all users with filtering and pagination
router.get('/', 
  queryValidation.pagination,
  queryValidation.userFilters,
  UsersController.getAll
);

// GET /api/users/:id - Read a single user
router.get('/:id', 
  paramValidation.id,
  UsersController.getById
);

// POST /api/users - Create a new user (admin only)
router.post('/', 
  authenticate,
  authorize('admin'),
  userValidation.create,
  UsersController.create
);

// PUT /api/users/:id - Update a user (owner or admin)
router.put('/:id', 
  authenticate,
  paramValidation.id,
  requireOwnership('id'),
  userValidation.update,
  UsersController.update
);

// DELETE /api/users/:id - Delete a user (admin only)
router.delete('/:id', 
  authenticate,
  authorize('admin'),
  paramValidation.id,
  UsersController.delete
);

// Relationship Routes

// GET /api/users/:id/lots - Get user's lots with bid information (authenticated)
router.get('/:id/lots', 
  authenticate,
  paramValidation.id,
  requireOwnership('id'),
  UsersController.getUserLots
);

// GET /api/users/:id/bids - Get user's bid history (authenticated)
router.get('/:id/bids', 
  authenticate,
  paramValidation.id,
  requireOwnership('id'),
  UsersController.getUserBids
);

// GET /api/users/:id/statistics - Get user statistics (authenticated)
router.get('/:id/statistics', 
  authenticate,
  paramValidation.id,
  requireOwnership('id'),
  UsersController.getStatistics
);

// GET /api/users/ranking - Get user ranking by bids
router.get('/ranking', 
  queryValidation.pagination,
  UsersController.getRanking
);

module.exports = router;
