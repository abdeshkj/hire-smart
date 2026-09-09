const {
  createSkill: createSkillModel,
  listSkills: listSkillsModel,
  findSkillById,
  findSkillByName,
  addUserSkill,
  removeUserSkill,
  getUserSkills
} = require('../models/skill.model');
const ApiError = require('../utils/ApiError');

const VALID_PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Add a skill to the global catalog
 */
const createSkill = async (req, res, next) => {
  try {
    const { name, category } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ApiError(400, 'Skill name is required');
    }

    if (category !== undefined && category !== null && typeof category !== 'string') {
      throw new ApiError(400, 'Skill category must be a string');
    }

    const skill = await createSkillModel({
      name: name.trim(),
      category: category ? category.trim() : null
    });

    res.status(201).json({
      success: true,
      skill
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all skills in the global catalog
 */
const listSkills = async (req, res, next) => {
  try {
    const skills = await listSkillsModel();
    res.status(200).json({
      success: true,
      count: skills.length,
      skills
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or update a skill on the authenticated user's profile
 */
const addMySkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skillId, skill_id, skillName, skill_name, proficiency = 'intermediate' } = req.body;

    const resolvedSkillId = skillId !== undefined ? skillId : skill_id;
    const resolvedSkillName = skillName !== undefined ? skillName : skill_name;

    // Validate proficiency
    if (!VALID_PROFICIENCY_LEVELS.includes(proficiency)) {
      throw new ApiError(
        400,
        `Invalid proficiency level. Must be one of: ${VALID_PROFICIENCY_LEVELS.join(', ')}`
      );
    }

    let targetSkill = null;

    if (resolvedSkillId) {
      if (!UUID_REGEX.test(resolvedSkillId)) {
        throw new ApiError(400, 'Invalid skillId format');
      }
      targetSkill = await findSkillById(resolvedSkillId);
      if (!targetSkill) {
        throw new ApiError(404, 'Skill not found');
      }
    } else if (resolvedSkillName && typeof resolvedSkillName === 'string' && resolvedSkillName.trim()) {
      targetSkill = await findSkillByName(resolvedSkillName.trim());
      if (!targetSkill) {
        targetSkill = await createSkillModel({ name: resolvedSkillName.trim() });
      }
    } else {
      throw new ApiError(400, 'Either skillId or skillName is required');
    }

    const userSkill = await addUserSkill(userId, targetSkill.id, proficiency);

    res.status(200).json({
      success: true,
      skill: {
        id: targetSkill.id,
        name: targetSkill.name,
        category: targetSkill.category,
        proficiency: userSkill.proficiency
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a skill from the authenticated user's profile
 */
const removeMySkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skillId } = req.params;

    if (!skillId || !UUID_REGEX.test(skillId)) {
      throw new ApiError(404, 'Skill not found');
    }

    await removeUserSkill(userId, skillId);

    res.status(200).json({
      success: true,
      message: 'Skill removed from profile successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all skills associated with the authenticated user
 */
const getMySkills = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const skills = await getUserSkills(userId);

    res.status(200).json({
      success: true,
      count: skills.length,
      skills
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSkill,
  listSkills,
  addMySkill,
  removeMySkill,
  getMySkills
};
