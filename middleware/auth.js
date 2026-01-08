// Ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
};

// Ensure user is guest (not logged in)
const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/admin');
};

// Check if user has required role
const ensureRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Please log in to access this page');
      return res.redirect('/auth/login');
    }
    
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    req.flash('error_msg', 'You do not have permission to access this page');
    res.redirect('/admin');
  };
};

// Check if user can manage posts (editor or admin)
const canManagePosts = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error_msg', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  
  if (['editor', 'admin'].includes(req.user.role)) {
    return next();
  }
  
  req.flash('error_msg', 'You do not have permission to manage posts');
  res.redirect('/admin');
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error_msg', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  req.flash('error_msg', 'Admin access required');
  res.redirect('/admin');
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureRole,
  canManagePosts,
  isAdmin
};
