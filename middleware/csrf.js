const crypto = require('crypto');

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

function rejectCsrf(req, res) {
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
  }
  req.flash('error_msg', 'Form expired. Please try again.');
  return res.redirect('back');
}

// Global middleware: generates token for all requests, validates non-multipart POSTs
function csrfProtection(req, res, next) {
  res.locals.csrfToken = generateCsrfToken();

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (req.path.startsWith('/embed')) {
    return next();
  }

  // Defer validation for multipart — body isn't parsed until multer runs
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }

  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!verifyCsrfToken(token)) {
    return rejectCsrf(req, res);
  }

  next();
}

// Route-level middleware: validates CSRF after multer has parsed the multipart body
function csrfValidate(req, res, next) {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!verifyCsrfToken(token)) {
    return rejectCsrf(req, res);
  }
  next();
}

module.exports = { csrfProtection, csrfValidate };
