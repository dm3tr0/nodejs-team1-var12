/**
 * src/api/controllers/usersController.js
 * REST API controller for Users resource
 * Implements full CRUD operations with filtering, pagination, and proper HTTP status codes
 */

const UserRepository = require('../../repositories/orm/UserRepository');
const { validationResult } = require('express-validator');

class UsersController {
  /**
   * GET /api/users
   * Read all users with filtering and pagination
   * HTTP Status: 200 (success), 400 (validation error), 500 (server error)
   */
  static async getAll(req, res) {
    try {
      // Extract query parameters for filtering and pagination
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        hasLots,
        hasBids
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

      let users;
      
      // Apply search or get all
      if (search) {
        users = await UserRepository.searchByName(search);
      } else {
        users = await UserRepository.findAll();
      }

      // Apply additional filters
      if (hasLots === 'true') {
        const filteredUsers = [];
        for (const user of users) {
          const lots = await user.getLots();
          if (lots.length > 0) {
            user._lots = lots;
            filteredUsers.push(user);
          }
        }
        users = filteredUsers;
      }

      if (hasBids === 'true') {
        const filteredUsers = [];
        for (const user of users) {
          const bids = await user.getBids();
          if (bids.length > 0) {
            user._bids = bids;
            filteredUsers.push(user);
          }
        }
        users = filteredUsers;
      }

      // Apply sorting
      users.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Apply pagination
      const total = users.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedUsers = users.slice(startIndex, endIndex);

      // Load relationships for paginated results
      for (const user of paginatedUsers) {
        if (!user._lots) user._lots = await user.getLots();
        if (!user._bids) user._bids = await user.getBids();
        user._statistics = await user.getStatistics();
      }

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: paginatedUsers,
          pagination: {
            currentPage: pageNum,
            totalPages: totalPages,
            totalItems: total,
            itemsPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPreviousPage: pageNum > 1
          },
          filters: {
            search,
            hasLots,
            hasBids,
            sortBy,
            sortOrder
          }
        }
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/users/:id
   * Read a single user by ID
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const user = await UserRepository.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: `User with ID ${id} does not exist`
        });
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * POST /api/users
   * Create a new user
   * HTTP Status: 201 (created), 400 (validation error), 409 (conflict), 500 (server error)
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

      // Check if user with email already exists
      const existingUser = await UserRepository.findByEmail(req.body.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          error: `User with email ${req.body.email} already exists`
        });
      }

      const userData = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        ...req.body
      };

      const user = await UserRepository.create(userData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });

    } catch (error) {
      console.error('Error creating user:', error);
      
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
   * PUT /api/users/:id
   * Update an existing user
   * HTTP Status: 200 (success), 400 (validation error), 404 (not found), 409 (conflict), 500 (server error)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
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

      // Check if user exists
      const existingUser = await UserRepository.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: `User with ID ${id} does not exist`
        });
      }

      // Check if email is being changed and if it already exists
      if (req.body.email && req.body.email !== existingUser.email) {
        const emailExists = await UserRepository.findByEmail(req.body.email);
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists',
            error: `User with email ${req.body.email} already exists`
          });
        }
      }

      const updatedUser = await UserRepository.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Error updating user:', error);
      
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
   * DELETE /api/users/:id
   * Delete a user
   * HTTP Status: 200 (success), 404 (not found), 400 (business rule violation), 500 (server error)
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Check if user exists
      const existingUser = await UserRepository.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: `User with ID ${id} does not exist`
        });
      }

      await UserRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: {
          id: id,
          deleted: true
        }
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      
      if (error.message.includes('Cannot delete user with existing')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete user',
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
   * GET /api/users/:id/lots
   * Get user's lots with bid information
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getUserLots(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const lots = await UserRepository.getUserLotsWithBids(id);

      res.status(200).json({
        success: true,
        message: 'User lots retrieved successfully',
        data: {
          userId: id,
          lots: lots,
          totalLots: lots.length
        }
      });

    } catch (error) {
      console.error('Error fetching user lots:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
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
   * GET /api/users/:id/bids
   * Get user's bid history
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getUserBids(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const bids = await UserRepository.getUserBidHistory(id);

      res.status(200).json({
        success: true,
        message: 'User bid history retrieved successfully',
        data: {
          userId: id,
          bids: bids,
          totalBids: bids.length,
          totalAmount: bids.reduce((sum, bid) => sum + bid.amount, 0)
        }
      });

    } catch (error) {
      console.error('Error fetching user bids:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
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
   * GET /api/users/:id/statistics
   * Get user statistics
   * HTTP Status: 200 (success), 404 (not found), 500 (server error)
   */
  static async getStatistics(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const statistics = await UserRepository.getUserStatistics(id);

      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      console.error('Error fetching user statistics:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
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
   * GET /api/users/ranking
   * Get user ranking by bids
   * HTTP Status: 200 (success), 500 (server error)
   */
  static async getRanking(req, res) {
    try {
      const { limit = 10 } = req.query;
      const limitNum = parseInt(limit);

      if (limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit parameter',
          error: 'Limit must be between 1 and 100'
        });
      }

      const rankings = await UserRepository.getUserRanking();
      const limitedRankings = rankings.slice(0, limitNum);

      res.status(200).json({
        success: true,
        message: 'User ranking retrieved successfully',
        data: {
          rankings: limitedRankings,
          totalUsers: rankings.length
        }
      });

    } catch (error) {
      console.error('Error fetching user ranking:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = UsersController;
