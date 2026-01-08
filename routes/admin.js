const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');
const { ensureAuthenticated, canManagePosts, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// Admin dashboard
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const isManager = ['editor', 'admin'].includes(req.user.role);
    
    let posts;
    if (isManager) {
      posts = await Post.findAll({
        include: [{ model: User, as: 'author', attributes: ['name'] }],
        order: [
          ['isPinned', 'DESC'],
          ['sortOrder', 'ASC'],
          ['createdAt', 'DESC']
        ]
      });
    } else {
      posts = await Post.findAll({
        where: { authorId: req.user.id },
        include: [{ model: User, as: 'author', attributes: ['name'] }],
        order: [['createdAt', 'DESC']]
      });
    }

    const stats = {
      total: posts.length,
      pending: posts.filter(p => p.status === 'pending').length,
      approved: posts.filter(p => p.status === 'approved').length,
      rejected: posts.filter(p => p.status === 'rejected').length
    };

    res.render('admin/dashboard', {
      title: 'Dashboard',
      posts,
      stats,
      isManager
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

    const where = status === 'all' ? {} : { status };
    
    const posts = await Post.findAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });

    res.render('admin/posts-list', {
      title: `${status.charAt(0).toUpperCase() + status.slice(1)} Posts`,
      posts,
      currentStatus: status,
      isManager: true
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
