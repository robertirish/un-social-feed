const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { ensureGuest, ensureAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

// Login handler
router.post('/login', ensureGuest, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      req.flash('error_msg', 'An error occurred during login');
      return res.redirect('/auth/login');
    }
    if (!user) {
      console.log('Login failed:', info);
      req.flash('error_msg', info ? info.message : 'Invalid credentials');
      return res.redirect('/auth/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Session error:', err);
        req.flash('error_msg', 'Session error');
        return res.redirect('/auth/login');
      }
      console.log('Login successful for:', user.email);
      return res.redirect('/admin');
    });
  })(req, res, next);
});

// Register page
router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

// Register handler
router.post('/register', ensureGuest, async (req, res) => {
  const { name, email, password, password2 } = req.body;
  const errors = [];

  // Validation
  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password && password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.render('auth/register', {
      title: 'Register',
      errors,
      name,
      email
    });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    
    if (existingUser) {
      errors.push({ msg: 'Email is already registered' });
      return res.render('auth/register', {
        title: 'Register',
        errors,
        name,
        email
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if this is the first user (make them admin)
    const userCount = await User.count();
    const role = userCount === 0 ? 'admin' : 'user';

    // Create user
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role
    });

    req.flash('success_msg', 'You are now registered. Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/auth/register');
  }
});

// Logout
router.get('/logout', ensureAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
    }
    req.flash('success_msg', 'You have been logged out');
    res.redirect('/auth/login');
  });
});

module.exports = router;
