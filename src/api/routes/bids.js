/**
 * src/api/routes/bids.js
 * REST API routes for Bids resource with validation
 */

const express = require('express');
const router = express.Router();
const BidsController = require('../controllers/bidsController');
const { bidValidation, paramValidation, queryValidation } = require('../validators/validation');
const { authenticate, authorize, requireOwnership } = require('../../auth/middleware/auth');

// CRUD Routes for Bids

// GET /api/bids - Read all bids with filtering and pagination (authenticated)
router.get('/', 
  authenticate,
  queryValidation.pagination,
  queryValidation.bidFilters,
  BidsController.getAll
);

// GET /api/bids/:lotId/:bidderId - Read a specific bid (composite key) (authenticated)
router.get('/:lotId/:bidderId', 
  authenticate,
  paramValidation.lotId,
  paramValidation.bidderId,
  BidsController.getById
);

// POST /api/bids - Create a new bid (authenticated)
router.post('/', 
  authenticate,
  bidValidation.create,
  BidsController.create
);

// PUT /api/bids/:lotId/:bidderId - Update a bid (bidder or admin)
router.put('/:lotId/:bidderId', 
  authenticate,
  paramValidation.lotId,
  paramValidation.bidderId,
  requireOwnership('bidderId'),
  bidValidation.update,
  BidsController.update
);

// DELETE /api/bids/:lotId/:bidderId - Delete a bid (bidder or admin)
router.delete('/:lotId/:bidderId', 
  authenticate,
  paramValidation.lotId,
  paramValidation.bidderId,
  requireOwnership('bidderId'),
  BidsController.delete
);

// Specialized Routes

// GET /api/bids/lot/:lotId - Get bids for a specific lot
router.get('/lot/:lotId', 
  paramValidation.lotId,
  queryValidation.pagination,
  BidsController.getBidsByLot
);

// GET /api/bids/bidder/:bidderId - Get bids for a specific bidder (authenticated)
router.get('/bidder/:bidderId', 
  authenticate,
  paramValidation.bidderId,
  requireOwnership('bidderId'),
  BidsController.getBidsByBidder
);

// GET /api/bids/highest/:lotId - Get highest bid for a lot
router.get('/highest/:lotId', 
  paramValidation.lotId,
  BidsController.getHighestBid
);

// GET /api/bids/statistics/:lotId - Get bid statistics for a lot
router.get('/statistics/:lotId', 
  paramValidation.lotId,
  BidsController.getStatistics
);

// GET /api/bids/analysis/:lotId - Get competitive bidding analysis
router.get('/analysis/:lotId', 
  paramValidation.lotId,
  BidsController.getCompetitiveAnalysis
);

module.exports = router;
