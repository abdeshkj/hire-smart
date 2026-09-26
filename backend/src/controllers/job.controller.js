const {
  createJob: createJobModel,
  findJobById: findJobByIdModel,
  listOpenJobs: listOpenJobsModel,
  countOpenJobs: countOpenJobsModel,
  listJobsByClientId: listJobsByClientIdModel,
  updateJobStatus: updateJobStatusModel,
  addJobSkill,
  getJobSkills
} = require('../models/job.model');
const { createSkill } = require('../models/skill.model');
const { triggerJobEmbedding } = require('../services/mlService.client');
const ApiError = require('../utils/ApiError');

const VALID_EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert'];
const VALID_STATUS_VALUES = ['open', 'closed', 'filled'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Create a new job posting (Client-only)
 */
const createJob = async (req, res, next) => {
  try {
    // Role check
    if (req.user.role !== 'client') {
      throw new ApiError(403, 'Only clients can post jobs');
    }

    const {
      title,
      description,
      budget,
      experienceRequirement,
      experience_requirement,
      requiredSkills,
      required_skills
    } = req.body;

    // Validate title (required non-empty string)
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new ApiError(400, 'Title is required');
    }

    // Validate description (optional string)
    if (description !== undefined && description !== null && typeof description !== 'string') {
      throw new ApiError(400, 'Description must be a string');
    }

    // Validate budget (optional positive number)
    let parsedBudget = null;
    if (budget !== undefined && budget !== null) {
      parsedBudget = Number(budget);
      if (typeof budget === 'boolean' || isNaN(parsedBudget) || parsedBudget <= 0) {
        throw new ApiError(400, 'Budget must be a positive number');
      }
    }

    // Validate experienceRequirement (optional enum)
    const resolvedExp = experienceRequirement !== undefined ? experienceRequirement : experience_requirement;
    if (resolvedExp !== undefined && resolvedExp !== null) {
      if (!VALID_EXPERIENCE_LEVELS.includes(resolvedExp)) {
        throw new ApiError(
          400,
          `Invalid experience requirement. Must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}`
        );
      }
    }

    // Validate requiredSkills (optional non-empty array of non-empty strings)
    const resolvedSkills = requiredSkills !== undefined ? requiredSkills : required_skills;
    if (resolvedSkills !== undefined && resolvedSkills !== null) {
      if (
        !Array.isArray(resolvedSkills) ||
        resolvedSkills.length === 0 ||
        resolvedSkills.some((s) => typeof s !== 'string' || !s.trim())
      ) {
        throw new ApiError(400, 'requiredSkills must be a non-empty array of non-empty strings');
      }
    }

    // Create job in DB
    const job = await createJobModel({
      clientId: req.user.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      budget: parsedBudget,
      experienceRequirement: resolvedExp || null
    });

    // Link skills (reusing skill model createSkill)
    if (resolvedSkills && Array.isArray(resolvedSkills)) {
      for (const skillName of resolvedSkills) {
        const skill = await createSkill({ name: skillName.trim() });
        await addJobSkill(job.id, skill.id);
      }
    }

    // Fetch attached skills
    const skills = await getJobSkills(job.id);

    // Trigger ML service embedding generation (fire-and-forget, non-blocking)
    triggerJobEmbedding(job.id, {
      title: job.title,
      description: job.description,
      experienceRequirement: job.experience_requirement,
      skills: skills.map((s) => s.name)
    });

    res.status(201).json({
      success: true,
      job: {
        ...job,
        skills
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List open jobs (reverse-chronological, pagination)
 */
const listJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      listOpenJobsModel({ limit, offset }),
      countOpenJobsModel()
    ]);

    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const skills = await getJobSkills(job.id);
        return {
          ...job,
          skills
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      jobs: jobsWithSkills,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get job by ID with linked skills (any status, any authenticated user)
 */
const getJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!jobId || !UUID_REGEX.test(jobId)) {
      throw new ApiError(404, 'Job not found');
    }

    const job = await findJobByIdModel(jobId);
    if (!job) {
      throw new ApiError(404, 'Job not found');
    }

    const skills = await getJobSkills(job.id);

    res.status(200).json({
      success: true,
      job: {
        ...job,
        skills
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all jobs posted by the authenticated client (regardless of status)
 */
const getMyJobs = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      throw new ApiError(403, 'Only clients can view their posted jobs');
    }

    const jobs = await listJobsByClientIdModel(req.user.id);

    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const skills = await getJobSkills(job.id);
        return {
          ...job,
          skills
        };
      })
    );

    res.status(200).json({
      success: true,
      count: jobsWithSkills.length,
      jobs: jobsWithSkills
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update job status (Client-only, ownership enforced at query level)
 */
const updateJobStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      throw new ApiError(403, 'Only clients can update job status');
    }

    const { jobId } = req.params;
    if (!jobId || !UUID_REGEX.test(jobId)) {
      throw new ApiError(404, 'Job not found');
    }

    const { status } = req.body;
    if (!status || !VALID_STATUS_VALUES.includes(status)) {
      throw new ApiError(
        400,
        `Invalid status. Must be one of: ${VALID_STATUS_VALUES.join(', ')}`
      );
    }

    const updatedJob = await updateJobStatusModel(jobId, req.user.id, status);
    if (!updatedJob) {
      // Deliberately do not distinguish "not found" from "not yours"
      throw new ApiError(404, 'Job not found');
    }

    const skills = await getJobSkills(updatedJob.id);

    res.status(200).json({
      success: true,
      job: {
        ...updatedJob,
        skills
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  listJobs,
  getJobById,
  getMyJobs,
  updateJobStatus
};
