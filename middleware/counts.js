const { Post } = require('../models');

// Middleware to add post counts to res.locals for sidebar
const addPostCounts = async (req, res, next) => {
  if (req.isAuthenticated() && ['editor', 'admin'].includes(req.user.role)) {
    try {
      const [pending, approved, rejected, total] = await Promise.all([
        Post.count({ where: { status: 'pending' } }),
        Post.count({ where: { status: 'approved' } }),
        Post.count({ where: { status: 'rejected' } }),
        Post.count()
      ]);
      
      res.locals.postCounts = {
        pending,
        approved,
        rejected,
        total
      };
    } catch (err) {
      console.error('Error fetching post counts:', err);
      res.locals.postCounts = null;
    }
  } else {
    res.locals.postCounts = null;
  }
  next();
};

module.exports = { addPostCounts };
