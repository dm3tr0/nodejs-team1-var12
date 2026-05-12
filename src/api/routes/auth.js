/**
 * src/api/routes/auth.js
 * Authentication routes with validation and middleware
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../../auth/middleware/auth');
const { authorize } = require('../../auth/middleware/auth');
const authValidation = require('../validators/authValidation');

// Public routes (no authentication required)

// POST /api/auth/register - Register new user
router.post('/register', 
  authValidation.register,
  AuthController.register
);

// POST /api/auth/login - Login user
router.post('/login', 
  authValidation.login,
  AuthController.login
);

// Protected routes (authentication required)

// GET /api/auth/profile - Get current user profile
router.get('/profile', 
  authenticate,
  AuthController.getProfile
);

// PUT /api/auth/profile - Update current user profile
router.put('/profile', 
  authenticate,
  authValidation.updateProfile,
  AuthController.updateProfile
);

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', 
  authenticate,
  AuthController.refreshToken
);

// POST /api/auth/change-password - Change password
router.post('/change-password', 
  authenticate,
  authValidation.changePassword,
  AuthController.changePassword
);

// Admin only routes

// GET /api/auth/users - Get all users (admin only)
router.get('/users', 
  authenticate,
  authorize('admin'),
  AuthController.getAllUsers
);

module.exports = router;
