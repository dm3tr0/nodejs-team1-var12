/**
 * src/routes/api-tester.js
 * Route for serving the API testing web application
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// Serve the API tester page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/api-tester.html'));
});

module.exports = router;
