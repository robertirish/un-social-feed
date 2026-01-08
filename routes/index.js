const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { User, Post } = require('../models');

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
    const postCount = await Post.count();
    res.json({
      status: 'ok',
      database: 'connected',
      userCount: userCount,
      postCount: postCount,
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

// Seed endpoint - visit /seed/unsocialfeed2026 to populate database with UN Peace & Security content
router.get('/seed/:key', async (req, res) => {
  if (req.params.key !== 'unsocialfeed2026') {
    return res.status(403).json({ error: 'Invalid seed key' });
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    
    // Create or find admin user
    let admin = await User.findOne({ where: { email: 'robert.f.irish@gmail.com' } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('U8zx4.o68wYFQs*g9Aw@', salt);
      admin = await User.create({
        name: 'Robert Irish',
        email: 'robert.f.irish@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });
    }
    
    // Delete all existing posts
    await Post.destroy({ where: {} });
    
    // Load seed data with embedded base64 images
    const seedDataPath = path.join(__dirname, '..', 'scripts', 'seed-data.json');
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
    
    // Add authorId to each post
    const posts = seedData.map(post => ({
      ...post,
      authorId: admin.id
    }));
    
    await Post.bulkCreate(posts);
    
    res.json({ 
      success: true, 
      message: 'Database seeded with UN Peace & Security content (with embedded images)!',
      posts: posts.length,
      breakdown: {
        youtube: posts.filter(p => p.sourceType === 'youtube').length,
        twitter: posts.filter(p => p.sourceType === 'twitter').length,
        instagram: posts.filter(p => p.sourceType === 'instagram').length,
        original: posts.filter(p => p.sourceType === 'original').length
      },
      admin: 'robert.f.irish@gmail.com'
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add specific admin user - visit /addadmin/unsocialfeed2026
router.get('/addadmin/:key', async (req, res) => {
  if (req.params.key !== 'unsocialfeed2026') {
    return res.status(403).json({ error: 'Invalid key' });
  }
  
  try {
    // Check if user already exists
    const existing = await User.findOne({ where: { email: 'robert.f.irish@gmail.com' } });
    if (existing) {
      // Update to admin if not already
      if (existing.role !== 'admin') {
        await existing.update({ role: 'admin' });
        return res.json({ message: 'User upgraded to admin', email: 'robert.f.irish@gmail.com' });
      }
      return res.json({ message: 'Admin user already exists', email: 'robert.f.irish@gmail.com' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('U8zx4.o68wYFQs*g9Aw@', salt);
    
    await User.create({
      name: 'Robert Irish',
      email: 'robert.f.irish@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    res.json({ 
      success: true, 
      message: 'Admin user created!',
      email: 'robert.f.irish@gmail.com'
    });
  } catch (err) {
    console.error('Add admin error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
