const { pgPool } = require('../config/db.config');

/**
 * Insert a skill into the catalog or update category if it already exists
 * @param {Object} skillData - { name, category }
 * @returns {Promise<Object>} - Skill record
 */
const createSkill = async ({ name, category = null }) => {
  const query = `
    INSERT INTO skills (name, category)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE
    SET category = COALESCE(EXCLUDED.category, skills.category)
    RETURNING *;
  `;
  const values = [name.trim(), category ? category.trim() : null];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
};

/**
 * List all skills in the catalog
 * @returns {Promise<Array>} - List of skills
 */
const listSkills = async () => {
  const query = `
    SELECT * FROM skills
    ORDER BY category NULLS LAST, name ASC;
  `;
  const { rows } = await pgPool.query(query);
  return rows;
};

/**
 * Find skill by ID
 * @param {string} id - UUID
 * @returns {Promise<Object|null>} - Skill record or null
 */
const findSkillById = async (id) => {
  const query = `
    SELECT * FROM skills
    WHERE id = $1;
  `;
  const { rows } = await pgPool.query(query, [id]);
  return rows[0] || null;
};

/**
 * Find skill by name (case-insensitive)
 * @param {string} name
 * @returns {Promise<Object|null>} - Skill record or null
 */
const findSkillByName = async (name) => {
  const query = `
    SELECT * FROM skills
    WHERE LOWER(name) = LOWER($1);
  `;
  const { rows } = await pgPool.query(query, [name.trim()]);
  return rows[0] || null;
};

/**
 * Associate a skill with a user and set proficiency
 * Idempotent: updates proficiency if association already exists
 * @param {string} userId - UUID
 * @param {string} skillId - UUID
 * @param {string} proficiency - 'beginner'|'intermediate'|'advanced'|'expert'
 * @returns {Promise<Object>} - user_skills record
 */
const addUserSkill = async (userId, skillId, proficiency = 'intermediate') => {
  const query = `
    INSERT INTO user_skills (user_id, skill_id, proficiency)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, skill_id) DO UPDATE
    SET proficiency = EXCLUDED.proficiency
    RETURNING *;
  `;
  const values = [userId, skillId, proficiency];
  const { rows } = await pgPool.query(query, values);
  return rows[0];
};

/**
 * Remove skill association from a user
 * @param {string} userId - UUID
 * @param {string} skillId - UUID
 * @returns {Promise<Object|null>} - Deleted record or null
 */
const removeUserSkill = async (userId, skillId) => {
  const query = `
    DELETE FROM user_skills
    WHERE user_id = $1 AND skill_id = $2
    RETURNING *;
  `;
  const { rows } = await pgPool.query(query, [userId, skillId]);
  return rows[0] || null;
};

/**
 * Get all skills associated with a specific user
 * @param {string} userId - UUID
 * @returns {Promise<Array>} - List of user skills with name, category, proficiency
 */
const getUserSkills = async (userId) => {
  const query = `
    SELECT s.id, s.name, s.category, us.proficiency
    FROM user_skills us
    JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = $1
    ORDER BY s.name ASC;
  `;
  const { rows } = await pgPool.query(query, [userId]);
  return rows;
};

module.exports = {
  createSkill,
  listSkills,
  findSkillById,
  findSkillByName,
  addUserSkill,
  removeUserSkill,
  getUserSkills
};
