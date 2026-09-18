const User = require('../models/User');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');

// ==========================================
// 1. TODAY'S WORKOUT ROUTINE
// ==========================================
// GET /api/member/today-workout
const getTodayWorkout = async (req, res) => {
  try {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[new Date().getDay()];

    // Find workout specifically for today
    let todayWorkout = await Workout.findOne({
      member: req.user._id,
      day: currentDay
    }).populate('trainer', 'name gymId specialization');

    // Also get all weekly workouts for full schedule view
    const allWorkouts = await Workout.find({
      member: req.user._id
    }).populate('trainer', 'name gymId specialization');

    res.status(200).json({
      success: true,
      currentDay,
      todayWorkout,
      allWorkouts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. ASSIGNED DIET PLAN
// ==========================================
// GET /api/member/diet
const getMyDiet = async (req, res) => {
  try {
    const diet = await Diet.findOne({ member: req.user._id })
      .populate('trainer', 'name gymId specialization');

    res.status(200).json({
      success: true,
      diet
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. MY MEMBERSHIP PLAN & PAYMENT RECEIPTS
// ==========================================
// GET /api/member/my-plan
const getMyPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('currentPlan')
      .populate('assignedTrainer', 'name gymId phone specialization');

    // Get all past fee payment invoices for this member
    const payments = await Payment.find({ member: req.user._id })
      .populate('membershipPlan', 'planName price durationInMonths')
      .sort({ createdAt: -1 });

    // Calculate days remaining if plan has an end date
    let daysRemaining = null;
    if (user.planEndDate) {
      const now = new Date();
      const end = new Date(user.planEndDate);
      const diffTime = end - now;
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    res.status(200).json({
      success: true,
      user: {
        gymId: user.gymId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        currentPlan: user.currentPlan,
        planStartDate: user.planStartDate,
        planEndDate: user.planEndDate,
        daysRemaining,
        assignedTrainer: user.assignedTrainer
      },
      payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. MY ATTENDANCE HISTORY
// ==========================================
// GET /api/member/attendance
const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      user: req.user._id,
      userRole: 'member'
    })
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    // Total days present count
    const totalPresent = attendance.filter(a => a.status === 'Present').length;

    res.status(200).json({
      success: true,
      totalPresent,
      attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('currentPlan')
      .populate('assignedTrainer', 'name gymId phone specialization');

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWorkoutsList = async (req, res) => {
  try {
    const workouts = await Workout.find({
      member: req.user._id
    }).populate('trainer', 'name gymId specialization').sort({ createdAt: -1 });

    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentsList = async (req, res) => {
  try {
    const payments = await Payment.find({ member: req.user._id })
      .populate('membershipPlan', 'planName price durationInMonths')
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTodayWorkout,
  getWorkoutsList,
  getMyDiet,
  getMyPlan,
  getProfile,
  getPaymentsList,
  getMyAttendance
};