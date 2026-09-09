const {
  createApplication: createApplicationModel,
  findApplicationById,
  listApplicationsByJobId,
  listApplicationsByFreelancerId,
  updateApplicationStatus: updateApplicationStatusModel,
  withdrawApplication: withdrawApplicationModel
} = require('../models/application.model');
const { findJobById } = require('../models/job.model');
const ApiError = require('../utils/ApiError');

const VALID_CLIENT_STATUSES = ['shortlisted', 'accepted', 'rejected'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Apply to an open job (Freelancer-only)
 */
const applyToJob = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      throw new ApiError(403, 'Only freelancers can apply to jobs');
    }

    const { jobId, proposal } = req.body;

    if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
      throw new ApiError(400, 'jobId is required');
    }

    if (!UUID_REGEX.test(jobId.trim())) {
      throw new ApiError(404, 'Job not found');
    }

    if (proposal !== undefined && proposal !== null && typeof proposal !== 'string') {
      throw new ApiError(400, 'Proposal must be a string');
    }

    // Check job existence and open status
    const job = await findJobById(jobId.trim());
    if (!job) {
      throw new ApiError(404, 'Job not found');
    }

    if (job.status !== 'open') {
      throw new ApiError(400, 'This job is no longer accepting applications');
    }

    // Insert application - catch PostgreSQL unique constraint violation (code 23505)
    let application;
    try {
      application = await createApplicationModel({
        jobId: job.id,
        freelancerId: req.user.id,
        proposal: proposal ? proposal.trim() : null
      });
    } catch (err) {
      if (err.code === '23505') {
        throw new ApiError(409, 'You have already applied to this job');
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get applicants for a job (Client-only, owner verified)
 */
const getJobApplicants = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      throw new ApiError(403, 'Only clients can view job applicants');
    }

    const { jobId } = req.params;

    if (!jobId || !UUID_REGEX.test(jobId)) {
      throw new ApiError(404, 'Job not found');
    }

    // Verify ownership obscuring: must exist and belong to req.user.id
    const job = await findJobById(jobId);
    if (!job || job.client_id !== req.user.id) {
      throw new ApiError(404, 'Job not found');
    }

    const applications = await listApplicationsByJobId(jobId);

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all applications submitted by authenticated freelancer
 */
const getMyApplications = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      throw new ApiError(403, 'Only freelancers can view their applications');
    }

    const applications = await listApplicationsByFreelancerId(req.user.id);

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update application status (Client-only, job owner enforced at query level)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      throw new ApiError(403, 'Only clients can update application status');
    }

    const { applicationId } = req.params;
    if (!applicationId || !UUID_REGEX.test(applicationId)) {
      throw new ApiError(404, 'Application not found');
    }

    const { status } = req.body;
    if (!status || !VALID_CLIENT_STATUSES.includes(status)) {
      throw new ApiError(
        400,
        `Invalid status. Must be one of: ${VALID_CLIENT_STATUSES.join(', ')}`
      );
    }

    const updatedApplication = await updateApplicationStatusModel(
      applicationId,
      req.user.id,
      status
    );

    if (!updatedApplication) {
      // Obscure whether application doesn't exist or belongs to another client's job
      throw new ApiError(404, 'Application not found');
    }

    res.status(200).json({
      success: true,
      application: updatedApplication
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw an application (Freelancer-only, must be pending)
 */
const withdrawMyApplication = async (req, res, next) => {
  try {
    if (req.user.role !== 'freelancer') {
      throw new ApiError(403, 'Only freelancers can withdraw applications');
    }

    const { applicationId } = req.params;
    if (!applicationId || !UUID_REGEX.test(applicationId)) {
      throw new ApiError(404, 'Application not found or cannot be withdrawn');
    }

    const application = await withdrawApplicationModel(applicationId, req.user.id);
    if (!application) {
      throw new ApiError(404, 'Application not found or cannot be withdrawn');
    }

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getJobApplicants,
  getMyApplications,
  updateApplicationStatus,
  withdrawMyApplication
};
