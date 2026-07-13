const express = require('express');
const { applyJob, getApplications, updateApplicationStatus } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('candidate'), applyJob);
router.get('/', protect, getApplications);
router.put('/:id', protect, authorize('recruiter'), updateApplicationStatus);

module.exports = router;
