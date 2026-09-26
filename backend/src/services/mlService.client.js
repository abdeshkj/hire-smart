const { ML_SERVICE_URL } = require('../config/env.config');

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

module.exports = {
  triggerProfileEmbedding,
  triggerJobEmbedding,
  triggerSkillEmbedding,
};
