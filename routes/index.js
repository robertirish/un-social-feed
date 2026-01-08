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
    
    // UN Peace and Security posts - using reliable image sources
    const posts = [
      // YouTube posts (thumbnails always work)
      {
        title: 'UN Peacekeeping: 75 Years of Service and Sacrifice',
        content: '<p>Since 1948, UN Peacekeepers have served in over 70 operations worldwide. This documentary highlights their unwavering commitment to peace and the sacrifices made to protect civilians in conflict zones.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=pAoEHR4aW8I',
        sourceId: 'pAoEHR4aW8I',
        imageUrl: 'https://img.youtube.com/vi/pAoEHR4aW8I/hqdefault.jpg',
        status: 'approved',
        isPinned: true,
        sortOrder: 0,
        authorId: admin.id
      },
      {
        title: 'Security Council: Maintaining International Peace',
        content: '<p>The UN Security Council convenes to address pressing threats to international peace and security. Watch how the Council works to resolve global conflicts.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=pPXPCPMbCQI',
        sourceId: 'pPXPCPMbCQI',
        imageUrl: 'https://img.youtube.com/vi/pPXPCPMbCQI/hqdefault.jpg',
        status: 'approved',
        sortOrder: 1,
        authorId: admin.id
      },
      {
        title: 'Women in Peacekeeping: Breaking Barriers',
        content: '<p>Women peacekeepers play a crucial role in UN missions. They build trust with local communities and are essential to achieving sustainable peace.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=4H7HMVEaNrU',
        sourceId: '4H7HMVEaNrU',
        imageUrl: 'https://img.youtube.com/vi/4H7HMVEaNrU/hqdefault.jpg',
        status: 'approved',
        sortOrder: 2,
        authorId: admin.id
      },
      {
        title: 'What is UN Peacekeeping?',
        content: '<p>Learn about the UN\'s mandate to protect civilians and support political processes in conflict zones around the world.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=Igk3SY6MWUo',
        sourceId: 'Igk3SY6MWUo',
        imageUrl: 'https://img.youtube.com/vi/Igk3SY6MWUo/hqdefault.jpg',
        status: 'approved',
        sortOrder: 3,
        authorId: admin.id
      },
      // Twitter/X posts - using Unsplash UN-related images
      {
        title: 'International Day of UN Peacekeepers',
        content: '<p>On International Day of UN Peacekeepers, we honour the service and sacrifice of peacekeepers who have lost their lives in the cause of peace. #PKDay #ServingForPeace</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UNPeacekeeping/status/1795123456789012345',
        sourceId: '1795123456789012345',
        imageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80',
        status: 'approved',
        sortOrder: 4,
        authorId: admin.id
      },
      {
        title: 'Security Council Open Debate',
        content: '<p>The Security Council held an open debate on maintaining international peace and security. Member states emphasized the importance of multilateral cooperation. #UNSC #Peace</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UN/status/1798765432109876543',
        sourceId: '1798765432109876543',
        imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
        status: 'approved',
        sortOrder: 5,
        authorId: admin.id
      },
      {
        title: 'Blue Helmets: Guardians of Peace',
        content: '<p>UN peacekeepers continue their vital mission to protect civilians and support peace processes. Their dedication saves lives every day. #BlueHelmets #UNPeacekeeping</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UNPeacekeeping/status/1801234567890123456',
        sourceId: '1801234567890123456',
        imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
        status: 'approved',
        sortOrder: 6,
        authorId: admin.id
      },
      // Instagram posts
      {
        title: 'Peacekeepers Training for Tomorrow',
        content: '<p>UN peacekeepers undergo rigorous training before deployment. From conflict resolution to first aid, our troops are prepared for any challenge they may face in the field.</p>',
        sourceType: 'instagram',
        sourceUrl: 'https://www.instagram.com/p/C8abc123def/',
        sourceId: 'C8abc123def',
        imageUrl: 'https://images.unsplash.com/photo-1531746790095-e6e200e55e7f?w=800&q=80',
        status: 'approved',
        sortOrder: 7,
        authorId: admin.id
      },
      {
        title: 'Building Peace Through Community',
        content: '<p>Building trust with local communities is essential to peacekeeping success. Our personnel work alongside civilians to foster dialogue and reconciliation.</p>',
        sourceType: 'instagram',
        sourceUrl: 'https://www.instagram.com/p/C9xyz789ghi/',
        sourceId: 'C9xyz789ghi',
        imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80',
        status: 'approved',
        sortOrder: 8,
        authorId: admin.id
      },
      // Original posts with reliable images
      {
        title: 'The Role of the Security Council in Global Peace',
        content: '<p>The UN Security Council has primary responsibility for maintaining international peace and security. Its five permanent members and ten elected members work to address conflicts before they escalate.</p><p>Through resolutions, sanctions, and peacekeeping mandates, the Council remains the cornerstone of the international security architecture.</p>',
        sourceType: 'original',
        imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
        status: 'approved',
        isPinned: true,
        sortOrder: 9,
        authorId: admin.id
      },
      {
        title: 'Disarmament: Building a Safer World',
        content: '<p>The UN continues to lead global efforts on disarmament and non-proliferation. From nuclear weapons to small arms, reducing the availability of weapons is crucial to preventing conflict.</p><p>The Office for Disarmament Affairs supports multilateral negotiations and promotes international norms against weapons of mass destruction.</p>',
        sourceType: 'original',
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
        status: 'approved',
        sortOrder: 10,
        authorId: admin.id
      },
      {
        title: 'Mediation and Conflict Prevention',
        content: '<p>Prevention is better than cure. The UN\'s Department of Political and Peacebuilding Affairs works to prevent conflicts through early warning, mediation, and diplomatic engagement.</p><p>Special envoys and mediators are deployed worldwide to facilitate dialogue between parties and find peaceful solutions to disputes.</p>',
        sourceType: 'original',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
        status: 'approved',
        sortOrder: 11,
        authorId: admin.id
      },
      {
        title: 'Peacebuilding After Conflict',
        content: '<p>Ending a war is only the first step. The UN Peacebuilding Commission supports countries emerging from conflict to ensure they don\'t relapse into violence.</p><p>From institution building to reconciliation programs, peacebuilding addresses the root causes of conflict and builds foundations for lasting peace.</p>',
        sourceType: 'original',
        imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd59a93f9724?w=800&q=80',
        status: 'approved',
        sortOrder: 12,
        authorId: admin.id
      },
      {
        title: 'Counter-Terrorism: A United Response',
        content: '<p>The UN Office of Counter-Terrorism coordinates the organization\'s efforts against terrorism. The UN Global Counter-Terrorism Strategy provides a framework for member states to work together.</p><p>Addressing conditions conducive to terrorism while upholding human rights remains central to the UN approach.</p>',
        sourceType: 'original',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
        status: 'approved',
        sortOrder: 13,
        authorId: admin.id
      },
      {
        title: 'International Humanitarian Law',
        content: '<p>Even in war, there are rules. International humanitarian law protects those who are not participating in hostilities and restricts the means and methods of warfare.</p><p>The UN works to promote respect for these laws and holds violators accountable through international justice mechanisms.</p>',
        sourceType: 'original',
        imageUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80',
        status: 'approved',
        sortOrder: 14,
        authorId: admin.id
      }
    ];
    
    await Post.bulkCreate(posts);
    
    res.json({ 
      success: true, 
      message: 'Database seeded with UN Peace & Security content!',
      posts: posts.length,
      breakdown: {
        youtube: 4,
        twitter: 3,
        instagram: 2,
        original: 6
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
