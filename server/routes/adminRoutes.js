const express = require('express');
const { requireAdminAuth } = require('../middleware/authMiddleware');
const { login, logout, sessionStatus } = require('../controllers/adminAuthController');
const { getDashboard } = require('../controllers/adminDashboardController');
const {
  getAllResumes,
  getResumeByIdAdmin,
  updateResumeById,
  deleteResumeById,
  exportAllResumesCsv,
  exportAllResumesJson,
  exportSingleResumeJsonAdmin,
  getLogs
} = require('../controllers/adminResumeController');

const router = express.Router();

router.post('/login', login);
router.post('/logout', requireAdminAuth, logout);
router.get('/session', sessionStatus);

router.get('/dashboard', requireAdminAuth, getDashboard);
router.get('/resumes', requireAdminAuth, getAllResumes);
router.get('/resumes/:id', requireAdminAuth, getResumeByIdAdmin);
router.put('/resumes/:id', requireAdminAuth, updateResumeById);
router.delete('/resumes/:id', requireAdminAuth, deleteResumeById);
router.get('/resumes/:id/export/json', requireAdminAuth, exportSingleResumeJsonAdmin);
router.get('/export/csv', requireAdminAuth, exportAllResumesCsv);
router.get('/export/json', requireAdminAuth, exportAllResumesJson);
router.get('/logs', requireAdminAuth, getLogs);

module.exports = router;
