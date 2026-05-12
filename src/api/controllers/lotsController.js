/**
 * src/api/controllers/lotsController.js
 * REST API controller for Lots resource
 * Implements full CRUD operations with filtering, pagination, and proper HTTP status codes
 */

const LotRepository = require('../../repositories/orm/LotRepository');
const { validationResult } = require('express-validator');

class LotsController {
  /**
   * GET /api/lots
   * Read all lots with filtering and pagination
   * HTTP Status: 200 (success), 400 (validation error), 500 (server error)
   */
  static async getAll(req, res) {
    try {
      // Extract query parameters for filtering and pagination
      const {
        page = 1,
        limit = 10,
        status,
        ownerId,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        minPrice,
        maxPrice
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

      // Build filter criteria
      const filters = {};
      if (status) filters.status = status;
      if (ownerId) filters.ownerId = ownerId;

      let lots;
      
      // Apply search or filters
      if (search) {
        lots = await LotRepository.searchByKeywords(search);
      } else if (Object.keys(filters).length > 0) {
        lots = await LotRepository.findBy(Object.keys(filters)[0], Object.values(filters)[0]);
      } else {
        lots = await LotRepository.findAll();
      }

      // Apply price filtering
      if (minPrice !== undefined || maxPrice !== undefined) {
        lots = lots.filter(lot => {
          if (minPrice !== undefined && lot.startPrice < parseFloat(minPrice)) return false;
          if (maxPrice !== undefined && lot.startPrice > parseFloat(maxPrice)) return false;
          return true;
        });
      }

      // Apply sorting
      lots.sort((a, b) => {
        const aVal = a[sortBy] || a[sortBy.replace('_', '')] || 0;
        const bVal = b[sortBy] || b[sortBy.replace('_', '')] || 0;
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Apply pagination
      const total = lots.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedLots = lots.slice(startIndex, endIndex);

      // Load relationships for paginated results
      for (const lot of paginatedLots) {
        lot._bids = await lot.getBids();
        lot._owner = await lot.getOwner();
        lot._highestBid = await lot.getHighestBid();
      }

      res.status(200).json({
        success: true,
        message: 'Lots retrieved successfully',
        data: {
          lots: paginatedLots,
          pagination: {
            currentPage: pageNum,
            totalPages: totalPages,
            totalItems: total,
            itemsPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPreviousPage: pageNum > 1
          },
          filters: {
            status,
            ownerId,
            search,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder
          }
        }
      });

    } catch (error) {
      console.error('Error fetching lots:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/lots/:id
   * Read a single lot by ID
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
        });
      }

      const lot = await LotRepository.getLotWithBidHistory(id);

      if (!lot) {
        return res.status(404).json({
          success: false,
          message: 'Lot not found',
          error: `Lot with ID ${id} does not exist`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Lot retrieved successfully',
        data: lot
      });

    } catch (error) {
      console.error('Error fetching lot:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * POST /api/lots
   * Create a new lot
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

      const lotData = {
        id: 'lot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...req.body,
        status: req.body.status || 'active',
        createdAt: new Date()
      };

      const lot = await LotRepository.create(lotData);

      res.status(201).json({
        success: true,
        message: 'Lot created successfully',
        data: lot
      });

    } catch (error) {
      console.error('Error creating lot:', error);
      
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
   * PUT /api/lots/:id
   * Update an existing lot
   * HTTP Status: 200 (success), 400 (validation error), 404 (not found), 500 (server error)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
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

      // Check if lot exists
      const existingLot = await LotRepository.findById(id);
      if (!existingLot) {
        return res.status(404).json({
          success: false,
          message: 'Lot not found',
          error: `Lot with ID ${id} does not exist`
        });
      }

      const updatedLot = await LotRepository.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Lot updated successfully',
        data: updatedLot
      });

    } catch (error) {
      console.error('Error updating lot:', error);
      
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
   * DELETE /api/lots/:id
   * Delete a lot
   * HTTP Status: 200 (success), 404 (not found), 400 (business rule violation), 500 (server error)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
        });
      }

      // Check if lot exists
      const existingLot = await LotRepository.findById(id);
      if (!existingLot) {
        return res.status(404).json({
          success: false,
          message: 'Lot not found',
          error: `Lot with ID ${id} does not exist`
        });
      }

      await LotRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Lot deleted successfully',
        data: {
          id: id,
          deleted: true
        }
      });

    } catch (error) {
      console.error('Error deleting lot:', error);
      
      if (error.message.includes('Cannot delete lot with existing bids')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete lot',
          error: 'Lot has existing bids and cannot be deleted'
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
   * POST /api/lots/:id/bid
   * Place a bid on a lot (business operation)
   * HTTP Status: 201 (created), 400 (validation error), 404 (not found), 500 (server error)
   */
  static async placeBid(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
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

      const bidData = {
        ...req.body,
        lotId: id
      };

      const bid = await LotRepository.placeBid(id, bidData);

      res.status(201).json({
        success: true,
        message: 'Bid placed successfully',
        data: bid
      });

    } catch (error) {
      console.error('Error placing bid:', error);
      
      if (error.message.includes('not found') || error.message.includes('not active') || 
          error.message.includes('cannot bid') || error.message.includes('greater than')) {
        return res.status(400).json({
          success: false,
          message: 'Bid placement failed',
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
   * GET /api/lots/:id/statistics
   * Get lot statistics
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getStatistics(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Lot ID is required'
        });
      }

      const statistics = await LotRepository.getLotStatistics(id);

      res.status(200).json({
        success: true,
        message: 'Lot statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      console.error('Error fetching lot statistics:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Lot not found',
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
}

module.exports = LotsController;
