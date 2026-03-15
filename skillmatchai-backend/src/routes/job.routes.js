// src/routes/job.routes.js
const router         = require('express').Router();
const { protect }    = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const { jobValidation } = require('../middleware/validate.middleware');
const jobCtrl        = require('../controllers/job.controller');

router.use(protect);

router.get('/',              jobCtrl.getAllJobs);
router.get('/recommended',   jobCtrl.getRecommendedJobs);   // AI match
router.get('/:id',           jobCtrl.getJob);
router.post('/:id/apply',    restrictTo('jobseeker', 'pwd_candidate'), jobCtrl.applyToJob);
router.get('/:id/applicants', restrictTo('recruiter', 'admin'),        jobCtrl.getApplicants);

router.post('/',    restrictTo('recruiter', 'admin'), jobValidation, jobCtrl.createJob);
router.patch('/:id', restrictTo('recruiter', 'admin'),               jobCtrl.updateJob);
router.delete('/:id', restrictTo('recruiter', 'admin'),              jobCtrl.deleteJob);

module.exports = router;
