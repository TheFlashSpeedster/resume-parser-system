const express = require('express');
const { upload } = require('../middleware/uploadMiddleware');
const {
  uploadResume,
  getResumeById,
  exportResumeJson
} = require('../controllers/publicResumeController');

const router = express.Router();

router.post('/upload', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        err.statusCode = 400;
        err.clientMessage = `File too large. Maximum allowed size is ${process.env.MAX_FILE_SIZE_MB || 5}MB.`;
      }
      return next(err);
    }
    return next();
  });
}, uploadResume);

router.get('/:id', getResumeById);
router.get('/:id/export/json', exportResumeJson);

module.exports = router;
