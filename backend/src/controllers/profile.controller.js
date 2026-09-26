const {
  createProfile,
  findProfileByUserId,
  updateProfile
} = require('../models/profile.model');
const { getUserSkills } = require('../models/skill.model');
const { triggerProfileEmbedding } = require('../services/mlService.client');
const ApiError = require('../utils/ApiError');

const VALID_EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Create or update the authenticated user's profile (idempotent)
 * Supports both freelancer and client profiles based on req.user.role
 */
const createOrUpdateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const {
      fullName,
      full_name,
      bio,
      description,
      location,
      experienceLevel,
      experience_level,
      yearsOfExperience,
      years_of_experience,
      portfolioLinks,
      portfolio_links,
      companyName,
      company_name,
      industry
    } = req.body;

    const resolvedFullName = fullName !== undefined ? fullName : full_name;
    const resolvedExperienceLevel = experienceLevel !== undefined ? experienceLevel : experience_level;
    const resolvedYearsOfExperience = yearsOfExperience !== undefined ? yearsOfExperience : years_of_experience;
    const resolvedPortfolioLinks = portfolioLinks !== undefined ? portfolioLinks : portfolio_links;
    const resolvedCompanyName = companyName !== undefined ? companyName : company_name;

    // Check existing profile
    const existingProfile = await findProfileByUserId(userId);

    // Role-aware validation on initial creation
    if (!existingProfile) {
      if (userRole === 'client') {
        if (!resolvedCompanyName || typeof resolvedCompanyName !== 'string' || !resolvedCompanyName.trim()) {
          throw new ApiError(400, 'Company name is required for client profiles');
        }
      } else {
        // Default or freelancer role
        if (!resolvedFullName || typeof resolvedFullName !== 'string' || !resolvedFullName.trim()) {
          throw new ApiError(400, 'Full name is required for freelancer profiles');
        }
      }
    } else {
      // If updating, validate non-empty string if provided
      if (resolvedFullName !== undefined && (typeof resolvedFullName !== 'string' || !resolvedFullName.trim())) {
        throw new ApiError(400, 'Full name must be a non-empty string');
      }
      if (resolvedCompanyName !== undefined && (typeof resolvedCompanyName !== 'string' || !resolvedCompanyName.trim())) {
        throw new ApiError(400, 'Company name must be a non-empty string');
      }
    }

    if (industry !== undefined && industry !== null) {
      if (typeof industry !== 'string' || !industry.trim()) {
        throw new ApiError(400, 'Industry must be a non-empty string');
      }
    }

    if (resolvedExperienceLevel !== undefined && resolvedExperienceLevel !== null) {
      if (!VALID_EXPERIENCE_LEVELS.includes(resolvedExperienceLevel)) {
        throw new ApiError(
          400,
          `Invalid experience level. Must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}`
        );
      }
    }

    if (resolvedYearsOfExperience !== undefined && resolvedYearsOfExperience !== null) {
      if (
        typeof resolvedYearsOfExperience !== 'number' ||
        !Number.isInteger(resolvedYearsOfExperience) ||
        resolvedYearsOfExperience < 0
      ) {
        throw new ApiError(400, 'Years of experience must be a non-negative integer');
      }
    }

    if (resolvedPortfolioLinks !== undefined && resolvedPortfolioLinks !== null) {
      if (!Array.isArray(resolvedPortfolioLinks)) {
        throw new ApiError(400, 'Portfolio links must be an array of URLs');
      }
    }

    if (!existingProfile) {
      // Create new profile
      const newProfile = await createProfile({
        userId,
        fullName: resolvedFullName ? resolvedFullName.trim() : null,
        bio: bio !== undefined ? bio : null,
        description: description !== undefined ? description : null,
        location: location !== undefined ? location : null,
        experienceLevel: resolvedExperienceLevel !== undefined ? resolvedExperienceLevel : null,
        yearsOfExperience: resolvedYearsOfExperience !== undefined ? resolvedYearsOfExperience : null,
        portfolioLinks: resolvedPortfolioLinks !== undefined ? resolvedPortfolioLinks : null,
        companyName: resolvedCompanyName ? resolvedCompanyName.trim() : null,
        industry: industry ? industry.trim() : null
      });

      const userSkills = await getUserSkills(userId);

      triggerProfileEmbedding(userId, {
        fullName: newProfile.full_name,
        bio: newProfile.bio,
        description: newProfile.description,
        experienceLevel: newProfile.experience_level,
        yearsOfExperience: newProfile.years_of_experience,
        skills: userSkills
      });

      return res.status(201).json({
        success: true,
        profile: newProfile
      });
    }

    // Update existing profile (preserves unprovided fields)
    const updateData = {};
    if (resolvedFullName !== undefined) updateData.full_name = resolvedFullName.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (resolvedExperienceLevel !== undefined) updateData.experience_level = resolvedExperienceLevel;
    if (resolvedYearsOfExperience !== undefined) updateData.years_of_experience = resolvedYearsOfExperience;
    if (resolvedPortfolioLinks !== undefined) updateData.portfolio_links = resolvedPortfolioLinks;
    if (resolvedCompanyName !== undefined) updateData.company_name = resolvedCompanyName.trim();
    if (industry !== undefined) updateData.industry = industry ? industry.trim() : null;

    const updated = await updateProfile(userId, updateData);

    const userSkills = await getUserSkills(userId);

    triggerProfileEmbedding(userId, {
      fullName: updated.full_name,
      bio: updated.bio,
      description: updated.description,
      experienceLevel: updated.experience_level,
      yearsOfExperience: updated.years_of_experience,
      skills: userSkills
    });

    return res.status(200).json({
      success: true,
      profile: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user's profile
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await findProfileByUserId(req.user.id);
    if (!profile) {
      throw new ApiError(404, 'Profile not yet created');
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get any user's profile by userId param
 */
const getProfileByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !UUID_REGEX.test(userId)) {
      throw new ApiError(404, 'Profile not found');
    }

    const profile = await findProfileByUserId(userId);
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrUpdateProfile,
  getMyProfile,
  getProfileByUserId
};
