const { pgPool } = require('../config/db.config');

/**
 * Insert a new application into the applications table
 * Relies on UNIQUE(job_id, freelancer_id) constraint in PostgreSQL
 * @param {Object} appData - { jobId, freelancerId, proposal }
 * @returns {Promise<Object>} - Created application row
 */
const createApplication = async ({ jobId, freelancerId, proposal = null }) => {
  const query = `
    INSERT INTO applications (job_id, freelancer_id, proposal)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [jobId, freelancerId, proposal];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
};

/**
 * Find application by primary key ID
 * @param {string} id - UUID
 * @returns {Promise<Object|null>} - Application row or null
 */
const findApplicationById = async (id) => {
  const query = `
    SELECT * FROM applications
    WHERE id = $1;
  `;
  const { rows } = await pgPool.query(query, [id]);
  return rows[0] || null;
};

/**
 * List all applications for a specific job, joining freelancer email
 * @param {string} jobId - UUID
 * @returns {Promise<Array>} - List of applications with freelancer_email
 */
const listApplicationsByJobId = async (jobId) => {
  const query = `
    SELECT a.*, u.email as freelancer_email
    FROM applications a
    JOIN users u ON u.id = a.freelancer_id
    WHERE a.job_id = $1
    ORDER BY a.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [jobId]);
  return rows;
};

/**
 * List all applications submitted by a freelancer, joining job title and status
 * @param {string} freelancerId - UUID
 * @returns {Promise<Array>} - List of applications with job_title and job_status
 */
const listApplicationsByFreelancerId = async (freelancerId) => {
  const query = `
    SELECT a.*, j.title as job_title, j.status as job_status
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.freelancer_id = $1
    ORDER BY a.created_at DESC;
  `;
  const { rows } = await pgPool.query(query, [freelancerId]);
  return rows;
};

/**
 * Update application status by the job's client
 * Enforces ownership at query level: client must own the associated job
 * @param {string} applicationId - UUID
 * @param {string} jobClientId - UUID (client_id of job)
 * @param {string} status - 'shortlisted' | 'accepted' | 'rejected'
 * @returns {Promise<Object|null>} - Updated application or null
 */
const updateApplicationStatus = async (applicationId, jobClientId, status) => {
  const query = `
    UPDATE applications
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND job_id IN (SELECT id FROM jobs WHERE client_id = $3)
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [status, applicationId, jobClientId]);
  return rows[0] || null;
};

/**
 * Withdraw an application by the owning freelancer (only allowed while pending)
 * @param {string} applicationId - UUID
 * @param {string} freelancerId - UUID
 * @returns {Promise<Object|null>} - Updated application or null
 */
const withdrawApplication = async (applicationId, freelancerId) => {
  const query = `
    UPDATE applications
    SET status = 'withdrawn', updated_at = NOW()
    WHERE id = $1 AND freelancer_id = $2 AND status = 'pending'
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [applicationId, freelancerId]);
  return rows[0] || null;
};

module.exports = {
  createApplication,
  findApplicationById,
  listApplicationsByJobId,
  listApplicationsByFreelancerId,
  updateApplicationStatus,
  withdrawApplication
};
