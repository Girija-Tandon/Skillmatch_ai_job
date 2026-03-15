// src/routes/skill.routes.js
const router      = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { aiLimiter } = require('../middleware/rateLimit.middleware');
const skillCtrl   = require('../controllers/skill.controller');

router.use(protect);

router.get('/gap',              aiLimiter, skillCtrl.getSkillGap);
router.get('/courses',          aiLimiter, skillCtrl.getCourseSuggestions);
router.post('/update',                     skillCtrl.updateSkills);
router.get('/market-demand',               skillCtrl.getMarketDemand);

module.exports = router;
