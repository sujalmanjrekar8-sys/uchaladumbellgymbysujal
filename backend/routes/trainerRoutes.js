const express = require('express');
const router = express.Router();

const {
  getMyTrainees,
  getAllMyWorkouts,
  getTraineeWorkouts,
  assignWorkout,
  updateWorkout,
  deleteWorkout,
  toggleWorkoutCompletion,
  getAllMyDiets,
  getTraineeDiet,
  assignOrUpdateDiet,
  deleteDiet,
  markTraineeAttendance,
  updateTraineeAttendance,
  deleteTraineeAttendance,
  getMyTraineesAttendance,
  getMyOwnAttendance,
  getMySalaries
} = require('../controllers/trainerController');

const { protect, trainerOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(trainerOnly);

// Trainees
router.get('/trainees', getMyTrainees);

// Workouts
router.get('/workouts', getAllMyWorkouts);
router.get('/workouts/:memberId', getTraineeWorkouts);
router.post('/workouts', assignWorkout);
router.put('/workouts/:id', updateWorkout);
router.delete('/workouts/:id', deleteWorkout);
router.put('/workouts/:id/complete', toggleWorkoutCompletion);

// Diets
router.get('/diets', getAllMyDiets);
router.get('/diets/:memberId', getTraineeDiet);
router.post('/diets', assignOrUpdateDiet);
router.delete('/diets/:id', deleteDiet);

// Attendance
router.post('/attendance', markTraineeAttendance);
router.get('/attendance/trainees', getMyTraineesAttendance);
router.get('/trainee-attendance', getMyTraineesAttendance);
router.put('/trainee-attendance/:id', updateTraineeAttendance);
router.delete('/trainee-attendance/:id', deleteTraineeAttendance);
router.get('/attendance/my-attendance', getMyOwnAttendance);
router.get('/my-attendance', getMyOwnAttendance);

// Salaries
router.get('/salaries', getMySalaries);
router.get('/my-salaries', getMySalaries);

module.exports = router;