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
const { triggerJobEmbedding, getRankedCandidates, getRankedJobs } = require('../services/mlService.client');
const { pgPool } = require('../config/db.config');
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

/**
 * Retrieve ranked candidates for a specific job with explainability reasons.
 * (Client-only, owning client only)
 */
const getRankedCandidatesForJob = async (req, res, next) => {
  try {
    // 1. Role verification: client only
    if (req.user.role !== 'client') {
      throw new ApiError(403, 'Access denied. Only clients can view candidate rankings.');
    }

    const { jobId } = req.params;

    // 2. Validate UUID format
    if (!jobId || !UUID_REGEX.test(jobId)) {
      throw new ApiError(404, 'Job not found');
    }

    // 3. Verify job existence and client ownership
    const job = await findJobByIdModel(jobId);
    if (!job || job.client_id !== req.user.id) {
      // Deliberately do not distinguish "not found" from "not yours"
      throw new ApiError(404, 'Job not found');
    }

    // 4. Fetch job's required skills count
    const requiredSkills = await getJobSkills(jobId);
    const totalRequiredSkills = requiredSkills.length;

    // 5. Query ML microservice for ranked candidates
    const mlRanking = await getRankedCandidates(jobId);
    const rawCandidates = mlRanking.ranked_candidates || [];

    // 6. Enrich candidate details from profiles & ratings
    const candidateUserIds = rawCandidates.map((c) => c.freelancer_id);
    let profilesMap = {};

    if (candidateUserIds.length > 0) {
      const enrichmentQuery = `
        SELECT 
          p.user_id,
          p.full_name,
          p.bio,
          p.experience_level,
          p.years_of_experience,
          ROUND(AVG(r.score)::numeric, 1) as rating_average,
          COUNT(r.id)::int as rating_count
        FROM profiles p
        LEFT JOIN ratings r ON r.rated_id = p.user_id
        WHERE p.user_id = ANY($1::uuid[])
        GROUP BY p.user_id, p.full_name, p.bio, p.experience_level, p.years_of_experience;
      `;
      const { rows: enrichmentRows } = await pgPool.query(enrichmentQuery, [candidateUserIds]);
      enrichmentRows.forEach((row) => {
        profilesMap[row.user_id] = row;
      });
    }

    // 7. Generate explainability reasons & fit_score for each candidate
    const enrichedCandidates = rawCandidates.map((c) => {
      const profile = profilesMap[c.freelancer_id] || null;
      const reasons = [];

      // Reason 1: Skill overlap
      if (c.skill_overlap_score >= 0.8) {
        reasons.push(
          `✓ Strong skill overlap (${(c.matched_skills || []).length}/${totalRequiredSkills} required skills matched)`
        );
      } else if (c.skill_overlap_score >= 0.4) {
        reasons.push(
          `~ Partial skill overlap (${(c.matched_skills || []).length}/${totalRequiredSkills} required skills matched)`
        );
      }

      // Reason 2: Semantic score
      if (c.semantic_score >= 0.6) {
        reasons.push('✓ High semantic similarity to job description');
      }

      // Reason 3: Lexical overlap
      if (c.lexical_overlap_score === 1.0) {
        reasons.push('✓ Exact match on all required skill names');
      }

      // Reason 4: Rating average
      if (profile && profile.rating_average !== null && parseFloat(profile.rating_average) >= 4.0 && profile.rating_count >= 1) {
        reasons.push(`✓ ${profile.rating_average}★ average rating (${profile.rating_count} reviews)`);
      }

      // Reason 5: Years of experience
      if (profile && profile.years_of_experience !== null && profile.years_of_experience !== undefined && Number(profile.years_of_experience) >= 3) {
        reasons.push(`✓ ${profile.years_of_experience} years of relevant experience`);
      }

      // Reason 6: Fallback neutral reason if empty
      if (reasons.length === 0) {
        reasons.push('Limited overlap with job requirements');
      }

      const fitScore = Math.round((c.combined_score || 0) * 100);

      return {
        freelancerId: c.freelancer_id,
        fullName: profile ? profile.full_name : null,
        bio: profile ? profile.bio : null,
        experienceLevel: profile ? profile.experience_level : null,
        yearsOfExperience: profile ? profile.years_of_experience : null,
        rating: profile && profile.rating_average !== null ? parseFloat(profile.rating_average) : null,
        ratingCount: profile ? profile.rating_count : 0,
        fitScore,
        scores: {
          combinedScore: c.combined_score,
          semanticScore: c.semantic_score,
          skillOverlapScore: c.skill_overlap_score,
          lexicalOverlapScore: c.lexical_overlap_score,
        },
        matchedSkills: c.matched_skills || [],
        reasons,
      };
    });

    res.status(200).json({
      success: true,
      jobId: job.id,
      jobTitle: job.title,
      totalEvaluated: mlRanking.total_evaluated || rawCandidates.length,
      candidates: enrichedCandidates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve recommended jobs for the authenticated freelancer with explainability reasons.
 * (Freelancer-only, operates on req.user.id)
 */
const getRecommendedJobs = async (req, res, next) => {
  try {
    // 1. Role verification: freelancer only
    if (req.user.role !== 'freelancer') {
      throw new ApiError(403, 'Access denied. Only freelancers can view job recommendations.');
    }

    const freelancerId = req.user.id;

    // 2. Query ML microservice for ranked jobs
    const mlRanking = await getRankedJobs(freelancerId);
    const rawJobs = mlRanking.ranked_jobs || [];

    // 3. Enrich job details with budget, experience_requirement, and client profile (company_name / full_name)
    const jobIds = rawJobs.map((j) => j.job_id);
    let jobDetailsMap = {};

    if (jobIds.length > 0) {
      const enrichmentQuery = `
        SELECT 
          j.id as job_id,
          j.budget,
          j.experience_requirement,
          j.status,
          j.created_at,
          COALESCE(p.company_name, p.full_name, u.email) as client_name,
          p.company_name,
          p.full_name as client_full_name
        FROM jobs j
        JOIN users u ON u.id = j.client_id
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE j.id = ANY($1::uuid[]);
      `;
      const { rows: enrichmentRows } = await pgPool.query(enrichmentQuery, [jobIds]);
      enrichmentRows.forEach((row) => {
        jobDetailsMap[row.job_id] = row;
      });
    }

    // 4. Generate explainability reasons & fit_score for each job
    const enrichedJobs = rawJobs.map((j) => {
      const details = jobDetailsMap[j.job_id] || {};
      const reasons = [];

      // Reason 1: Skill overlap
      if (j.skill_overlap_score >= 0.8) {
        reasons.push("✓ Your skills strongly match this job's requirements");
      } else if (j.skill_overlap_score >= 0.4 && j.skill_overlap_score < 0.8) {
        reasons.push("~ Some of your skills match this job's requirements");
      }

      // Reason 2: Semantic score
      if (j.semantic_score >= 0.6) {
        reasons.push('✓ This job closely matches your profile');
      }

      // Reason 3: Lexical overlap
      if (j.lexical_overlap_score === 1.0) {
        reasons.push('✓ You have all the required skills for this job');
      }

      // Reason 4: Budget
      const budgetNum = details.budget !== null && details.budget !== undefined ? parseFloat(details.budget) : null;
      if (budgetNum !== null && budgetNum >= 2000) {
        reasons.push('✓ Above-average budget for this type of work');
      }

      // Reason 5: Fallback neutral reason if empty
      if (reasons.length === 0) {
        reasons.push('Limited match with your current skills and experience');
      }

      const fitScore = Math.round((j.combined_score || 0) * 100);

      return {
        jobId: j.job_id,
        title: j.title,
        clientName: details.client_name || null,
        companyName: details.company_name || null,
        budget: budgetNum,
        experienceRequirement: details.experience_requirement || null,
        fitScore,
        scores: {
          combinedScore: j.combined_score,
          semanticScore: j.semantic_score,
          skillOverlapScore: j.skill_overlap_score,
          lexicalOverlapScore: j.lexical_overlap_score,
        },
        matchedSkills: j.matched_skills || [],
        reasons,
      };
    });

    res.status(200).json({
      success: true,
      freelancerId,
      totalEvaluated: mlRanking.total_evaluated || rawJobs.length,
      jobs: enrichedJobs,
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
  updateJobStatus,
  getRankedCandidatesForJob,
  getRecommendedJobs,
};
