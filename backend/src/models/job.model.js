const { pgPool } = require('../config/db.config');

/**
 * Insert a new job into the jobs table
 * Note: embedding column is left null (Phase 3)
 * @param {Object} jobData - { clientId, title, description, budget, experienceRequirement }
 * @returns {Promise<Object>} - Created job row
 */
const createJob = async ({
  clientId,
  title,
  description = null,
  budget = null,
  experienceRequirement = null
}) => {
  const query = `
    INSERT INTO jobs (
      client_id,
      title,
      description,
      budget,
      experience_requirement
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [clientId, title, description, budget, experienceRequirement];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
};

/**
 * Find job by primary key ID
 * @param {string} id - UUID
 * @returns {Promise<Object|null>} - Job record or null
 */
const findJobById = async (id) => {
  const query = `
    SELECT * FROM jobs
    WHERE id = $1;
  `;
  const { rows } = await pgPool.query(query, [id]);
  return rows[0] || null;
};

/**
 * List open jobs with pagination ordered by created_at DESC
 * @param {Object} options - { limit, offset }
 * @returns {Promise<Array>} - List of open jobs
 */
const listOpenJobs = async ({ limit = 20, offset = 0 } = {}) => {
  const query = `
    SELECT * FROM jobs
    WHERE status = 'open'
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const { rows } = await pgPool.query(query, [limit, offset]);
  return rows;
};

/**
 * Count total number of open jobs for pagination metadata
 * @returns {Promise<number>} - Count of open jobs
 */
const countOpenJobs = async () => {
  const query = `
    SELECT COUNT(*) FROM jobs
    WHERE status = 'open';
  `;
  const { rows } = await pgPool.query(query);
  return parseInt(rows[0].count, 10);
};

/**
 * List all jobs posted by a specific client (regardless of status)
 * @param {string} clientId - UUID
 * @returns {Promise<Array>} - List of jobs
 */
const listJobsByClientId = async (clientId) => {
  const query = `
    SELECT * FROM jobs
    WHERE client_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [clientId]);
  return rows;
};

/**
 * Update status of a job owned by a specific client
 * Ownership is enforced at the query level (client_id check)
 * @param {string} jobId - UUID
 * @param {string} clientId - UUID
 * @param {string} status - 'open' | 'closed' | 'filled'
 * @returns {Promise<Object|null>} - Updated job or null
 */
const updateJobStatus = async (jobId, clientId, status) => {
  const query = `
    UPDATE jobs
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND client_id = $3
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [status, jobId, clientId]);
  return rows[0] || null;
};

/**
 * Link a skill to a job (idempotent no-op on duplicate)
 * @param {string} jobId - UUID
 * @param {string} skillId - UUID
 * @returns {Promise<Object|null>} - Created row or null on conflict
 */
const addJobSkill = async (jobId, skillId) => {
  const query = `
    INSERT INTO job_skills (job_id, skill_id)
    VALUES ($1, $2)
    ON CONFLICT (job_id, skill_id) DO NOTHING
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [jobId, skillId]);
  return rows[0] || null;
};

/**
 * Get all skills linked to a specific job
 * @param {string} jobId - UUID
 * @returns {Promise<Array>} - Array of { id, name, category }
 */
const getJobSkills = async (jobId) => {
  const query = `
    SELECT s.id, s.name, s.category
    FROM job_skills js
    JOIN skills s ON s.id = js.skill_id
    WHERE js.job_id = $1
    ORDER BY s.name ASC;
  `;
  const { rows } = await pgPool.query(query, [jobId]);
  return rows;
};

module.exports = {
  createJob,
  findJobById,
  listOpenJobs,
  countOpenJobs,
  listJobsByClientId,
  updateJobStatus,
  addJobSkill,
  getJobSkills
};
