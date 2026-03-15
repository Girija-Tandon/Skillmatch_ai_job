// src/controllers/interview.controller.js
const { db }  = require('../models/database');
const { generateInterviewQuestions, evaluateInterviewAnswer } = require('../services/ai.service');
const logger  = require('../utils/logger');

// Safe parse — handles both strings AND already-parsed arrays
const safe = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  return fallback;
};

// ── Start Interview ───────────────────────────────────────────────────────────
exports.startInterview = async (req, res, next) => {
  try {
    const { targetRole } = req.body;
    const user     = db.findOne('users', req.user.id);
    const skills   = safe(user.skills, []);

    logger.info(`Starting interview for user ${req.user.id}, role: ${targetRole}`);

    const { questions } = await generateInterviewQuestions(skills, targetRole);

    // Pass arrays directly — db.create will serialize them
    const interview = db.create('interviews', {
      user_id:     req.user.id,
      target_role: targetRole,
      questions,           // array — db serializes it
      answers:     [],
      scores:      [],
      status:      'in_progress',
      started_at:  new Date().toISOString(),
    });

    const safeQuestions = questions.map(q => ({
      id: q.id, question: q.question, difficulty: q.difficulty, topic: q.topic,
    }));

    res.status(201).json({
      interviewId: interview.id, questions: safeQuestions,
      totalQuestions: questions.length, targetRole,
    });
  } catch (err) {
    logger.error('Start interview error:', err.message);
    next(err);
  }
};

// ── Submit Answer ─────────────────────────────────────────────────────────────
exports.submitAnswer = async (req, res, next) => {
  try {
    const { questionId, answerText } = req.body;
    if (!questionId || !answerText?.trim()) {
      return res.status(400).json({ error: 'questionId and answerText are required' });
    }

    const interview = db.findOne('interviews', req.params.id);
    if (!interview || interview.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Interview session not found' });
    }
    if (interview.status === 'completed') {
      return res.status(400).json({ error: 'Interview already completed' });
    }

    const questions = safe(interview.questions);
    const question  = questions.find(q => q.id === questionId);
    if (!question) return res.status(404).json({ error: `Question ${questionId} not found` });

    const evaluation = await evaluateInterviewAnswer(
      question.question, question.expectedKeyPoints || [], answerText
    );

    const answers = safe(interview.answers);
    const scores  = safe(interview.scores);

    const idx = answers.findIndex(a => a.questionId === questionId);
    if (idx >= 0) { answers[idx] = { questionId, answerText, evaluation }; scores[idx] = evaluation.score; }
    else          { answers.push({ questionId, answerText, evaluation });  scores.push(evaluation.score); }

    const avgScore    = scores.reduce((a, b) => a + b, 0) / scores.length;
    const allAnswered = answers.length >= questions.length;

    db.update('interviews', interview.id, {
      answers, scores,    // pass arrays directly
      average_score: Math.round(avgScore * 10) / 10,
      status:        allAnswered ? 'completed' : 'in_progress',
      completed_at:  allAnswered ? new Date().toISOString() : null,
    });

    res.json({ evaluation, averageScore: Math.round(avgScore * 10) / 10,
      questionsLeft: questions.length - answers.length, completed: allAnswered });
  } catch (err) {
    logger.error('Submit answer error:', err.message);
    next(err);
  }
};

// ── Get Results ───────────────────────────────────────────────────────────────
exports.getResults = async (req, res, next) => {
  try {
    const interview = db.findOne('interviews', req.params.id);
    if (!interview || interview.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const questions = safe(interview.questions);
    const answers   = safe(interview.answers);
    const scores    = safe(interview.scores);

    const results = answers.map(a => {
      const q = questions.find(q => q.id === a.questionId);
      return { question: q?.question, difficulty: q?.difficulty,
               topic: q?.topic, answer: a.answerText, evaluation: a.evaluation };
    });

    res.json({
      interviewId: interview.id, targetRole: interview.target_role,
      averageScore: interview.average_score, status: interview.status,
      startedAt: interview.started_at, completedAt: interview.completed_at,
      totalQuestions: questions.length,
      questionResults: scores.map((s, i) => ({ score: s, question: questions[i]?.question })),
      results,
      scoreBreakdown: scores.length
        ? { min: Math.min(...scores), max: Math.max(...scores), avg: interview.average_score }
        : { min: 0, max: 0, avg: 0 },
    });
  } catch (err) { next(err); }
};

// ── Get History ───────────────────────────────────────────────────────────────
exports.getHistory = async (req, res, next) => {
  try {
    const interviews = db.findMany('interviews', {
      filter: { user_id: { _eq: req.user.id } }, sort: ['-started_at'],
    });
    res.json({ interviews, total: interviews.length });
  } catch (err) { next(err); }
};

// ── Delete Interview ──────────────────────────────────────────────────────────
exports.deleteInterview = async (req, res, next) => {
  try {
    const interview = db.findOne('interviews', req.params.id);
    if (!interview || interview.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    db.remove('interviews', req.params.id);
    res.json({ message: 'Interview deleted' });
  } catch (err) { next(err); }
};
