/**
 * src/routes/auth.js
 * Web authentication routes (login/logout forms)
 */

const express = require('express');
const router = express.Router();
const AuthService = require('../auth/authService');
const UserRepository = require('../repositories/orm/UserRepository');
const { validationResult } = require('express-validator');
const authValidation = require('../api/validators/authValidation');

// GET /auth/login - Show login form
router.get('/login', (req, res) => {
  const returnUrl = req.query.returnUrl || '/';
  const error = req.query.error || null;

  res.render('auth/login', {
    title: 'Вхід',
    returnUrl,
    error
  });
});

// POST /auth/login - Process login
router.post('/login', authValidation.login, async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const returnUrl = req.body.returnUrl || '/';
      return res.redirect(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent('Невірні дані для входу')}`);
    }

    const { email, password } = req.body;

    // Login user
    const { user, token } = await AuthService.login(email, password);

    // Set JWT token in cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Redirect to return URL or home
    const returnUrl = req.body.returnUrl || '/';
    res.redirect(returnUrl);

  } catch (error) {
    console.error('Web login error:', error);
    const returnUrl = req.body.returnUrl || '/';
    res.redirect(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent('Невірні дані для входу')}`);
  }
});

// GET /auth/register - Show registration form
router.get('/register', (req, res) => {
  const error = req.query.error || null;

  res.render('auth/register', {
    title: 'Реєстрація',
    error
  });
});

// POST /auth/register - Process registration
router.post('/register', authValidation.register, async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    console.log(errors)
    if (!errors.isEmpty()) {
      return res.redirect(`/auth/register?error=${encodeURIComponent('Помилка валідації даних')}`);
    }

    const { name, email, password } = req.body;

    // Register user
    const { user, token } = await AuthService.register({
      name,
      email,
      password,
      role: 'user'
    });

    // Set JWT token in cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Redirect to home
    res.redirect('/?message=Реєстрація успішна');

  } catch (error) {
    console.error('Web registration error:', error);
    res.redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  }
});

// POST /auth/logout - Logout
router.post('/logout', (req, res) => {
  // Clear the auth token cookie
  res.clearCookie('auth_token');
  res.redirect('/?message=Ви вийшли з системи');
});

module.exports = router;