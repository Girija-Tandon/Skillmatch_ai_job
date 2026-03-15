// src/controllers/job.controller.js
const { db }               = require('../models/database');
const { matchJobsToUser }  = require('../services/matching.service');
const logger               = require('../utils/logger');

// ── Get All Jobs (paginated + filtered) ───────────────────────────────────────
exports.getAllJobs = async (req, res, next) => {
  try {
    const {
      search, location, is_remote,
      page  = 1,
      limit = 10,
    } = req.query;

    const filter = { is_active: { _eq: true } };
    if (location)  filter.location  = { _icontains: location };
    if (is_remote) filter.is_remote = { _eq: is_remote === 'true' };

    const jobs = await db.findMany('jobs', {
      filter,
      limit:  parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      sort:   ['-created_at'],
      fields: ['*'],
    });

    // Client-side search filter
    const filtered = search
      ? jobs.filter(j =>
          j.title?.toLowerCase().includes(search.toLowerCase()) ||
          j.description?.toLowerCase().includes(search.toLowerCase())
        )
      : jobs;

    res.json({ jobs: filtered, page: parseInt(page), total: filtered.length });
  } catch (err) {
    next(err);
  }
};

// ── Get AI-Recommended Jobs (TF-IDF + Cosine Similarity) ──────────────────────
exports.getRecommendedJobs = async (req, res, next) => {
  try {
    const user  = await db.findOne('users', req.user.id);
    const skills = user.skills || [];

    if (skills.length === 0) {
      return res.json({
        jobs: [],
        message: 'Add skills to your profile or upload certificates to get job recommendations.',
      });
    }

    const allJobs = await db.findMany('jobs', {
      filter: { is_active: { _eq: true } },
      limit: 100,
    });

    const matched = matchJobsToUser(skills, allJobs);

    res.json({ jobs: matched.slice(0, 15), totalMatched: matched.length });
  } catch (err) {
    next(err);
  }
};

// ── Get Single Job ────────────────────────────────────────────────────────────
exports.getJob = async (req, res, next) => {
  try {
    const job = await db.findOne('jobs', req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    next(err);
  }
};

// ── Create Job (Recruiter) ────────────────────────────────────────────────────
exports.createJob = async (req, res, next) => {
  try {
    const {
      title, description, required_skills,
      location, salary_min, salary_max, is_remote,
    } = req.body;

    const job = await db.create('jobs', {
      title, description, required_skills,
      location:   location || 'Not specified',
      salary_min: parseInt(salary_min) || 0,
      salary_max: parseInt(salary_max) || 0,
      is_remote:  Boolean(is_remote),
      recruiter_id: req.user.id,
      is_active:  true,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ job, message: 'Job posted successfully!' });
  } catch (err) {
    next(err);
  }
};

// ── Update Job ────────────────────────────────────────────────────────────────
exports.updateJob = async (req, res, next) => {
  try {
    const job = await db.findOne('jobs', req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.recruiter_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own job listings' });
    }
    const updated = await db.update('jobs', req.params.id, {
      ...req.body,
      updated_at: new Date().toISOString(),
    });
    res.json({ job: updated });
  } catch (err) {
    next(err);
  }
};

// ── Delete Job ────────────────────────────────────────────────────────────────
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await db.findOne('jobs', req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.recruiter_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own job listings' });
    }
    // Soft delete
    await db.update('jobs', req.params.id, { is_active: false });
    res.json({ message: 'Job removed successfully' });
  } catch (err) {
    next(err);
  }
};

// ── Apply to Job ──────────────────────────────────────────────────────────────
exports.applyToJob = async (req, res, next) => {
  try {
    const job = await db.findOne('jobs', req.params.id);
    if (!job || !job.is_active) {
      return res.status(404).json({ error: 'Job not found or no longer active' });
    }

    // Prevent duplicate applications
    const existing = await db.findOneWhere('applications', {
      user_id: { _eq: req.user.id },
      job_id:  { _eq: req.params.id },
    });
    if (existing) {
      return res.status(409).json({ error: 'You have already applied to this job' });
    }

    const application = await db.create('applications', {
      user_id:    req.user.id,
      job_id:     req.params.id,
      status:     'pending',
      applied_at: new Date().toISOString(),
    });

    res.status(201).json({ application, message: 'Application submitted successfully!' });
  } catch (err) {
    next(err);
  }
};

// ── Get Job Applicants (Recruiter) ────────────────────────────────────────────
exports.getApplicants = async (req, res, next) => {
  try {
    const job = await db.findOne('jobs', req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.recruiter_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const applications = await db.findMany('applications', {
      filter: { job_id: { _eq: req.params.id } },
      sort: ['-applied_at'],
    });

    res.json({ applications, total: applications.length });
  } catch (err) {
    next(err);
  }
};
