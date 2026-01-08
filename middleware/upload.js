const multer = require('multer');
const path = require('path');

// Use memory storage for serverless environments (Vercel)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max for base64 storage
  }
});

// Helper to convert file buffer to data URL
upload.toDataUrl = (file) => {
  if (!file || !file.buffer) return null;
  const base64 = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64}`;
};

module.exports = upload;
