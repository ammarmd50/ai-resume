const express = require('express');
const { analyzeResumeText, improveSummary, matchJobsExplicit } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze-resume', protect, authorize('candidate'), analyzeResumeText);
router.post('/improve-summary', protect, improveSummary);
router.post('/match-jobs', protect, authorize('candidate'), matchJobsExplicit);

module.exports = router;
