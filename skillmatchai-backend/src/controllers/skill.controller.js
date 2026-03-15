// src/controllers/skill.controller.js
const { db }             = require('../models/database');
const { analyzeSkillGap } = require('../services/ai.service');
const logger             = require('../utils/logger');

// ── Get Skill Gap Analysis ────────────────────────────────────────────────────
exports.getSkillGap = async (req, res, next) => {
  try {
    const { targetRole } = req.query;
    const user = await db.findOne('users', req.user.id);
    const userSkills = user.skills || [];

    if (userSkills.length === 0) {
      return res.json({
        missingSkills:  [],
        strongSkills:   [],
        courses:        [],
        readinessScore: 0,
        radarData:      [],
        message: 'Upload certificates first to auto-populate your skills, or update your profile.',
      });
    }

    const role    = targetRole || 'Full Stack Developer';
    const gapData = await analyzeSkillGap(userSkills, role);

    // Build radar chart data
    const radarData = [
      ...userSkills.slice(0, 3).map(skill => ({
        skill,
        score: Math.floor(Math.random() * 30) + 65, // 65-95 for existing skills
      })),
      ...(gapData.missingSkills || []).slice(0, 3).map(skill => ({
        skill,
        score: Math.floor(Math.random() * 30) + 10, // 10-40 for missing skills
      })),
    ];

    res.json({ ...gapData, radarData, targetRole: role });
  } catch (err) {
    logger.error('Skill gap error:', err);
    next(err);
  }
};

// ── Get Course Suggestions ────────────────────────────────────────────────────
exports.getCourseSuggestions = async (req, res, next) => {
  try {
    const { skills } = req.query;
    const user = await db.findOne('users', req.user.id);
    const userSkills = skills ? skills.split(',') : (user.skills || []);
    const gapData = await analyzeSkillGap(userSkills, 'any role');
    res.json({ courses: gapData.courses || [] });
  } catch (err) {
    next(err);
  }
};

// ── Update User Skills ────────────────────────────────────────────────────────
exports.updateSkills = async (req, res, next) => {
  try {
    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array of strings' });
    }
    await db.update('users', req.user.id, {
      skills:     skills.map(s => s.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    });
    res.json({ message: 'Skills updated successfully', skills });
  } catch (err) {
    next(err);
  }
};

// ── Get Market Demand ─────────────────────────────────────────────────────────
exports.getMarketDemand = async (req, res, next) => {
  try {
    // Aggregate most-required skills across all active jobs
    const jobs = await db.findMany('jobs', {
      filter: { is_active: { _eq: true } },
      fields: ['required_skills'],
      limit:  500,
    });

    const skillCount = {};
    jobs.forEach(job => {
      (job.required_skills || []).forEach(skill => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    const sorted = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count, demand: Math.min(100, count * 5) }));

    res.json({ topSkills: sorted, totalJobs: jobs.length });
  } catch (err) {
    next(err);
  }
};
