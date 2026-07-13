const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [{ type: String }],
  education: [{
    school: { type: String },
    degree: { type: String },
    fieldOfStudy: { type: String },
    from: { type: Date },
    to: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String }
  }],
  experience: [{
    title: { type: String },
    company: { type: String },
    location: { type: String },
    from: { type: Date },
    to: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String }
  }],
  projects: [{
    title: { type: String },
    description: { type: String },
    technologies: [{ type: String }],
    link: { type: String }
  }],
  certifications: [{
    name: { type: String },
    issuer: { type: String },
    date: { type: Date }
  }],
  languages: [{ type: String }],
  atsScore: { type: Number, default: 0 },
  aiSummary: { type: String, default: '' },
  uploadedFile: {
    filename: { type: String },
    path: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number }
  },
  analysis: {
    detectedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    strongSkills: [{ type: String }],
    weakSkills: [{ type: String }],
    grammarCheck: [{
      mistake: { type: String },
      correction: { type: String },
      explanation: { type: String }
    }],
    formattingIssues: [{ type: String }],
    suggestions: {
      resumeTitle: { type: String },
      summary: { type: String },
      missingKeywords: [{ type: String }],
      missingProjects: [{ type: String }],
      missingAchievements: [{ type: String }],
      improvedBulletPoints: [{
        original: { type: String },
        improved: { type: String },
        reason: { type: String }
      }]
    },
    linkedInHeadline: { type: String },
    resumeHeadline: { type: String },
    professionalBio: { type: String },
    coverLetter: { type: String },
    interviewQuestions: [{
      question: { type: String },
      answerOutline: { type: String }
    }],
    learningResources: [{
      skill: { type: String },
      resourceName: { type: String },
      url: { type: String }
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);
