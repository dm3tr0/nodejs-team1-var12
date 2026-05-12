/**
 * src/api/routes/index.js
 * Main API routes file that aggregates all resource routes
 */

const express = require('express');
const router = express.Router();

// Import individual resource routes
const lotsRoutes = require('./lots');
const usersRoutes = require('./users');
const bidsRoutes = require('./bids');
const authRoutes = require('./auth');

// API information endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auction REST API',
    version: '1.0.0',
    authentication: {
      type: 'JWT Bearer Token',
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register',
      profile: 'GET /api/auth/profile (authenticated)',
      header: 'Authorization: Bearer <token>'
    },
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/profile': 'Get current user profile (auth)',
        'PUT /api/auth/profile': 'Update profile (auth)',
        'POST /api/auth/refresh': 'Refresh token (auth)',
        'POST /api/auth/change-password': 'Change password (auth)',
        'GET /api/auth/users': 'Get all users (admin only)'
      },
      lots: {
        'GET /api/lots': 'Get all lots (public)',
        'GET /api/lots/:id': 'Get specific lot (public)',
        'POST /api/lots': 'Create lot (auth)',
        'PUT /api/lots/:id': 'Update lot (owner/admin)',
        'DELETE /api/lots/:id': 'Delete lot (owner/admin)',
        'POST /api/lots/:id/bid': 'Place bid (auth)',
        'GET /api/lots/:id/statistics': 'Get lot statistics (public)'
      },
      users: {
        'GET /api/users': 'Get all users (public - filtered)',
        'GET /api/users/:id': 'Get specific user (public - filtered)',
        'POST /api/users': 'Create user (admin)',
        'PUT /api/users/:id': 'Update user (owner/admin)',
        'DELETE /api/users/:id': 'Delete user (admin)',
        'GET /api/users/:id/lots': 'Get user lots (auth)',
        'GET /api/users/:id/bids': 'Get user bids (auth)',
        'GET /api/users/:id/statistics': 'Get user stats (auth)',
        'GET /api/users/ranking': 'Get user ranking (public)'
      },
      bids: {
        'GET /api/bids': 'Get all bids (auth)',
        'GET /api/bids/:lotId/:bidderId': 'Get specific bid (auth)',
        'POST /api/bids': 'Create bid (auth)',
        'PUT /api/bids/:lotId/:bidderId': 'Update bid (owner/admin)',
        'DELETE /api/bids/:lotId/:bidderId': 'Delete bid (owner/admin)',
        'GET /api/bids/lot/:lotId': 'Get lot bids (public)',
        'GET /api/bids/bidder/:bidderId': 'Get bidder bids (auth)',
        'GET /api/bids/highest/:lotId': 'Get highest bid (public)',
        'GET /api/bids/statistics/:lotId': 'Get bid stats (public)',
        'GET /api/bids/analysis/:lotId': 'Get analysis (auth)'
      }
    },
    documentation: '/api/docs',
    examples: {
      authenticate: 'curl -H "Authorization: Bearer <token>" http://localhost:3000/api/auth/profile',
      createLot: 'POST /api/lots with Authorization header and {title, description, startPrice}',
      placeBid: 'POST /api/lots/:id/bid with Authorization header and {bidderId, bidderName, amount}',
      filterLots: 'GET /api/lots?status=active&page=1&limit=10&sortBy=current_price&sortOrder=desc'
    }
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount resource routes
router.use('/auth', authRoutes);
router.use('/lots', lotsRoutes);
router.use('/users', usersRoutes);
router.use('/bids', bidsRoutes);

module.exports = router;
