const { pgPool } = require('../config/db.config');

/**
 * Insert a new profile into the PostgreSQL profiles table
 * @param {Object} profileData
 * @returns {Promise<Object>} - Created profile record
 */
const createProfile = async ({
  userId,
  fullName,
  bio = null,
  description = null,
  location = null,
  experienceLevel = null,
  yearsOfExperience = null,
  portfolioLinks = null,
  companyName = null,
  industry = null
}) => {
  const query = `
    INSERT INTO profiles (
      user_id,
      full_name,
      bio,
      description,
      location,
      experience_level,
      years_of_experience,
      portfolio_links,
      company_name,
      industry
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  const values = [
    userId,
    fullName,
    bio,
    description,
    location,
    experienceLevel,
    yearsOfExperience,
    portfolioLinks,
    companyName,
    industry
  ];

  const { rows } = await pgPool.query(query, values);
  return rows[0];
};

/**
 * Find profile by user_id
 * @param {string} userId - UUID
 * @returns {Promise<Object|null>} - Profile record or null
 */
const findProfileByUserId = async (userId) => {
  const query = `
    SELECT * FROM profiles
    WHERE user_id = $1;
  `;
  const { rows } = await pgPool.query(query, [userId]);
  return rows[0] || null;
};

/**
 * Dynamic update of profile fields for a user
 * Only updates fields that were explicitly provided (does not overwrite unspecified fields with null)
 * @param {string} userId - UUID
 * @param {Object} fields - key-value pairs to update
 * @returns {Promise<Object|null>} - Updated profile record or null
 */
const updateProfile = async (userId, fields) => {
  const fieldMapping = {
    fullName: 'full_name',
    full_name: 'full_name',
    bio: 'bio',
    description: 'description',
    location: 'location',
    experienceLevel: 'experience_level',
    experience_level: 'experience_level',
    yearsOfExperience: 'years_of_experience',
    years_of_experience: 'years_of_experience',
    portfolioLinks: 'portfolio_links',
    portfolio_links: 'portfolio_links',
    companyName: 'company_name',
    company_name: 'company_name',
    industry: 'industry'
  };

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && fieldMapping[key]) {
      const dbColumn = fieldMapping[key];
      // Avoid duplicate clauses if both camelCase and snake_case provided
      if (!setClauses.some((clause) => clause.startsWith(`"${dbColumn}"`))) {
        setClauses.push(`"${dbColumn}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
  }

  // Always update updated_at timestamp
  setClauses.push(`"updated_at" = NOW()`);

  values.push(userId);
  const userIdParam = `$${paramIndex}`;

  const query = `
    UPDATE profiles
    SET ${setClauses.join(', ')}
    WHERE user_id = ${userIdParam}
    RETURNING *;
  `;

  const { rows } = await pgPool.query(query, values);
  return rows[0] || null;
};

module.exports = {
  createProfile,
  findProfileByUserId,
  updateProfile
};
