const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  status: {
    type: String,
    enum: ['Applied', 'Reviewing', 'Interview', 'Rejected', 'Selected'],
    default: 'Applied'
  },
  matchPercentage: {
    type: Number,
    default: 0
  },
  coverLetter: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Avoid duplicate applications
ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
