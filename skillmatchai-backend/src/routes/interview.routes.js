// src/routes/interview.routes.js
const router        = require('express').Router();
const { protect }   = require('../middleware/auth.middleware');
const { aiLimiter } = require('../middleware/rateLimit.middleware');
const { interviewValidation } = require('../middleware/validate.middleware');
const interviewCtrl = require('../controllers/interview.controller');

router.use(protect);

router.post('/start',            aiLimiter, interviewValidation, interviewCtrl.startInterview);
router.post('/:id/answer',       aiLimiter,                     interviewCtrl.submitAnswer);
router.get('/:id/results',                                       interviewCtrl.getResults);
router.get('/history',                                           interviewCtrl.getHistory);
router.delete('/:id',                                            interviewCtrl.deleteInterview);

module.exports = router;
