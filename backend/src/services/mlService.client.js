const { ML_SERVICE_URL } = require('../config/env.config');
const ApiError = require('../utils/ApiError');

/**
 * Fire-and-forget trigger for profile embedding generation in the ML service.
 * Never awaits or blocks the caller, and catches all errors internally.
 *
 * @param {string} userId - UUID of the user profile
 * @param {object} profileFields - Profile fields (fullName, bio, description, experienceLevel, yearsOfExperience, skills)
 */
function triggerProfileEmbedding(userId, profileFields) {
  const url = `${ML_SERVICE_URL}/embeddings/profile`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      profileFields: {
        fullName: profileFields.fullName || profileFields.full_name || '',
        bio: profileFields.bio || '',
        description: profileFields.description || '',
        experienceLevel: profileFields.experienceLevel || profileFields.experience_level || '',
        yearsOfExperience: profileFields.yearsOfExperience ?? profileFields.years_of_experience ?? null,
        skills: profileFields.skills || [],
      },
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(
          `[ML Service] Failed to trigger profile embedding for user ${userId}: HTTP ${response.status} - ${errorText}`
        );
      }
    })
    .catch((error) => {
      console.error(
        `[ML Service] Failed to trigger profile embedding for user ${userId}: ${error.message}`
      );
    });
}

/**
 * Fire-and-forget trigger for job embedding generation in the ML service.
 * Never awaits or blocks the caller, and catches all errors internally.
 *
 * @param {string} jobId - UUID of the job
 * @param {object} jobFields - Job fields (title, description, experienceRequirement, skills)
 */
function triggerJobEmbedding(jobId, jobFields) {
  const url = `${ML_SERVICE_URL}/embeddings/job`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobId,
      title: jobFields.title,
      description: jobFields.description || '',
      experienceRequirement: jobFields.experienceRequirement || jobFields.experience_requirement || '',
      skills: jobFields.skills || [],
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(
          `[ML Service] Failed to trigger job embedding for job ${jobId}: HTTP ${response.status} - ${errorText}`
        );
      }
    })
    .catch((error) => {
      console.error(
        `[ML Service] Failed to trigger job embedding for job ${jobId}: ${error.message}`
      );
    });
}

/**
 * Fire-and-forget trigger for skill embedding generation in the ML service.
 * Never awaits or blocks the caller, and catches all errors internally.
 *
 * @param {string} skillId - UUID of the skill
 * @param {string} name - Name of the skill
 */
function triggerSkillEmbedding(skillId, name) {
  const url = `${ML_SERVICE_URL}/embeddings/skill`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      skillId,
      name,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(
          `[ML Service] Failed to trigger skill embedding for skill ${skillId}: HTTP ${response.status} - ${errorText}`
        );
      }
    })
    .catch((error) => {
      console.error(
        `[ML Service] Failed to trigger skill embedding for skill ${skillId}: ${error.message}`
      );
    });
}

/**
 * Synchronous client call to ML service for candidate ranking retrieval.
 * Awaited with an AbortSignal timeout.
 *
 * @param {string} jobId - UUID of the job
 * @returns {Promise<Object>} - Ranking response object
 */
async function getRankedCandidates(jobId) {
  const url = `${ML_SERVICE_URL}/ranking/candidates`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(
        `[ML Service] Error fetching ranked candidates for job ${jobId}: HTTP ${response.status} - ${errorText}`
      );
      if (response.status === 404) {
        throw new ApiError(404, 'Job not found');
      }
      throw new ApiError(503, 'Matching service temporarily unavailable');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(
      `[ML Service] Down, unreachable, or timed out for job ${jobId}: ${error.message}`
    );
    throw new ApiError(503, 'Matching service temporarily unavailable');
  }
}

/**
 * Synchronous client call to ML service for job recommendation retrieval.
 * Awaited with an AbortSignal timeout.
 *
 * @param {string} freelancerId - UUID of the freelancer
 * @returns {Promise<Object>} - Job ranking response object
 */
async function getRankedJobs(freelancerId) {
  const url = `${ML_SERVICE_URL}/ranking/jobs`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ freelancerId }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(
        `[ML Service] Error fetching ranked jobs for freelancer ${freelancerId}: HTTP ${response.status} - ${errorText}`
      );
      if (response.status === 404) {
        throw new ApiError(404, 'Freelancer not found');
      }
      throw new ApiError(503, 'Matching service temporarily unavailable');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(
      `[ML Service] Down, unreachable, or timed out for freelancer ${freelancerId}: ${error.message}`
    );
    throw new ApiError(503, 'Matching service temporarily unavailable');
  }
}

module.exports = {
  triggerProfileEmbedding,
  triggerJobEmbedding,
  triggerSkillEmbedding,
  getRankedCandidates,
  getRankedJobs,
};
