const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const Salary = require('../models/Salary');

// 1. MY ASSIGNED TRAINEES
const getMyTrainees = async (req, res) => {
  try {
    const trainees = await User.find({
      role: 'member',
      assignedTrainer: req.user._id,
      isActive: true
    }).select('-password');

    res.status(200).json({
      success: true,
      count: trainees.length,
      trainees
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. WORKOUTS
const getAllMyWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({
      trainer: req.user._id
    }).populate('member', 'name gymId phone').sort({ createdAt: -1 });

    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTraineeWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({
      member: req.params.memberId,
      trainer: req.user._id
    }).populate('member', 'name gymId phone').sort({ createdAt: -1 });

    res.status(200).json({ success: true, workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignWorkout = async (req, res) => {
  try {
    const { memberId, day, workoutTitle, exercises, notes } = req.body;

    const member = await User.findOne({
      _id: memberId,
      assignedTrainer: req.user._id
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You can only assign workouts to your assigned trainees.'
      });
    }

    const workout = await Workout.create({
      member: memberId,
      trainer: req.user._id,
      day,
      workoutTitle,
      exercises: exercises || [],
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: `Workout routine '${workoutTitle}' assigned for ${day}.`,
      workout
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleWorkoutCompletion = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found.' });
    }

    workout.isCompleted = !workout.isCompleted;
    workout.completedAt = workout.isCompleted ? new Date() : null;

    await workout.save();

    res.status(200).json({
      success: true,
      message: `Workout marked as ${workout.isCompleted ? 'COMPLETED (DONE) ✅' : 'PENDING ⏳'}`,
      workout
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. DIET PLANS
const getAllMyDiets = async (req, res) => {
  try {
    const diets = await Diet.find({
      trainer: req.user._id
    }).populate('member', 'name gymId phone').sort({ createdAt: -1 });

    res.status(200).json(diets);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTraineeDiet = async (req, res) => {
  try {
    const diet = await Diet.findOne({
      member: req.params.memberId
    }).populate('member', 'name gymId phone');

    res.status(200).json({ success: true, diet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignOrUpdateDiet = async (req, res) => {
  try {
    const { memberId, dietType, dailyGoal, goal, meals, breakfast, lunch, preWorkout, dinner, notes } = req.body;

    const formattedGoal = dailyGoal || goal || 'General Fitness & Muscle Building';
    
    let formattedMeals = meals;
    if (!formattedMeals || !Array.isArray(formattedMeals) || formattedMeals.length === 0) {
      formattedMeals = [];
      if (breakfast) formattedMeals.push({ mealTime: 'Breakfast', items: breakfast, calories: 500, proteinGrams: 30 });
      if (lunch) formattedMeals.push({ mealTime: 'Lunch', items: lunch, calories: 700, proteinGrams: 40 });
      if (preWorkout) formattedMeals.push({ mealTime: 'Pre-Workout', items: preWorkout, calories: 300, proteinGrams: 15 });
      if (dinner) formattedMeals.push({ mealTime: 'Dinner', items: dinner, calories: 600, proteinGrams: 35 });
    }

    let diet = await Diet.findOne({ member: memberId });

    if (diet) {
      diet.dietType = dietType || diet.dietType;
      diet.dailyGoal = formattedGoal;
      diet.meals = formattedMeals;
      diet.notes = notes || diet.notes;
      diet.trainer = req.user._id;
      await diet.save();
      return res.status(200).json({ success: true, message: 'Diet plan updated successfully.', diet });
    }

    diet = await Diet.create({
      member: memberId,
      trainer: req.user._id,
      dietType: dietType || 'Non-Vegetarian',
      dailyGoal: formattedGoal,
      meals: formattedMeals,
      notes: notes || ''
    });

    res.status(201).json({ success: true, message: 'Diet plan created successfully.', diet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. ATTENDANCE
const markTraineeAttendance = async (req, res) => {
  try {
    const { memberId, status, date, notes } = req.body;

    const member = await User.findOne({
      _id: memberId,
      assignedTrainer: req.user._id
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark attendance for your assigned trainees.'
      });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    let record = await Attendance.findOne({
      user: memberId,
      date: { $gte: attendanceDate, $lt: nextDay }
    });

    if (record) {
      record.status = status || 'Present';
      record.notes = notes || record.notes;
      record.markedBy = req.user._id;
      await record.save();
      return res.status(200).json({ success: true, message: 'Trainee attendance updated.', attendance: record });
    }

    record = await Attendance.create({
      user: memberId,
      userRole: 'member',
      markedBy: req.user._id,
      date: attendanceDate,
      status: status || 'Present',
      notes: notes || ''
    });

    res.status(201).json({ success: true, message: 'Trainee attendance marked.', attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyTraineesAttendance = async (req, res) => {
  try {
    const trainees = await User.find({ assignedTrainer: req.user._id }).select('_id');
    const traineeIds = trainees.map(t => t._id);

    const attendance = await Attendance.find({ user: { $in: traineeIds } })
      .populate('user', 'name gymId phone')
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOwnAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      user: req.user._id,
      userRole: 'trainer'
    })
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. SALARIES
const getMySalaries = async (req, res) => {
  try {
    const salaries = await Salary.find({ trainer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateWorkout = async (req, res) => {
  try {
    const { day, workoutTitle, exercises, notes } = req.body;
    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      { day, workoutTitle, exercises, notes },
      { new: true }
    );
    if (!workout) return res.status(404).json({ success: false, message: 'Workout not found.' });
    res.status(200).json({ success: true, message: 'Workout routine updated.', workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteWorkout = async (req, res) => {
  try {
    await Workout.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Workout routine deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDiet = async (req, res) => {
  try {
    await Diet.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Diet plan deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
  getMyTraineesAttendance,
  getMyOwnAttendance,
  getMySalaries
};