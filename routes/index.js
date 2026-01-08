const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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

// Seed endpoint - visit /seed/unsocialfeed2026 to populate database
router.get('/seed/:key', async (req, res) => {
  if (req.params.key !== 'unsocialfeed2026') {
    return res.status(403).json({ error: 'Invalid seed key' });
  }
  
  try {
    // Check if already seeded
    const existingPosts = await Post.count();
    if (existingPosts > 0) {
      return res.json({ 
        message: 'Database already has posts. Delete them first if you want to reseed.',
        postCount: existingPosts
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    
    // Create or find admin user
    let admin = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
    }
    
    // Create or find demo user
    let regularUser = await User.findOne({ where: { email: 'user@example.com' } });
    if (!regularUser) {
      const userPassword = await bcrypt.hash('user123', salt);
      regularUser = await User.create({
        name: 'Demo User',
        email: 'user@example.com',
        password: userPassword,
        role: 'user'
      });
    }
    
    // Create sample posts
    await Post.bulkCreate([
      {
        title: 'UN Climate Action Summit 2026',
        content: '<p>World leaders gather to discuss ambitious climate targets and sustainable development goals for the next decade.</p><p>Key topics include renewable energy transitions, climate finance, and nature-based solutions.</p>',
        status: 'approved',
        sourceType: 'original',
        isPinned: true,
        sortOrder: 0,
        authorId: admin.id
      },
      {
        title: 'Secretary-General Address on Global Peace',
        content: '<p>Watch the Secretary-General\'s powerful message on international cooperation and the path toward lasting peace.</p>',
        status: 'approved',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=7UnvnqGTXqk',
        sourceId: '7UnvnqGTXqk',
        imageUrl: 'https://img.youtube.com/vi/7UnvnqGTXqk/hqdefault.jpg',
        isPinned: true,
        sortOrder: 1,
        authorId: admin.id
      },
      {
        title: 'Sustainable Development Goals Progress Report',
        content: '<p>The latest data shows significant progress on several SDGs, while highlighting areas requiring accelerated action.</p><ul><li>Goal 7: Clean Energy - 30% increase in renewable capacity</li><li>Goal 13: Climate Action - More countries adopting net-zero targets</li><li>Goal 4: Education - Improved global literacy rates</li></ul>',
        status: 'approved',
        sourceType: 'original',
        sortOrder: 2,
        authorId: admin.id
      },
      {
        title: 'World Humanitarian Day 2026',
        content: '<p>Honoring the brave aid workers who risk their lives to help others. This year\'s theme focuses on climate-related humanitarian crises.</p>',
        status: 'approved',
        sourceType: 'original',
        sortOrder: 3,
        authorId: admin.id
      },
      {
        title: 'UN Peacekeeping Operations Update',
        content: '<p>Blue helmets continue their vital work in maintaining peace and security around the world. Over 87,000 personnel are currently deployed across 12 missions.</p>',
        status: 'approved',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sourceId: 'dQw4w9WgXcQ',
        imageUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        sortOrder: 4,
        authorId: admin.id
      },
      {
        title: 'UNICEF: Every Child Deserves a Future',
        content: '<p>New initiative launched to ensure access to education, healthcare, and nutrition for children in conflict zones.</p>',
        status: 'approved',
        sourceType: 'original',
        sortOrder: 5,
        authorId: admin.id
      },
      {
        title: 'International Day of Peace',
        content: '<p>September 21st marks the International Day of Peace. This year, communities worldwide are organizing events promoting dialogue and reconciliation.</p>',
        status: 'approved',
        sourceType: 'original',
        sortOrder: 6,
        authorId: admin.id
      },
      {
        title: 'WHO Global Health Update',
        content: '<p>The World Health Organization releases new guidelines on pandemic preparedness and health system strengthening.</p>',
        status: 'approved',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
        sourceId: '5qap5aO4i9A',
        imageUrl: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
        sortOrder: 7,
        authorId: admin.id
      },
      {
        title: 'Ocean Conservation Initiative',
        content: '<p>UN Environment Programme announces expanded marine protected areas covering 30% of the world\'s oceans by 2030.</p>',
        status: 'approved',
        sourceType: 'original',
        sortOrder: 8,
        authorId: admin.id
      },
      {
        title: 'Gender Equality Progress',
        content: '<p>UN Women reports on advances in women\'s representation in leadership positions globally. More work remains to close the gender gap.</p>',
        status: 'approved',
        sourceType: 'original',
        sortOrder: 9,
        authorId: admin.id
      },
      {
        title: 'Community Clean-up Initiative',
        content: '<p>Our local community organized a beach clean-up event. Over 200 volunteers participated and collected 500kg of plastic waste!</p>',
        status: 'pending',
        sourceType: 'original',
        sortOrder: 10,
        authorId: regularUser.id
      },
      {
        title: 'Youth Climate March Photo',
        content: '<p>Photos from the youth-led climate demonstration in our city. The next generation is demanding action!</p>',
        status: 'pending',
        sourceType: 'original',
        sortOrder: 11,
        authorId: regularUser.id
      },
      {
        title: 'Inspiring TED Talk on Sustainability',
        content: '<p>This talk really changed my perspective on sustainable living. Highly recommend watching!</p>',
        status: 'pending',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=8MqFpN3RP9A',
        sourceId: '8MqFpN3RP9A',
        imageUrl: 'https://img.youtube.com/vi/8MqFpN3RP9A/hqdefault.jpg',
        sortOrder: 12,
        authorId: regularUser.id
      },
      {
        title: 'Off-topic Content Example',
        content: '<p>This post was rejected because it did not align with UN Social Feed guidelines.</p>',
        status: 'rejected',
        sourceType: 'original',
        sortOrder: 13,
        authorId: regularUser.id
      }
    ]);
    
    res.json({ 
      success: true, 
      message: 'Database seeded successfully!',
      posts: 14,
      users: 2,
      credentials: {
        admin: { email: 'admin@example.com', password: 'admin123' },
        user: { email: 'user@example.com', password: 'user123' }
      }
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
