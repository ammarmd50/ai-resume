const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadResume, getResume, updateResume, deleteResume } = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter (PDF & DOCX only)
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF (.pdf) and Word Document (.docx) files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.post('/upload', protect, authorize('candidate'), upload.single('resume'), uploadResume);
router.get('/', protect, getResume);
router.put('/', protect, authorize('candidate'), updateResume);
router.delete('/', protect, authorize('candidate'), deleteResume);

module.exports = router;
