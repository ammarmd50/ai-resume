const fs = require('fs');
const Resume = require('../models/Resume');
const Notification = require('../models/Notification');
const aiService = require('../services/aiService');

// @desc    Upload & analyze resume file
// @route   POST /api/resume/upload
// @access  Private (Candidate)
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a PDF or DOCX resume file');
    }

    // Read buffer from disk if using disk storage
    const fileBuffer = req.file.buffer || fs.readFileSync(req.file.path);

    // Perform AI analysis
    const analysisResult = await aiService.analyzeResume(
      fileBuffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Check if resume already exists
    let resume = await Resume.findOne({ userId: req.user._id });

    const resumeData = {
      userId: req.user._id,
      skills: analysisResult.skills || [],
      education: analysisResult.education || [],
      experience: analysisResult.experience || [],
      projects: analysisResult.projects || [],
      certifications: analysisResult.certifications || [],
      languages: analysisResult.languages || [],
      atsScore: analysisResult.atsScore || 0,
      aiSummary: analysisResult.aiSummary || '',
      uploadedFile: {
        filename: req.file.filename || req.file.originalname,
        path: req.file.path || 'buffer_upload',
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      },
      analysis: analysisResult.analysis
    };

    if (resume) {
      resume = await Resume.findOneAndUpdate(
        { userId: req.user._id },
        { $set: resumeData },
        { new: true }
      );
    } else {
      resume = await Resume.create(resumeData);
    }

    // Trigger Notification
    await Notification.create({
      userId: req.user._id,
      title: 'Resume Analyzed Successfully',
      message: `Your resume ${req.file.originalname} has been processed. ATS Score: ${resume.atsScore}/100.`,
      type: 'RESUME_UPLOADED'
    });

    res.status(200).json({
      success: true,
      message: 'Resume parsed and analyzed successfully',
      resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's resume
// @route   GET /api/resume
// @access  Private
const getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(200).json({
        success: true,
        message: 'No resume found for this user',
        resume: null
      });
    }

    res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current resume data manually
// @route   PUT /api/resume
// @access  Private (Candidate)
const updateResume = async (req, res, next) => {
  try {
    let resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error('No resume found to update');
    }

    // Keep backup values for ATS re-score if details change
    const updatedFields = req.body;
    
    // Perform automatic re-calculation of ATS score on update (mock-based algorithm)
    if (updatedFields.skills) {
      let baseScore = 60 + updatedFields.skills.length * 2.5;
      if (baseScore > 99) baseScore = 99;
      updatedFields.atsScore = Math.round(baseScore);
    }

    resume = await Resume.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    // Trigger Notification
    await Notification.create({
      userId: req.user._id,
      title: 'Resume Profile Updated',
      message: `Your resume details have been manually updated. New ATS score: ${resume.atsScore}/100.`,
      type: 'ATS_IMPROVED'
    });

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully',
      resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete current resume
// @route   DELETE /api/resume
// @access  Private (Candidate)
const deleteResume = async (req, res, next) => {
  try {
    const result = await Resume.findOneAndDelete({ userId: req.user._id });
    if (!result) {
      res.status(404);
      throw new Error('Resume not found');
    }

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResume,
  updateResume,
  deleteResume
};
