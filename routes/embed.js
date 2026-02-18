const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');

const POSTS_PER_PAGE = 6;

// Embeddable feed - horizontal auto-scrolling carousel
router.get('/', async (req, res) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  
  try {
    const publicWhere = { status: 'approved', embedRestricted: false };

    const posts = await Post.findAll({
      where: publicWhere,
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.render('embed/feed', {
      title: 'Feed',
      posts,
      baseUrl,
      layout: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading feed');
  }
});

// Classic embeddable feed - vertical masonry with lazy loading
router.get('/classic', async (req, res) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");

  try {
    const publicWhere = { status: 'approved', embedRestricted: false };

    const posts = await Post.findAll({
      where: publicWhere,
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: POSTS_PER_PAGE,
      offset: 0
    });

    const totalPosts = await Post.count({ where: publicWhere });
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.render('embed/feed-classic', {
      title: 'Feed',
      posts,
      baseUrl,
      totalPosts,
      postsPerPage: POSTS_PER_PAGE,
      layout: false
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
    
    const publicWhere = { status: 'approved', embedRestricted: false };

    const posts = await Post.findAll({
      where: publicWhere,
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: POSTS_PER_PAGE,
      offset: offset
    });
    
    const totalPosts = await Post.count({ where: publicWhere });
    const hasMore = offset + posts.length < totalPosts;
    
    res.json({
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        imageUrl: p.imageUrl,
        sourceType: p.sourceType,
        sourceUrl: p.sourceUrl,
        sourceId: p.sourceId,
        linkUrl: p.linkUrl
      })),
      hasMore,
      page
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error loading posts' });
  }
});

// Generate iframe embed codes
router.get('/code', async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.render('embed/code', {
    title: 'Embed Code',
    baseUrl
  });
});

module.exports = router;
