const express = require('express');
const router = express.Router();

const {
  getTodayWorkout,
  getWorkoutsList,
  getMyDiet,
  getMyPlan,
  getProfile,
  getPaymentsList,
  getMyAttendance
} = require('../controllers/memberController');

const { protect, memberOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(memberOnly);

router.get('/today-workout', getTodayWorkout);
router.get('/workouts', getWorkoutsList);
router.get('/diet', getMyDiet);
router.get('/my-plan', getMyPlan);
router.get('/profile', getProfile);
router.get('/payments', getPaymentsList);
router.get('/attendance', getMyAttendance);
router.get('/my-attendance', getMyAttendance);

module.exports = router;