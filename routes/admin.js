const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Post, User } = require('../models');
const { ensureAuthenticated, canManagePosts, isAdmin } = require('../middleware/auth');
const { Op, fn, col, where: seqWhere, cast } = require('sequelize');

const POSTS_PER_PAGE = 10;

// Admin dashboard
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const isManager = ['editor', 'admin'].includes(req.user.role);
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const offset = (page - 1) * POSTS_PER_PAGE;
    
    let whereClause = {};
    if (!isManager) {
      whereClause.authorId = req.user.id;
    }
    
    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        seqWhere(cast(col('sourceType'), 'TEXT'), { [Op.iLike]: `%${search}%` })
      ];
    }

    // Get stats (all posts, not filtered by search)
    const statsWhere = isManager ? {} : { authorId: req.user.id };
    const allPosts = await Post.findAll({ where: statsWhere });
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
      search,
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
    const search = req.query.search || '';
    const offset = (page - 1) * POSTS_PER_PAGE;
    
    let where = status === 'all' ? {} : { status };
    
    // Add search filter
    if (search) {
      const searchConditions = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        seqWhere(cast(col('sourceType'), 'TEXT'), { [Op.iLike]: `%${search}%` })
      ];
      
      if (status !== 'all') {
        where = {
          [Op.and]: [
            { status },
            { [Op.or]: searchConditions }
          ]
        };
      } else {
        where[Op.or] = searchConditions;
      }
    }
    
    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
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
      search,
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
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const offset = (page - 1) * POSTS_PER_PAGE;
    
    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      limit: POSTS_PER_PAGE,
      offset: offset
    });

    const totalPages = Math.ceil(count / POSTS_PER_PAGE);

    res.render('admin/users', {
      title: 'User Management',
      users,
      search,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading users');
    res.redirect('/admin');
  }
});

// Create user (admin only)
router.post('/users/create', isAdmin, async (req, res) => {
  try {
    const { name, email, password, password2, role } = req.body;
    const errors = [];

    if (!name || !email || !password || !password2) {
      errors.push('Please fill in all fields');
    }

    if (password !== password2) {
      errors.push('Passwords do not match');
    }

    if (password && password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (role && !['user', 'editor', 'admin'].includes(role)) {
      errors.push('Invalid role');
    }

    if (errors.length > 0) {
      req.flash('error_msg', errors.join('. '));
      return res.redirect('/admin/users');
    }

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      req.flash('error_msg', 'Email is already registered');
      return res.redirect('/admin/users');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'user'
    });

    req.flash('success_msg', 'User created successfully');
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating user');
    res.redirect('/admin/users');
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


// Account page
router.get('/account', ensureAuthenticated, (req, res) => {
  res.render('admin/account', {
    title: 'Account'
  });
});

// Change password
router.post('/account/password', ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, newPassword2 } = req.body;
    const errors = [];

    if (!currentPassword || !newPassword || !newPassword2) {
      errors.push('Please fill in all fields');
    }

    if (newPassword !== newPassword2) {
      errors.push('New passwords do not match');
    }

    if (newPassword && newPassword.length < 6) {
      errors.push('New password must be at least 6 characters');
    }

    if (errors.length > 0) {
      req.flash('error_msg', errors.join('. '));
      return res.redirect('/admin/account');
    }

    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      req.flash('error_msg', 'Current password is incorrect');
      return res.redirect('/admin/account');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.update({ password: hashedPassword }, { where: { id: req.user.id } });

    req.flash('success_msg', 'Password updated successfully');
    res.redirect('/admin/account');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating password');
    res.redirect('/admin/account');
  }
});

module.exports = router;
