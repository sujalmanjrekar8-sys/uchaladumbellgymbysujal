const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  assignPlanToMember,
  markAttendance,
  getTrainerAttendance,
  getMemberAttendance,
  deleteAttendance,
  assignTrainerToMember,
  getTraineesMapping,
  recordPayment,
  getPayments,
  payDuePayment,
  deletePayment,
  createSalarySlip,
  getSalaries,
  getAllWorkouts,
  getAllDiets,
  resetUserPassword
} = require('../controllers/ownerController');

const { protect, ownerOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(ownerOnly);

// Stats
router.get('/stats', getDashboardStats);

// Members
router.get('/members', getMembers);
router.post('/members', createMember);
router.put('/members/:id', updateMember);
router.delete('/members/:id', deleteMember);

// Trainers
router.get('/trainers', getTrainers);
router.post('/trainers', createTrainer);
router.put('/trainers/:id', updateTrainer);
router.delete('/trainers/:id', deleteTrainer);

// Plans
router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);
router.post('/assign-plan', assignPlanToMember);

// Attendance
router.post('/attendance', markAttendance);
router.get('/attendance/trainers', getTrainerAttendance);
router.get('/attendance/members', getMemberAttendance);
router.delete('/attendance/:id', deleteAttendance);

// Mappings
router.post('/assign-trainer', assignTrainerToMember);
router.get('/trainees-mapping', getTraineesMapping);

// Payments & Invoices
router.get('/payments', getPayments);
router.post('/payments', recordPayment);
router.put('/payments/:id/pay-due', payDuePayment);
router.delete('/payments/:id', deletePayment);

// Salaries
router.get('/salaries', getSalaries);
router.post('/salaries', createSalarySlip);

// Workouts & Diets Overview
router.get('/workouts', getAllWorkouts);
router.get('/diets', getAllDiets);

// Admin Password Reset
router.put('/users/:id/reset-password', resetUserPassword);

module.exports = router;