const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['RESUME_UPLOADED', 'ATS_IMPROVED', 'JOB_MATCHED', 'APPLICATION_SUBMITTED', 'INTERVIEW_SCHEDULED', 'GENERAL'],
    default: 'GENERAL'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
