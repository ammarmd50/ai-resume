const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    required: true
  },
  salary: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    default: ''
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Other'],
    default: 'Full-time'
  },
  workMode: {
    type: String,
    enum: ['Remote', 'Hybrid', 'Onsite'],
    default: 'Onsite'
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
