const https = require('https');
const http = require('http');
const bcrypt = require('bcryptjs');
const { User, Post, sequelize } = require('../models');

// Download image and convert to base64
function downloadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImageAsBase64(response.headers.location).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const base64 = buffer.toString('base64');
        resolve(`data:${contentType};base64,${base64}`);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Image URLs to download (using reliable Unsplash sources)
const imageUrls = [
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&q=70', // UN building
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=70', // Conference
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=70', // Cooperation
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=70', // Team meeting
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=70', // Community
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=70', // Global
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=70', // Security
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=70', // Handshake
  'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=600&q=70', // Dove peace
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=70', // Globe
  'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600&q=70', // Justice
];

async function seedWithImages() {
  try {
    await sequelize.sync();
    console.log('Database connected');
    
    // Download all images
    console.log('Downloading images...');
    const base64Images = [];
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        console.log(`  Downloading image ${i + 1}/${imageUrls.length}...`);
        const base64 = await downloadImageAsBase64(imageUrls[i]);
        base64Images.push(base64);
        console.log(`  ✓ Image ${i + 1} downloaded (${Math.round(base64.length / 1024)}KB)`);
      } catch (err) {
        console.log(`  ✗ Failed to download image ${i + 1}: ${err.message}`);
        base64Images.push(null);
      }
    }
    
    // Find or create admin user
    let admin = await User.findOne({ where: { email: 'robert.f.irish@gmail.com' } });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('U8zx4.o68wYFQs*g9Aw@', salt);
      admin = await User.create({
        name: 'Robert Irish',
        email: 'robert.f.irish@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created');
    }
    
    // Delete all existing posts
    await Post.destroy({ where: {} });
    console.log('Existing posts deleted');
    
    // Create posts with embedded base64 images
    const posts = [
      {
        title: 'UN Peacekeeping: Service and Sacrifice',
        content: '<p>Since 1948, UN Peacekeepers have served in over 70 operations worldwide. Their unwavering commitment to peace and the sacrifices made to protect civilians in conflict zones continue to inspire the world.</p><p>Today, over 87,000 peacekeepers serve in 12 missions across the globe.</p>',
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
        content: '<p>The UN Security Council convenes to address pressing threats to international peace and security. Watch how the Council works to resolve global conflicts through diplomacy and collective action.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=pPXPCPMbCQI',
        sourceId: 'pPXPCPMbCQI',
        imageUrl: 'https://img.youtube.com/vi/pPXPCPMbCQI/hqdefault.jpg',
        status: 'approved',
        sortOrder: 1,
        authorId: admin.id
      },
      {
        title: 'Women in Peacekeeping',
        content: '<p>Women peacekeepers play a crucial role in UN missions. They build trust with local communities and are essential to achieving sustainable peace. Their presence improves access to local populations and enhances mission effectiveness.</p>',
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
        content: '<p>Learn about the UN\'s mandate to protect civilians and support political processes in conflict zones around the world. Peacekeeping has proven to be one of the most effective tools for helping countries navigate the difficult path from conflict to peace.</p>',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=Igk3SY6MWUo',
        sourceId: 'Igk3SY6MWUo',
        imageUrl: 'https://img.youtube.com/vi/Igk3SY6MWUo/hqdefault.jpg',
        status: 'approved',
        sortOrder: 3,
        authorId: admin.id
      },
      {
        title: 'International Day of UN Peacekeepers',
        content: '<p>On International Day of UN Peacekeepers, we honour the service and sacrifice of peacekeepers who have lost their lives in the cause of peace. Their courage and dedication will never be forgotten. #PKDay #ServingForPeace</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UNPeacekeeping/status/1795123456789012345',
        sourceId: '1795123456789012345',
        imageUrl: base64Images[0],
        status: 'approved',
        sortOrder: 4,
        authorId: admin.id
      },
      {
        title: 'Security Council Open Debate',
        content: '<p>The Security Council held an open debate on maintaining international peace and security. Member states emphasized the importance of multilateral cooperation and dialogue. #UNSC #Peace #Diplomacy</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UN/status/1798765432109876543',
        sourceId: '1798765432109876543',
        imageUrl: base64Images[1],
        status: 'approved',
        sortOrder: 5,
        authorId: admin.id
      },
      {
        title: 'Blue Helmets: Guardians of Peace',
        content: '<p>UN peacekeepers continue their vital mission to protect civilians and support peace processes. Their dedication saves lives every day in some of the world\'s most challenging environments. #BlueHelmets #UNPeacekeeping</p>',
        sourceType: 'twitter',
        sourceUrl: 'https://twitter.com/UNPeacekeeping/status/1801234567890123456',
        sourceId: '1801234567890123456',
        imageUrl: base64Images[2],
        status: 'approved',
        sortOrder: 6,
        authorId: admin.id
      },
      {
        title: 'Peacekeepers Training for Tomorrow',
        content: '<p>UN peacekeepers undergo rigorous training before deployment. From conflict resolution to first aid, our troops are prepared for any challenge they may face in the field.</p>',
        sourceType: 'instagram',
        sourceUrl: 'https://www.instagram.com/p/C8abc123def/',
        sourceId: 'C8abc123def',
        imageUrl: base64Images[3],
        status: 'approved',
        sortOrder: 7,
        authorId: admin.id
      },
      {
        title: 'Building Peace Through Community',
        content: '<p>Building trust with local communities is essential to peacekeeping success. Our personnel work alongside civilians to foster dialogue and reconciliation, creating foundations for lasting peace.</p>',
        sourceType: 'instagram',
        sourceUrl: 'https://www.instagram.com/p/C9xyz789ghi/',
        sourceId: 'C9xyz789ghi',
        imageUrl: base64Images[4],
        status: 'approved',
        sortOrder: 8,
        authorId: admin.id
      },
      {
        title: 'The Role of the Security Council in Global Peace',
        content: '<p>The UN Security Council has primary responsibility for maintaining international peace and security. Its five permanent members and ten elected members work to address conflicts before they escalate.</p><p>Through resolutions, sanctions, and peacekeeping mandates, the Council remains the cornerstone of the international security architecture.</p>',
        sourceType: 'original',
        imageUrl: base64Images[5],
        status: 'approved',
        isPinned: true,
        sortOrder: 9,
        authorId: admin.id
      },
      {
        title: 'Disarmament: Building a Safer World',
        content: '<p>The UN continues to lead global efforts on disarmament and non-proliferation. From nuclear weapons to small arms, reducing the availability of weapons is crucial to preventing conflict.</p><p>The Office for Disarmament Affairs supports multilateral negotiations and promotes international norms against weapons of mass destruction.</p>',
        sourceType: 'original',
        imageUrl: base64Images[6],
        status: 'approved',
        sortOrder: 10,
        authorId: admin.id
      },
      {
        title: 'Mediation and Conflict Prevention',
        content: '<p>Prevention is better than cure. The UN\'s Department of Political and Peacebuilding Affairs works to prevent conflicts through early warning, mediation, and diplomatic engagement.</p><p>Special envoys and mediators are deployed worldwide to facilitate dialogue between parties and find peaceful solutions to disputes.</p>',
        sourceType: 'original',
        imageUrl: base64Images[7],
        status: 'approved',
        sortOrder: 11,
        authorId: admin.id
      },
      {
        title: 'Peacebuilding After Conflict',
        content: '<p>Ending a war is only the first step. The UN Peacebuilding Commission supports countries emerging from conflict to ensure they don\'t relapse into violence.</p><p>From institution building to reconciliation programs, peacebuilding addresses the root causes of conflict and builds foundations for lasting peace.</p>',
        sourceType: 'original',
        imageUrl: base64Images[8],
        status: 'approved',
        sortOrder: 12,
        authorId: admin.id
      },
      {
        title: 'Counter-Terrorism: A United Response',
        content: '<p>The UN Office of Counter-Terrorism coordinates the organization\'s efforts against terrorism. The UN Global Counter-Terrorism Strategy provides a framework for member states to work together.</p><p>Addressing conditions conducive to terrorism while upholding human rights remains central to the UN approach.</p>',
        sourceType: 'original',
        imageUrl: base64Images[9],
        status: 'approved',
        sortOrder: 13,
        authorId: admin.id
      },
      {
        title: 'International Humanitarian Law',
        content: '<p>Even in war, there are rules. International humanitarian law protects those who are not participating in hostilities and restricts the means and methods of warfare.</p><p>The UN works to promote respect for these laws and holds violators accountable through international justice mechanisms.</p>',
        sourceType: 'original',
        imageUrl: base64Images[10],
        status: 'approved',
        sortOrder: 14,
        authorId: admin.id
      }
    ];
    
    for (const post of posts) {
      await Post.create(post);
    }
    
    console.log(`\n✓ Created ${posts.length} UN Peace and Security posts`);
    console.log('\nPost breakdown:');
    console.log('- YouTube: 4 posts (with thumbnail fallbacks)');
    console.log('- Twitter/X: 3 posts (with embedded images)');
    console.log('- Instagram: 2 posts (with embedded images)');
    console.log('- Original: 6 posts (with embedded images)');
    console.log('\nAll images stored as base64 in the database!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedWithImages();
