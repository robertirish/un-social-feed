const express = require('express');
const router = express.Router();

// Home page - redirect to admin or login
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }
  res.redirect('/auth/login');
});

module.exports = router;
