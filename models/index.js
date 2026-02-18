const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'editor', 'admin'),
    defaultValue: 'user'
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Post Model
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sourceType: {
    type: DataTypes.ENUM('original', 'instagram', 'twitter', 'youtube'),
    defaultValue: 'original'
  },
  sourceUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sourceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  embedHtml: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  linkUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  embedRestricted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'posts',
  timestamps: true
});

// Associations
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Post, { foreignKey: 'reviewerId', as: 'reviewedPosts' });
Post.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

module.exports = {
  sequelize,
  User,
  Post
};
