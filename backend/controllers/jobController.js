const Job = require('../models/Job');
const Resume = require('../models/Resume');
const aiService = require('../services/aiService');

// @desc    Get all jobs with optional filters and match scores
// @route   GET /api/jobs
// @access  Public (Optional auth for candidate matching)
const getJobs = async (req, res, next) => {
  try {
    const { 
      search, 
      location, 
      skills, 
      experience, 
      employmentType, 
      workMode,
      sortBy
    } = req.query;

    // Build filter query
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (skills) {
      // skills query can be array or comma-separated string
      const skillsArr = Array.isArray(skills) 
        ? skills 
        : skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      if (skillsArr.length > 0) {
        query.skills = { $in: skillsArr.map(s => new RegExp(s, 'i')) };
      }
    }

    if (experience) {
      query.experience = { $regex: experience, $options: 'i' };
    }

    if (employmentType) {
      query.employmentType = employmentType;
    }

    if (workMode) {
      query.workMode = workMode;
    }

    // Fetch jobs
    let jobs = await Job.find(query);

    // If candidate is logged in and has a resume, calculate AI match percentages
    let matchedJobs = [];
    let resume = null;

    if (req.user && req.user.role === 'candidate') {
      resume = await Resume.findOne({ userId: req.user._id });
    }

    if (resume && jobs.length > 0) {
      const matches = aiService.matchJobs(resume, jobs);
      
      // Merge match details into job objects
      matchedJobs = jobs.map(job => {
        const matchInfo = matches.find(m => m.jobId.toString() === job._id.toString());
        return {
          ...job.toObject(),
          matchPercentage: matchInfo ? matchInfo.matchPercentage : 0,
          matchExplanation: matchInfo ? matchInfo.explanation : 'No resume matching info',
          missingSkills: matchInfo ? matchInfo.missingSkills : [],
          strengths: matchInfo ? matchInfo.strengths : []
        };
      });

      // Handle sorting
      if (sortBy === 'match') {
        matchedJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);
      } else if (sortBy === 'salary') {
        // Simple heuristic salary sort
        matchedJobs.sort((a, b) => b.salary.localeCompare(a.salary));
      } else {
        // Default: newest
        matchedJobs.sort((a, b) => b.createdAt - a.createdAt);
      }
    } else {
      // Map basic values for candidates without resume or public requests
      matchedJobs = jobs.map(job => ({
        ...job.toObject(),
        matchPercentage: 0,
        matchExplanation: 'Upload your resume to see your match percentage!',
        missingSkills: job.skills,
        strengths: []
      }));

      // Sort public jobs
      if (sortBy === 'salary') {
        matchedJobs.sort((a, b) => b.salary.localeCompare(a.salary));
      } else {
        matchedJobs.sort((a, b) => b.createdAt - a.createdAt);
      }
    }

    res.status(200).json({
      success: true,
      count: matchedJobs.length,
      jobs: matchedJobs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a job posting
// @route   POST /api/jobs
// @access  Private (Recruiter)
const createJob = async (req, res, next) => {
  try {
    const { 
      title, 
      company, 
      location, 
      skills, 
      description, 
      salary, 
      experience, 
      employmentType, 
      workMode 
    } = req.body;

    if (!title || !company || !location || !description) {
      res.status(400);
      throw new Error('Please fill in all required fields (title, company, location, description)');
    }

    const job = await Job.create({
      recruiterId: req.user._id,
      title,
      company,
      location,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      description,
      salary,
      experience,
      employmentType: employmentType || 'Full-time',
      workMode: workMode || 'Onsite'
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job posting
// @route   PUT /api/jobs/:id
// @access  Private (Recruiter/Owner)
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404);
      throw new Error('Job posting not found');
    }

    // Double check ownership
    if (job.recruiterId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this job listing');
    }

    // Process skills if updated as comma string
    if (req.body.skills && !Array.isArray(req.body.skills)) {
      req.body.skills = req.body.skills.split(',').map(s => s.trim());
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      job
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job posting
// @route   DELETE /api/jobs/:id
// @access  Private (Recruiter/Owner)
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404);
      throw new Error('Job posting not found');
    }

    // Double check ownership
    if (job.recruiterId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this job listing');
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger explicit Job Match analysis for current resume
// @route   POST /api/ai/match-jobs
// @access  Private (Candidate)
const getJobMatchAnalysis = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      res.status(400);
      throw new Error('Please upload a resume first before matching jobs');
    }

    const jobs = await Job.find({});
    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        matches: []
      });
    }

    const matches = aiService.matchJobs(resume, jobs);
    
    // Enrich with job info
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
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  getJobMatchAnalysis
};
