require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const { sequelize } = require('./models');

const app = express();

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is required in production');
  process.exit(1);
}

// Trust proxy (required for secure cookies behind Railway/Heroku proxy)
app.set('trust proxy', 1);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Log startup for debugging
console.log('App initializing...');
console.log('Views directory:', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// CSRF protection using HMAC-signed tokens (stateless — works on serverless)
const CSRF_SECRET = process.env.SESSION_SECRET || 'fallback-secret-key';
const CSRF_MAX_AGE = 24 * 60 * 60 * 1000;

function generateCsrfToken() {
  const timestamp = Date.now().toString(36);
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = timestamp + '.' + nonce;
  const signature = crypto.createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');
  return payload + '.' + signature;
}

function verifyCsrfToken(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [timestamp, nonce, signature] = parts;

  const tokenTime = parseInt(timestamp, 36);
  if (isNaN(tokenTime) || Date.now() - tokenTime > CSRF_MAX_AGE) return false;

  const payload = timestamp + '.' + nonce;
  const expected = crypto.createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');

  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

function csrfProtection(req, res, next) {
  res.locals.csrfToken = generateCsrfToken();

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (req.path.startsWith('/embed')) {
    return next();
  }

  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!verifyCsrfToken(token)) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }
    req.flash('error_msg', 'Form expired. Please try again.');
    return res.redirect('back');
  }

  next();
}

// Post counts middleware
const { addPostCounts } = require('./middleware/counts');

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// CSRF protection
app.use(csrfProtection);

// Add post counts for sidebar
app.use(addPostCounts);

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/posts', require('./routes/posts'));
app.use('/embed', require('./routes/embed'));
app.use('/api', require('./routes/api'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: '404 - Not Found',
    message: 'Page not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: '500 - Server Error',
    message: 'Something went wrong' 
  });
});

const PORT = process.env.PORT || 3000;

// Sync database - use alter to update schema
sequelize.sync(process.env.NODE_ENV === 'production' ? {} : { alter: true })
  .then(() => {
    console.log('Database connected and synced');
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
  });

// For Vercel serverless, export the app
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // For Railway/local, start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
