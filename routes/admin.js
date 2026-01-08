const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');
const { ensureAuthenticated, canManagePosts, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

const POSTS_PER_PAGE = 10;

// Admin dashboard
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const isManager = ['editor', 'admin'].includes(req.user.role);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * POSTS_PER_PAGE;
    
    let whereClause = {};
    if (!isManager) {
      whereClause.authorId = req.user.id;
    }

    // Get stats first (all posts)
    const allPosts = await Post.findAll({ where: whereClause });
    const stats = {
      total: allPosts.length,
      pending: allPosts.filter(p => p.status === 'pending').length,
      approved: allPosts.filter(p => p.status === 'approved').length,
      rejected: allPosts.filter(p => p.status === 'rejected').length
    };

    // Get paginated posts
    const { count, rows: posts } = await Post.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: POSTS_PER_PAGE,
      offset: offset
    });

    const totalPages = Math.ceil(count / POSTS_PER_PAGE);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      posts,
      stats,
      isManager,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/');
  }
});

// Filter posts by status
router.get('/posts/:status', canManagePosts, async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'approved', 'rejected', 'all'];
    
    if (!validStatuses.includes(status)) {
      return res.redirect('/admin');
    }

    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * POSTS_PER_PAGE;
    const where = status === 'all' ? {} : { status };
    
    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: POSTS_PER_PAGE,
      offset: offset
    });

    const totalPages = Math.ceil(count / POSTS_PER_PAGE);

    res.render('admin/posts-list', {
      title: `${status.charAt(0).toUpperCase() + status.slice(1)} Posts`,
      posts,
      currentStatus: status,
      isManager: true,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading posts');
    res.redirect('/admin');
  }
});

// User management (admin only)
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    res.render('admin/users', {
      title: 'User Management',
      users
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading users');
    res.redirect('/admin');
  }
});

// Update user role (admin only)
router.post('/users/:id/role', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'editor', 'admin'].includes(role)) {
      req.flash('error_msg', 'Invalid role');
      return res.redirect('/admin/users');
    }

    // Prevent admin from changing their own role
    if (id === req.user.id) {
      req.flash('error_msg', 'You cannot change your own role');
      return res.redirect('/admin/users');
    }

    await User.update({ role }, { where: { id } });
    req.flash('success_msg', 'User role updated');
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating user role');
    res.redirect('/admin/users');
  }
});

// Delete user (admin only)
router.post('/users/:id/delete', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.user.id) {
      req.flash('error_msg', 'You cannot delete yourself');
      return res.redirect('/admin/users');
    }

    await User.destroy({ where: { id } });
    req.flash('success_msg', 'User deleted');
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting user');
    res.redirect('/admin/users');
  }
});

module.exports = router;
