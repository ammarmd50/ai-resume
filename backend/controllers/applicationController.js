const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const Notification = require('../models/Notification');
const aiService = require('../services/aiService');

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private (Candidate)
const applyJob = async (req, res, next) => {
  try {
    const { jobId, coverLetter } = req.body;

    if (!jobId) {
      res.status(400);
      throw new Error('Job ID is required');
    }

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404);
      throw new Error('Job listing not found');
    }

    // Check if duplicate application
    const alreadyApplied = await Application.findOne({ userId: req.user._id, jobId });
    if (alreadyApplied) {
      res.status(400);
      throw new Error('You have already applied for this job');
    }

    // Check if candidate has a resume
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      res.status(400);
      throw new Error('Please upload a resume before applying to jobs');
    }

    // Calculate match percentage
    const matchAnalysis = aiService.matchJobs(resume, [job])[0];
    const matchPercentage = matchAnalysis ? matchAnalysis.matchPercentage : 0;

    const application = await Application.create({
      userId: req.user._id,
      jobId,
      resumeId: resume._id,
      status: 'Applied',
      matchPercentage,
      coverLetter: coverLetter || resume.analysis.coverLetter || ''
    });

    // Notify Candidate
    await Notification.create({
      userId: req.user._id,
      title: 'Application Submitted',
      message: `Your application for "${job.title}" at "${job.company}" was submitted successfully. (AI Match: ${matchPercentage}%)`,
      type: 'APPLICATION_SUBMITTED'
    });

    // Notify Recruiter
    await Notification.create({
      userId: job.recruiterId,
      title: 'New Applicant Received',
      message: `${req.user.name} applied for "${job.title}" with a matching score of ${matchPercentage}%.`,
      type: 'GENERAL'
    });

    res.status(201).json({
      success: true,
      message: 'Applied for job successfully',
      application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get applications list (Candidate's applications or Recruiter's jobs applicants)
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res, next) => {
  try {
    if (req.user.role === 'candidate') {
      // Get all applications submitted by candidate
      const applications = await Application.find({ userId: req.user._id })
        .populate('jobId')
        .sort('-createdAt');

      res.status(200).json({
        success: true,
        count: applications.length,
        applications
      });
    } else if (req.user.role === 'recruiter') {
      // Get all jobs posted by the recruiter
      const recruiterJobs = await Job.find({ recruiterId: req.user._id });
      const jobIds = recruiterJobs.map(j => j._id);

      // Find applications matching those job IDs
      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('jobId')
        .populate({
          path: 'userId',
          select: 'name email profile'
        })
        .populate('resumeId')
        .sort('-createdAt');

      res.status(200).json({
        success: true,
        count: applications.length,
        applications
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (Recruiter only)
// @route   PUT /api/applications/:id
// @access  Private (Recruiter)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Applied', 'Reviewing', 'Interview', 'Rejected', 'Selected'];

    if (!status || !allowedStatuses.includes(status)) {
      res.status(400);
      throw new Error(`Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
    }

    let application = await Application.findById(req.params.id)
      .populate('jobId')
      .populate('userId');

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    // Verify the recruiter owns the job associated with this application
    const job = await Job.findById(application.jobId._id);
    if (!job || job.recruiterId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update applicant status for this job');
    }

    application.status = status;
    await application.save();

    // Custom alerts depending on status
    let notificationTitle = 'Application Status Updated';
    let notificationMsg = `Your application for "${job.title}" at "${job.company}" is now under "${status}" status.`;
    let type = 'GENERAL';

    if (status === 'Interview') {
      notificationTitle = 'Interview Scheduled!';
      notificationMsg = `Congratulations! You have been selected for an interview for the "${job.title}" position at "${job.company}". The recruiter will contact you shortly.`;
      type = 'INTERVIEW_SCHEDULED';
    } else if (status === 'Selected') {
      notificationTitle = 'Offer Selected!';
      notificationMsg = `Incredible news! You have been Selected for the "${job.title}" position at "${job.company}". Check your email for offer details.`;
    } else if (status === 'Rejected') {
      notificationTitle = 'Application Decision';
      notificationMsg = `Thank you for your interest in the "${job.title}" position at "${job.company}". Unfortunately, the company has decided to move forward with other candidates.`;
    }

    // Notify Candidate
    await Notification.create({
      userId: application.userId._id,
      title: notificationTitle,
      message: notificationMsg,
      type
    });

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyJob,
  getApplications,
  updateApplicationStatus
};
