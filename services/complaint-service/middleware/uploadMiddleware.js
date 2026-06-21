const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { fileTypeFromBuffer } = require('file-type');

// ── Ensure uploads dir exists ────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Memory storage (magic bytes check ke baad manually save karenge) ─────────
const storage = multer.memoryStorage();

// ── File filter: extension + MIME check ──────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype);
  if (!extOk || !mimeOk) return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed.'), false);
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Magic bytes verify + disk save middleware ─────────────────────────────────
const verifyAndSave = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const type = await fileTypeFromBuffer(req.file.buffer);
    if (!type || !/^image\//.test(type.mime)) {
      return res.status(400).json({ error: 'File content does not match image type.' });
    }
    // Disk pe save karo
    const unique   = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `complaint-${unique}${path.extname(req.file.originalname)}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);
    req.file.path     = filepath;
    req.file.filename = filename;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, verifyAndSave };
