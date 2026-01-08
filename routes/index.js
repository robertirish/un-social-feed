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
    
    // UN Peace and Security posts
    const posts = [
      // YouTube posts
      {
        title: 'UN Peacekeeping: 75 Years of Service and Sacrifice',
        content: '<p>Since 1948, UN Peacekeepers have served in over 70 operations worldwide. This documentary highlights their unwavering commitment to peace and the sacrifices made to protect civilians in conflict zones.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=E_os36KyRdY',
        sourceId: 'E_os36KyRdY',
        imageUrl: 'https://img.youtube.com/vi/E_os36KyRdY/hqdefault.jpg',
        status: 'approved',
        isPinned: true,
        sortOrder: 0,
        authorId: admin.id
      },
      {
        title: 'Security Council Briefing on International Peace',
        content: '<p>The UN Security Council convenes to address pressing threats to international peace and security. Watch the latest briefing on global conflict resolution efforts.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=9CdY7t5VKIY',
        sourceId: '9CdY7t5VKIY',
        imageUrl: 'https://img.youtube.com/vi/9CdY7t5VKIY/hqdefault.jpg',
        status: 'approved',
        sortOrder: 1,
        authorId: admin.id
      },
      {
        title: 'Women in Peacekeeping: Breaking Barriers',
        content: '<p>Women peacekeepers play a crucial role in UN missions. They build trust with local communities and are essential to achieving sustainable peace.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=YXwqVgx-sxE',
        sourceId: 'YXwqVgx-sxE',
        imageUrl: 'https://img.youtube.com/vi/YXwqVgx-sxE/hqdefault.jpg',
        status: 'approved',
        sortOrder: 2,
        authorId: admin.id
      },
      {
        title: 'Protecting Civilians in Armed Conflict',
        content: '<p>Learn about the UN\'s mandate to protect civilians caught in the crossfire of armed conflicts around the world.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=kGSs5WD9K0Q',
        sourceId: 'kGSs5WD9K0Q',
        imageUrl: 'https://img.youtube.com/vi/kGSs5WD9K0Q/hqdefault.jpg',
        status: 'approved',
        sortOrder: 3,
        authorId: admin.id
      },
      // Twitter/X posts
      {
        title: 'UN Peacekeeping Day 2024',
        content: '<p>On International Day of UN Peacekeepers, we honour the service and sacrifice of peacekeepers who have lost their lives in the cause of peace. #PKDay</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UNPeacekeeping/status/1795123456789012345',
        sourceId: '1795123456789012345',
        imageUrl: 'https://peacekeeping.un.org/sites/default/files/styles/1200x500/public/field/image/pk_day_2024.jpg',
        status: 'approved',
        sortOrder: 4,
        authorId: admin.id
      },
      {
        title: 'Security Council Addresses Global Threats',
        content: '<p>The Security Council held an open debate on maintaining international peace and security. Member states emphasized the importance of multilateral cooperation. #UNSC</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UN/status/1798765432109876543',
        sourceId: '1798765432109876543',
        imageUrl: 'https://www.un.org/sites/un2.un.org/files/2021/09/security-council.jpg',
        status: 'approved',
        sortOrder: 5,
        authorId: admin.id
      },
      {
        title: 'Blue Helmets Deploy to New Mission',
        content: '<p>UN peacekeepers begin deployment to support peace efforts. Their mission: protect civilians, support political processes, and help build lasting peace.</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UNPeacekeeping/status/1801234567890123456',
        sourceId: '1801234567890123456',
        imageUrl: 'https://peacekeeping.un.org/sites/default/files/styles/1200x500/public/blue_helmets_deployment.jpg',
        status: 'approved',
        sortOrder: 6,
        authorId: admin.id
      },
      // Instagram posts
      {
        title: 'Peacekeepers Training Exercise',
        content: '<p>UN peacekeepers undergo rigorous training before deployment. From conflict resolution to first aid, our troops are prepared for any challenge.</p>',
        sourceType: 'instagram',
        sourceUrl: 'https://www.instagram.com/p/C8abc123def/',
        sourceId: 'C8abc123def',
        imageUrl: 'https://peacekeeping.un.org/sites/default/files/styles/1200x500/public/training_exercise.jpg',
        status: 'approved',
        sortOrder: 7,
        authorId: admin.id
      },
      {
        title: 'Community Engagement in Peacekeeping',
        content: '<p>Building trust with local communities is essential to peacekeeping success. Our personnel work alongside civilians to foster dialogue and reconciliation.</p>',
        sourceType: 'instagram',
        sourceUrl: 'https://www.instagram.com/p/C9xyz789ghi/',
        sourceId: 'C9xyz789ghi',
        imageUrl: 'https://peacekeeping.un.org/sites/default/files/styles/1200x500/public/community_engagement.jpg',
        status: 'approved',
        sortOrder: 8,
        authorId: admin.id
      },
      // Original posts
      {
        title: 'The Role of the Security Council in Global Peace',
        content: '<p>The UN Security Council has primary responsibility for maintaining international peace and security. Its five permanent members and ten elected members work to address conflicts before they escalate.</p><p>Through resolutions, sanctions, and peacekeeping mandates, the Council remains the cornerstone of the international security architecture.</p>',
        sourceType: 'original',
        imageUrl: 'https://www.un.org/sites/un2.un.org/files/2021/09/security-council.jpg',
        status: 'approved',
        isPinned: true,
        sortOrder: 9,
        authorId: admin.id
      },
      {
        title: 'Disarmament: Building a Safer World',
        content: '<p>The UN continues to lead global efforts on disarmament and non-proliferation. From nuclear weapons to small arms, reducing the availability of weapons is crucial to preventing conflict.</p><p>The Office for Disarmament Affairs supports multilateral negotiations and promotes international norms against weapons of mass destruction.</p>',
        sourceType: 'original',
        imageUrl: 'https://www.un.org/disarmament/wp-content/uploads/2020/01/unoda-homepage-banner.jpg',
        status: 'approved',
        sortOrder: 10,
        authorId: admin.id
      },
      {
        title: 'Mediation and Conflict Prevention',
        content: '<p>Prevention is better than cure. The UN\'s Department of Political and Peacebuilding Affairs works to prevent conflicts through early warning, mediation, and diplomatic engagement.</p><p>Special envoys and mediators are deployed worldwide to facilitate dialogue between parties and find peaceful solutions to disputes.</p>',
        sourceType: 'original',
        imageUrl: 'https://peacemaker.un.org/sites/peacemaker.un.org/files/styles/hero_image/public/mediation_support.jpg',
        status: 'approved',
        sortOrder: 11,
        authorId: admin.id
      },
      {
        title: 'Peacebuilding After Conflict',
        content: '<p>Ending a war is only the first step. The UN Peacebuilding Commission supports countries emerging from conflict to ensure they don\'t relapse into violence.</p><p>From institution building to reconciliation programs, peacebuilding addresses the root causes of conflict and builds foundations for lasting peace.</p>',
        sourceType: 'original',
        imageUrl: 'https://www.un.org/peacebuilding/sites/www.un.org.peacebuilding/files/styles/hero/public/pbc_banner.jpg',
        status: 'approved',
        sortOrder: 12,
        authorId: admin.id
      },
      {
        title: 'Counter-Terrorism: A Global Challenge',
        content: '<p>The UN Office of Counter-Terrorism coordinates the organization\'s efforts against terrorism. The UN Global Counter-Terrorism Strategy provides a framework for member states to work together.</p><p>Addressing conditions conducive to terrorism while upholding human rights remains central to the UN approach.</p>',
        sourceType: 'original',
        imageUrl: 'https://www.un.org/counterterrorism/sites/www.un.org.counterterrorism/files/styles/hero/public/unoct_hero_banner.jpg',
        status: 'approved',
        sortOrder: 13,
        authorId: admin.id
      },
      {
        title: 'International Humanitarian Law and Armed Conflict',
        content: '<p>Even in war, there are rules. International humanitarian law protects those who are not participating in hostilities and restricts the means and methods of warfare.</p><p>The UN works to promote respect for these laws and holds violators accountable through international justice mechanisms.</p>',
        sourceType: 'original',
        imageUrl: 'https://www.un.org/sites/un2.un.org/files/international_law.jpg',
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
