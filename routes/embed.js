const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');

const POSTS_PER_PAGE = 6;

// Embeddable feed - self-contained HTML with lazy loading
router.get('/', async (req, res) => {
  // Allow embedding in iframes
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  
  try {
    // Get initial batch of posts
    const posts = await Post.findAll({
      where: { status: 'approved' },
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: POSTS_PER_PAGE,
      offset: 0
    });
    
    // Get total count for pagination
    const totalPosts = await Post.count({ where: { status: 'approved' } });

    // Get base URL for assets
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.render('embed/feed', {
      title: 'Feed',
      posts,
      baseUrl,
      totalPosts,
      postsPerPage: POSTS_PER_PAGE,
      layout: false // No layout wrapper
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading feed');
  }
});

// API endpoint for lazy loading more posts
router.get('/posts', async (req, res) => {
  // Allow CORS for embed
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * POSTS_PER_PAGE;
    
    const posts = await Post.findAll({
      where: { status: 'approved' },
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: POSTS_PER_PAGE,
      offset: offset
    });
    
    const totalPosts = await Post.count({ where: { status: 'approved' } });
    const hasMore = offset + posts.length < totalPosts;
    
    res.json({
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        imageUrl: p.imageUrl,
        sourceType: p.sourceType,
        sourceUrl: p.sourceUrl,
        sourceId: p.sourceId
      })),
      hasMore,
      page
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error loading posts' });
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
