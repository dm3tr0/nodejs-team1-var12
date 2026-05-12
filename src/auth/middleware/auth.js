/**
 * src/auth/middleware/auth.js
 * Authentication and authorization middleware
 */

const AuthService = require('../authService');

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied',
        error: 'No token provided or invalid format'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Access denied',
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Authentication failed'
    });
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied',
          error: 'User not authenticated'
        });
      }

      if (!AuthService.validateRole(req.user.role, requiredRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: `Requires ${requiredRole} role or higher`
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Authorization failed'
      });
    }
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = AuthService.verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.warn('Invalid token in optional auth:', error.message);
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if authentication fails
  }
};

/**
 * Resource owner verification - user can only access their own resources
 */
const requireOwnership = (resourceUserIdField = 'ownerId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied',
          error: 'Authentication required'
        });
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.query[resourceUserIdField];
      
      if (req.user.id !== resourceUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'You can only access your own resources'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Ownership verification failed'
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requireOwnership
};
