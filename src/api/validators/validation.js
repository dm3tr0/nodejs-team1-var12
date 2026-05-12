/**
 * src/api/validators/validation.js
 * Validation rules for REST API endpoints
 */

const { body, param, query } = require('express-validator');

// Lot validation rules
const lotValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('startPrice')
      .isFloat({ gt: 0 })
      .withMessage('Start price must be a number greater than 0'),
    body('ownerId')
      .notEmpty()
      .withMessage('Owner ID is required'),
    body('ownerName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Owner name must be between 2 and 100 characters'),
    body('status')
      .optional()
      .isIn(['active', 'completed', 'cancelled'])
      .withMessage('Status must be active, completed, or cancelled'),
    body('keywords')
      .optional()
      .isArray()
      .withMessage('Keywords must be an array'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL')
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('startPrice')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Start price must be a number greater than 0'),
    body('currentPrice')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Current price must be a number greater than 0'),
    body('status')
      .optional()
      .isIn(['active', 'completed', 'cancelled'])
      .withMessage('Status must be active, completed, or cancelled'),
    body('keywords')
      .optional()
      .isArray()
      .withMessage('Keywords must be an array'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL')
  ],

  bid: [
    body('bidderId')
      .notEmpty()
      .withMessage('Bidder ID is required'),
    body('bidderName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Bidder name must be between 2 and 100 characters'),
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('Bid amount must be a number greater than 0')
  ]
};

// User validation rules
const userValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
  ]
};

// Bid validation rules
const bidValidation = {
  create: [
    body('lotId')
      .notEmpty()
      .withMessage('Lot ID is required'),
    body('bidderId')
      .notEmpty()
      .withMessage('Bidder ID is required'),
    body('bidderName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Bidder name must be between 2 and 100 characters'),
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('Bid amount must be a number greater than 0')
  ],

  update: [
    body('amount')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Bid amount must be a number greater than 0')
  ]
};

// Parameter validation
const paramValidation = {
  id: [
    param('id')
      .notEmpty()
      .withMessage('ID is required')
  ],

  lotId: [
    param('lotId')
      .notEmpty()
      .withMessage('Lot ID is required')
  ],

  bidderId: [
    param('bidderId')
      .notEmpty()
      .withMessage('Bidder ID is required')
  ]
};

// Query validation for pagination and filtering
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  lotFilters: [
    query('status')
      .optional()
      .isIn(['active', 'completed', 'cancelled'])
      .withMessage('Status must be active, completed, or cancelled'),
    query('ownerId')
      .optional()
      .notEmpty()
      .withMessage('Owner ID cannot be empty'),
    query('search')
      .optional()
      .isLength({ min: 2 })
      .withMessage('Search term must be at least 2 characters'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a non-negative number'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a non-negative number'),
    query('sortBy')
      .optional()
      .isIn(['title', 'start_price', 'current_price', 'created_at', 'owner_name'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],

  bidFilters: [
    query('lotId')
      .optional()
      .notEmpty()
      .withMessage('Lot ID cannot be empty'),
    query('bidderId')
      .optional()
      .notEmpty()
      .withMessage('Bidder ID cannot be empty'),
    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum amount must be a non-negative number'),
    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum amount must be a non-negative number'),
    query('sortBy')
      .optional()
      .isIn(['amount', 'created_at'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],

  userFilters: [
    query('search')
      .optional()
      .isLength({ min: 2 })
      .withMessage('Search term must be at least 2 characters'),
    query('hasLots')
      .optional()
      .isBoolean()
      .withMessage('hasLots must be true or false'),
    query('hasBids')
      .optional()
      .isBoolean()
      .withMessage('hasBids must be true or false'),
    query('sortBy')
      .optional()
      .isIn(['name', 'email', 'created_at'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ]
};

module.exports = {
  lotValidation,
  userValidation,
  bidValidation,
  paramValidation,
  queryValidation
};
