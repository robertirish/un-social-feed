require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Post } = require('../models');

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    console.log('Syncing database...');
    await sequelize.sync({ force: true });
    
    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('Creating sample posts...');
    await Post.bulkCreate([
      {
        title: 'Welcome to Social Feed',
        content: '<p>This is your first post! You can create, edit, and manage posts from the dashboard.</p>',
        status: 'approved',
        sourceType: 'original',
        sortOrder: 0,
        authorId: admin.id
      },
      {
        title: 'Sample YouTube Video',
        content: '<p>You can embed YouTube videos by selecting YouTube as the source type and pasting the video URL.</p>',
        status: 'approved',
        sourceType: 'youtube',
        sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sourceId: 'dQw4w9WgXcQ',
        imageUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        sortOrder: 1,
        authorId: admin.id
      },
      {
        title: 'Pending Review Example',
        content: '<p>This post is pending review. Regular users submissions will appear like this until approved.</p>',
        status: 'pending',
        sourceType: 'original',
        sortOrder: 2,
        authorId: admin.id
      }
    ]);
    
    console.log('Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
