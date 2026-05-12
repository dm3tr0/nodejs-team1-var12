/**
 * src/api/controllers/bidsController.js
 * REST API controller for Bids resource
 * Implements full CRUD operations with filtering, pagination, and proper HTTP status codes
 */

const BidRepository = require('../../repositories/orm/BidRepository');
const { validationResult } = require('express-validator');

class BidsController {
  /**
   * GET /api/bids
   * Read all bids with filtering and pagination
   * HTTP Status: 200 (success), 400 (validation error), 500 (server error)
   */
  static async getAll(req, res) {
    try {
      // Extract query parameters for filtering and pagination
      const {
        page = 1,
        limit = 10,
        lotId,
        bidderId,
        minAmount,
        maxAmount,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      // Validate pagination parameters
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters',
          error: 'Page must be >= 1, limit must be between 1 and 100'
        });
      }

      let bids;
      
      // Apply filters
      if (lotId && bidderId) {
        const bid = await BidRepository.findByLotAndBidder(lotId, bidderId);
        bids = bid ? [bid] : [];
      } else if (lotId) {
        bids = await BidRepository.findByLot(lotId);
      } else if (bidderId) {
        bids = await BidRepository.findByBidder(bidderId);
      } else {
        bids = await BidRepository.findAll();
      }

      // Apply amount filtering
      if (minAmount !== undefined || maxAmount !== undefined) {
        bids = await BidRepository.findByAmountRange(
          parseFloat(minAmount) || 0,
          parseFloat(maxAmount) || Number.MAX_SAFE_INTEGER
        );
      }

      // Apply sorting
      bids.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Apply pagination
      const total = bids.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedBids = bids.slice(startIndex, endIndex);

      // Load relationships for paginated results
      for (const bid of paginatedBids) {
        if (!bid._lot) bid._lot = await bid.getLot();
        if (!bid._bidder) bid._bidder = await bid.getBidder();
        bid._rank = await bid.getRank();
      }

      res.status(200).json({
        success: true,
        message: 'Bids retrieved successfully',
        data: {
          bids: paginatedBids,
          pagination: {
            currentPage: pageNum,
            totalPages: totalPages,
            totalItems: total,
            itemsPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPreviousPage: pageNum > 1
          },
          filters: {
            lotId,
            bidderId,
            minAmount,
            maxAmount,
            sortBy,
            sortOrder
          }
        }
      });

    } catch (error) {
      console.error('Error fetching bids:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/bids/:lotId/:bidderId
   * Read a specific bid by lot and bidder (composite key)
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getById(req, res) {
    try {
      const { lotId, bidderId } = req.params;

      if (!lotId || !bidderId) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID and Bidder ID are required'
        });
      }

      const bid = await BidRepository.findByLotAndBidder(lotId, bidderId);

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found',
          error: `Bid for lot ${lotId} by bidder ${bidderId} does not exist`
        });
      }

      // Load relationships
      bid._lot = await bid.getLot();
      bid._bidder = await bid.getBidder();
      bid._rank = await bid.getRank();

      res.status(200).json({
        success: true,
        message: 'Bid retrieved successfully',
        data: bid
      });

    } catch (error) {
      console.error('Error fetching bid:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * POST /api/bids
   * Create a new bid
   * HTTP Status: 201 (created), 400 (validation error), 500 (server error)
   */
  static async create(req, res) {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const bidData = {
        ...req.body,
        createdAt: new Date()
      };

      const bid = await BidRepository.create(bidData);

      // Load relationships
      bid._lot = await bid.getLot();
      bid._bidder = await bid.getBidder();

      res.status(201).json({
        success: true,
        message: 'Bid created successfully',
        data: bid
      });

    } catch (error) {
      console.error('Error creating bid:', error);
      
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/bids/:lotId/:bidderId
   * Update an existing bid
   * HTTP Status: 200 (success), 400 (validation error), 404 (not found), 500 (server error)
   */
  static async update(req, res) {
    try {
      const { lotId, bidderId } = req.params;

      if (!lotId || !bidderId) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID and Bidder ID are required'
        });
      }

      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Check if bid exists
      const existingBid = await BidRepository.findByLotAndBidder(lotId, bidderId);
      if (!existingBid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found',
          error: `Bid for lot ${lotId} by bidder ${bidderId} does not exist`
        });
      }

      const updatedBid = await BidRepository.update(lotId, bidderId, req.body);

      // Load relationships
      updatedBid._lot = await updatedBid.getLot();
      updatedBid._bidder = await updatedBid.getBidder();

      res.status(200).json({
        success: true,
        message: 'Bid updated successfully',
        data: updatedBid
      });

    } catch (error) {
      console.error('Error updating bid:', error);
      
      if (error.message.includes('Validation failed') || error.message.includes('No valid fields')) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/bids/:lotId/:bidderId
   * Delete a bid
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async delete(req, res) {
    try {
      const { lotId, bidderId } = req.params;

      if (!lotId || !bidderId) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID and Bidder ID are required'
        });
      }

      // Check if bid exists
      const existingBid = await BidRepository.findByLotAndBidder(lotId, bidderId);
      if (!existingBid) {
        return res.status(404).json({
          success: false,
          message: 'Bid not found',
          error: `Bid for lot ${lotId} by bidder ${bidderId} does not exist`
        });
      }

      await BidRepository.delete(lotId, bidderId);

      res.status(200).json({
        success: true,
        message: 'Bid deleted successfully',
        data: {
          lotId: lotId,
          bidderId: bidderId,
          deleted: true
        }
      });

    } catch (error) {
      console.error('Error deleting bid:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/bids/lot/:lotId
   * Get bids for a specific lot with full information
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getBidsByLot(req, res) {
    try {
      const { lotId } = req.params;
      const { limit = 50 } = req.query;

      if (!lotId) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
        });
      }

      const limitNum = parseInt(limit);
      if (limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit parameter',
          error: 'Limit must be between 1 and 100'
        });
      }

      const bids = await BidRepository.getBidHistory(lotId, limitNum);

      res.status(200).json({
        success: true,
        message: 'Lot bids retrieved successfully',
        data: {
          lotId: lotId,
          bids: bids,
          totalBids: bids.length
        }
      });

    } catch (error) {
      console.error('Error fetching lot bids:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/bids/bidder/:bidderId
   * Get bids for a specific bidder
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getBidsByBidder(req, res) {
    try {
      const { bidderId } = req.params;

      if (!bidderId) {
        return res.status(400).json({
          success: false,
          message: 'Bidder ID is required'
        });
      }

      const bids = await BidRepository.findByBidder(bidderId);

      // Load relationships
      for (const bid of bids) {
        bid._lot = await bid.getLot();
        bid._isWinner = await bid.isHighest();
      }

      res.status(200).json({
        success: true,
        message: 'Bidder bids retrieved successfully',
        data: {
          bidderId: bidderId,
          bids: bids,
          totalBids: bids.length,
          totalAmount: bids.reduce((sum, bid) => sum + bid.amount, 0),
          winningBids: bids.filter(bid => bid._isWinner).length
        }
      });

    } catch (error) {
      console.error('Error fetching bidder bids:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/bids/highest/:lotId
   * Get highest bid for a lot
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getHighestBid(req, res) {
    try {
      const { lotId } = req.params;

      if (!lotId) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
        });
      }

      const bid = await BidRepository.getHighestBid(lotId);

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'No bids found',
          error: `No bids exist for lot ${lotId}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Highest bid retrieved successfully',
        data: bid
      });

    } catch (error) {
      console.error('Error fetching highest bid:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/bids/statistics/:lotId
   * Get bid statistics for a lot
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getStatistics(req, res) {
    try {
      const { lotId } = req.params;

      if (!lotId) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
        });
      }

      const statistics = await BidRepository.getBidStatistics(lotId);

      res.status(200).json({
        success: true,
        message: 'Bid statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      console.error('Error fetching bid statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/bids/analysis/:lotId
   * Get competitive bidding analysis for a lot
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getCompetitiveAnalysis(req, res) {
    try {
      const { lotId } = req.params;

      if (!lotId) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
        });
      }

      const analysis = await BidRepository.getCompetitiveAnalysis(lotId);

      res.status(200).json({
        success: true,
        message: 'Competitive analysis retrieved successfully',
        data: analysis
      });

    } catch (error) {
      console.error('Error fetching competitive analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = BidsController;
