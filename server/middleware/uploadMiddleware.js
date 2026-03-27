const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
]);

const allowedExtensions = new Set(['.pdf', '.docx', '.doc']);
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 5);

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 60);
    cb(null, `${Date.now()}_${safeBase}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(ext)) {
    const error = new Error('Unsupported file format. Please upload PDF, DOCX, or DOC.');
    error.statusCode = 400;
    error.clientMessage = 'Unsupported file format. Please upload PDF, DOCX, or DOC.';
    return cb(error);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter
});

module.exports = { upload };
