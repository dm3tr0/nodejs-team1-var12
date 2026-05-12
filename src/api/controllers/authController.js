/**
 * src/api/controllers/authController.js
 * Authentication controller for registration, login, and user management
 */

const AuthService = require('../../auth/authService');
const UserRepository = require('../../repositories/orm/UserRepository');
const { validationResult } = require('express-validator');

class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   * HTTP Status: 201 (created), 400 (validation error), 409 (conflict), 500 (server error)
   */
  static async register(req, res) {
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

      const { name, email, password, role } = req.body;

      // Register user
      const { user, token } = await AuthService.register({
        name,
        email,
        password,
        role: role || 'user'
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token,
          expiresIn: AuthService.JWT_EXPIRES_IN
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Registration failed',
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
   * POST /api/auth/login
   * Login user
   * HTTP Status: 200 (success), 400 (validation error), 401 (invalid credentials), 500 (server error)
   */
  static async login(req, res) {
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

      const { email, password } = req.body;

      // Login user
      const { user, token } = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token,
          expiresIn: AuthService.JWT_EXPIRES_IN
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message.includes('Invalid credentials')) {
        return res.status(401).json({
          success: false,
          message: 'Login failed',
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
   * POST /api/auth/refresh
   * Refresh JWT token
   * HTTP Status: 200 (success), 401 (invalid token), 500 (server error)
   */
  static async refreshToken(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied',
          error: 'Authentication required'
        });
      }

      const { token } = await AuthService.refreshToken(req.user);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token,
          expiresIn: AuthService.JWT_EXPIRES_IN
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/auth/profile
   * Get current user profile
   * HTTP Status: 200 (success), 401 (unauthorized), 500 (server error)
   */
  static async getProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied',
          error: 'Authentication required'
        });
      }

      // Get full user data with relationships
      const user = await UserRepository.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User profile not found'
        });
      }

      // Remove password from response
      delete user.password;

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/auth/profile
   * Update current user profile
   * HTTP Status: 200 (success), 400 (validation error), 401 (unauthorized), 500 (server error)
   */
  static async updateProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied',
          error: 'Authentication required'
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

      const { name, email } = req.body;
      const userId = req.user.id;

      // Check if email is being changed and if it already exists
      if (email && email !== req.user.email) {
        const emailExists = await UserRepository.findByEmail(email);
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Update failed',
            error: 'Email already exists'
          });
        }
      }

      // Update user
      const updatedUser = await UserRepository.update(userId, { name, email });
      delete updatedUser.password;

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * POST /api/auth/change-password
   * Change user password
   * HTTP Status: 200 (success), 400 (validation error), 401 (unauthorized), 500 (server error)
   */
  static async changePassword(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied',
          error: 'Authentication required'
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

      const { currentPassword, newPassword } = req.body;

      // Get current user with password
      const user = await UserRepository.findByEmail(req.user.email);
      if (!user || !user.password) {
        return res.status(400).json({
          success: false,
          message: 'Password change failed',
          error: 'User not found or no password set'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await AuthService.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Password change failed',
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await AuthService.hashPassword(newPassword);

      // Update password
      await UserRepository.update(user.id, { password: hashedNewPassword });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/auth/users
   * Get all users (admin only)
   * HTTP Status: 200 (success), 401 (unauthorized), 403 (forbidden), 500 (server error)
   */
  static async getAllUsers(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied',
          error: 'Authentication required'
        });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'Admin access required'
        });
      }

      const users = await UserRepository.findAll();
      
      // Remove passwords from response
      users.forEach(user => delete user.password);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          total: users.length
        }
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
