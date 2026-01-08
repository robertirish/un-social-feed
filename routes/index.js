const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Home page - redirect to admin or login
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }
  res.redirect('/auth/login');
});

// Health check / debug route
router.get('/health', async (req, res) => {
  try {
    const userCount = await User.count();
    res.json({
      status: 'ok',
      database: 'connected',
      userCount: userCount,
      session: req.session ? 'active' : 'none',
      env: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    res.json({
      status: 'error',
      database: 'disconnected',
      error: err.message
    });
  }
});

module.exports = router;
