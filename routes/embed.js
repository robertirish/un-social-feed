const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');

// Embeddable feed - self-contained HTML with no external scripts
router.get('/', async (req, res) => {
  // Allow embedding in iframes
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  
  try {
    const posts = await Post.findAll({
      where: { status: 'approved' },
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    // Get base URL for assets
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.render('embed/feed', {
      title: 'Feed',
      posts,
      baseUrl,
      layout: false // No layout wrapper
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading feed');
  }
});

// Generate iframe embed code
router.get('/code', async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const embedCode = `<iframe src="${baseUrl}/embed" style="width:100%;min-height:600px;border:none;" title="Social Feed"></iframe>`;
  
  res.render('embed/code', {
    title: 'Embed Code',
    embedCode,
    baseUrl
  });
});

module.exports = router;
