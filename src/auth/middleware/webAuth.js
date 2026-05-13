/**
 * src/auth/middleware/webAuth.js
 * Web authentication middleware for browser sessions using JWT cookies
 */

const AuthService = require('../authService');

/**
 * Web authentication middleware - verifies JWT token from cookies
 */
const webAuthenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.auth_token;

    if (token) {
      try {
        const decoded = AuthService.verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid, clear the cookie
        res.clearCookie('auth_token');
        console.warn('Invalid token in web auth:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Web authentication error:', error);
    next(); // Don't fail the request, just continue without user
  }
};

/**
 * Require authentication for web routes
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    // Redirect to login page with return URL
    const returnUrl = encodeURIComponent(req.originalUrl);
    return res.redirect(`/auth/login?returnUrl=${returnUrl}`);
  }
  next();
};

/**
 * Role-based authorization for web routes
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      const returnUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`/auth/login?returnUrl=${returnUrl}`);
    }

    if (!AuthService.validateRole(req.user.role, requiredRole)) {
      return res.status(403).render('error', {
        title: 'Доступ заборонено',
        message: `Потрібен рівень доступу: ${requiredRole}`
      });
    }

    next();
  };
};

module.exports = {
  webAuthenticate,
  requireAuth,
  requireRole
};