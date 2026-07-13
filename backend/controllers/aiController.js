const { GoogleGenerativeAI } = require('@google/generative-ai');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const aiService = require('../services/aiService');

// @desc    Analyze raw resume text
// @route   POST /api/ai/analyze-resume
// @access  Private (Candidate)
const analyzeResumeText = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400);
      throw new Error('Please provide resume text to analyze');
    }

    const buffer = Buffer.from(text, 'utf-8');
    const parsedData = await aiService.analyzeResume(buffer, 'resume.txt', 'text/plain');

    // Update or create active resume
    let resume = await Resume.findOne({ userId: req.user._id });

    const resumeFields = {
      userId: req.user._id,
      skills: parsedData.skills,
      education: parsedData.education,
      experience: parsedData.experience,
      projects: parsedData.projects,
      certifications: parsedData.certifications,
      languages: parsedData.languages,
      atsScore: parsedData.atsScore,
      aiSummary: parsedData.aiSummary,
      uploadedFile: {
        filename: 'text_input.txt',
        path: 'text_input',
        originalName: 'Text Input',
        mimeType: 'text/plain',
        size: buffer.length
      },
      analysis: parsedData.analysis
    };

    if (resume) {
      resume = await Resume.findOneAndUpdate(
        { userId: req.user._id },
        { $set: resumeFields },
        { new: true }
      );
    } else {
      resume = await Resume.create(resumeFields);
    }

    res.status(200).json({
      success: true,
      message: 'Resume text analyzed successfully',
      resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Improve resume summary statement
// @route   POST /api/ai/improve-summary
// @access  Private
const improveSummary = async (req, res, next) => {
  try {
    const { summary } = req.body;
    if (!summary) {
      res.status(400);
      throw new Error('Please provide a summary draft to improve');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Rule-based high-quality enhancement mock
      const improved = `Highly motivated and results-driven Software Engineer with extensive hands-on experience in modern technology stacks. Demonstrated track record of optimizing software performance, collaborating with cross-functional teams, and implementing scalable systems: ${summary.trim()}`;
      
      return res.status(200).json({
        success: true,
        original: summary,
        improved
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a professional resume writer and career coach. Rewrite the following resume summary to be highly professional, impactful, and ATS-optimized. Keep it between 2 and 3 sentences. Return ONLY the improved summary text, with no explanations or introductory remarks.
    
    Draft Summary:
    "${summary}"`;

    const result = await model.generateContent(prompt);
    const improvedText = result.response.text().trim();

    res.status(200).json({
      success: true,
      original: summary,
      improved: improvedText
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Match resume against jobs (explicit trigger)
// @route   POST /api/ai/match-jobs
// @access  Private (Candidate)
const matchJobsExplicit = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      res.status(400);
      throw new Error('Please upload or analyze a resume first');
    }

    const jobs = await Job.find({});
    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        matches: []
      });
    }

    const matches = aiService.matchJobs(resume, jobs);
    const enrichedMatches = matches.map(match => {
      const jobInfo = jobs.find(j => j._id.toString() === match.jobId.toString());
      return {
        ...match,
        job: jobInfo
      };
    });

    res.status(200).json({
      success: true,
      matches: enrichedMatches
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeResumeText,
  improveSummary,
  matchJobsExplicit
};
