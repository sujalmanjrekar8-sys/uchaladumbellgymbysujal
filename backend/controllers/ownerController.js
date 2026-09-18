const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const Attendance = require('../models/Attendance');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const Payment = require('../models/Payment');
const Salary = require('../models/Salary');

// Helper: Auto-generate the next Gym ID
const generateNextGymId = async (prefix, role) => {
  const lastUser = await User.findOne({ role })
    .sort({ createdAt: -1 })
    .select('gymId');

  if (!lastUser || !lastUser.gymId || !lastUser.gymId.startsWith(prefix)) {
    return `${prefix}-1001`;
  }

  const parts = lastUser.gymId.split('-');
  const lastNumber = parseInt(parts[1], 10);
  const nextNumber = isNaN(lastNumber) ? 1001 : lastNumber + 1;
  return `${prefix}-${nextNumber}`;
};

// 1. DASHBOARD STATS
const getDashboardStats = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ role: 'member', isActive: true });
    const totalTrainers = await User.countDocuments({ role: 'trainer', isActive: true });
    const totalPlans = await MembershipPlan.countDocuments({ isActive: true });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayAttendanceCount = await Attendance.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
      status: 'Present'
    });

    const payments = await Payment.find();
    const totalRevenue = payments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
    const totalDue = payments.reduce((acc, p) => acc + (p.dueAmount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalMembers,
        totalTrainers,
        totalPlans,
        todayAttendanceCount,
        totalRevenue,
        totalDue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. MEMBERS
const getMembers = async (req, res) => {
  try {
    const members = await User.find({ role: 'member' })
      .select('-password')
      .populate('assignedTrainer', 'name gymId phone specialization')
      .populate('currentPlan', 'planName price durationInMonths')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: members.length, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMember = async (req, res) => {
  try {
    const { name, email, phone, password, assignedTrainer } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const gymId = await generateNextGymId('UDGMEM', 'member');

    const member = await User.create({
      gymId,
      name,
      email: email.toLowerCase(),
      phone,
      password: password || 'member123',
      role: 'member',
      assignedTrainer: assignedTrainer || null
    });

    res.status(201).json({
      success: true,
      message: `Member registered successfully with ID: ${gymId}`,
      member
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateMember = async (req, res) => {
  try {
    const { name, phone, email, gender, assignedTrainer, isActive } = req.body;
    const member = await User.findById(req.params.id);

    if (!member || member.role !== 'member') {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (email) member.email = email.toLowerCase();
    if (gender) member.gender = gender;
    if (assignedTrainer !== undefined) member.assignedTrainer = assignedTrainer || null;
    if (isActive !== undefined) member.isActive = isActive;

    await member.save();
    res.status(200).json({ success: true, message: 'Member details updated.', member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMember = async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member || member.role !== 'member') {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Member deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. TRAINERS
const getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' })
      .select('-password')
      .sort({ createdAt: -1 });

    const trainersWithCount = await Promise.all(
      trainers.map(async (t) => {
        const traineesCount = await User.countDocuments({ assignedTrainer: t._id, role: 'member' });
        return {
          ...t.toObject(),
          traineesCount
        };
      })
    );

    res.status(200).json({ success: true, count: trainersWithCount.length, trainers: trainersWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTrainer = async (req, res) => {
  try {
    const { name, email, phone, password, specialization, monthlySalary } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A trainer with this email already exists.' });
    }

    const gymId = await generateNextGymId('UDGTRA', 'trainer');

    const trainer = await User.create({
      gymId,
      name,
      email: email.toLowerCase(),
      phone,
      password: password || 'trainer123',
      role: 'trainer',
      specialization: specialization || 'Strength & Conditioning',
      monthlySalary: monthlySalary || 0
    });

    res.status(201).json({
      success: true,
      message: `Trainer added successfully with ID: ${gymId}`,
      trainer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTrainer = async (req, res) => {
  try {
    const { name, phone, specialization, monthlySalary, isActive } = req.body;
    const trainer = await User.findById(req.params.id);

    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    if (name) trainer.name = name;
    if (phone) trainer.phone = phone;
    if (specialization) trainer.specialization = specialization;
    if (monthlySalary !== undefined) trainer.monthlySalary = monthlySalary;
    if (isActive !== undefined) trainer.isActive = isActive;

    await trainer.save();
    res.status(200).json({ success: true, message: 'Trainer details updated.', trainer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. PLANS
const getPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ durationInMonths: 1 });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPlan = async (req, res) => {
  try {
    const { planName, durationInMonths, price, description, features } = req.body;
    const plan = await MembershipPlan.create({
      planName,
      durationInMonths,
      price,
      description,
      features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : [])
    });
    res.status(201).json({ success: true, message: 'Plan created successfully.', plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/owner/assign-plan
const assignPlanToMember = async (req, res) => {
  try {
    const { memberId, planId, startDate } = req.body;

    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Membership plan not found.' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(plan.durationInMonths));

    member.currentPlan = plan._id;
    member.planStartDate = start;
    member.planEndDate = end;

    await member.save();

    res.status(200).json({
      success: true,
      message: `Plan '${plan.planName}' assigned to ${member.name}. Valid until ${end.toLocaleDateString()}`,
      member
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. ATTENDANCE
const markAttendance = async (req, res) => {
  try {
    const { userId, userRole, status, date, notes } = req.body;

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    let record = await Attendance.findOne({
      user: userId,
      date: { $gte: attendanceDate, $lt: nextDay }
    });

    if (record) {
      record.status = status || 'Present';
      record.notes = notes || record.notes;
      record.markedBy = req.user._id;
      await record.save();
      return res.status(200).json({ success: true, message: 'Attendance updated.', attendance: record });
    }

    record = await Attendance.create({
      user: userId,
      userRole,
      markedBy: req.user._id,
      date: attendanceDate,
      status: status || 'Present',
      notes: notes || ''
    });

    res.status(201).json({ success: true, message: 'Attendance marked successfully.', attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTrainerAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ userRole: 'trainer' })
      .populate('user', 'name gymId phone specialization')
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMemberAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ userRole: 'member' })
      .populate('user', 'name gymId phone')
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. ASSIGN TRAINER & MAPPINGS
const assignTrainerToMember = async (req, res) => {
  try {
    const { memberId, trainerId } = req.body;
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.assignedTrainer = trainerId || null;
    await member.save();

    res.status(200).json({ success: true, message: 'Trainer assigned successfully.', member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTraineesMapping = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer', isActive: true }).select('name gymId specialization');
    const mapping = [];

    for (let trainer of trainers) {
      const trainees = await User.find({ role: 'member', assignedTrainer: trainer._id, isActive: true })
        .select('name gymId phone email');

      mapping.push({
        trainer,
        traineesCount: trainees.length,
        trainees
      });
    }

    res.status(200).json({ success: true, mapping });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. PAYMENTS
const recordPayment = async (req, res) => {
  try {
    const { memberId, planId, totalAmount, paidAmount, paymentMode, notes } = req.body;

    const invoiceCount = await Payment.countDocuments();
    const invoiceNumber = `INV-UDG-${1001 + invoiceCount}`;
    const dueAmount = Math.max(0, Number(totalAmount) - Number(paidAmount));
    const status = dueAmount === 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');

    const payment = await Payment.create({
      invoiceNumber,
      member: memberId,
      membershipPlan: planId,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMode: paymentMode || 'Cash',
      status,
      notes: notes || ''
    });

    res.status(201).json({ success: true, message: `Payment recorded. Invoice: ${invoiceNumber}`, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('member', 'name gymId phone')
      .populate('membershipPlan', 'planName price durationInMonths')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. SALARY
const createSalarySlip = async (req, res) => {
  try {
    const { trainerId, month, baseSalary, bonuses, deductions, paymentMode, status, notes } = req.body;

    const base = Number(baseSalary) || 0;
    const bonus = Number(bonuses) || 0;
    const deduct = Number(deductions) || 0;
    const netSalary = base + bonus - deduct;

    const salaryCount = await Salary.countDocuments();
    const receiptNumber = `SAL-UDG-${1001 + salaryCount}`;

    const salary = await Salary.create({
      trainer: trainerId,
      month: month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      baseSalary: base,
      bonuses: bonus,
      deductions: deduct,
      netSalary,
      paymentMode: paymentMode || 'Bank Transfer',
      status: status || 'Paid',
      receiptNumber,
      notes: notes || ''
    });

    res.status(201).json({ success: true, message: `Salary voucher generated: ${receiptNumber}`, salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find()
      .populate('trainer', 'name gymId phone specialization')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. WORKOUTS & DIETS OVERVIEW
const getAllWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find()
      .populate('member', 'name gymId phone')
      .populate('trainer', 'name gymId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllDiets = async (req, res) => {
  try {
    const diets = await Diet.find()
      .populate('member', 'name gymId phone')
      .populate('trainer', 'name gymId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, diets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// 10. FRONT-DESK PASSWORD RESET
// PUT /api/owner/users/:id/reset-password
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Set the new password and save (User.js pre('save') automatically hashes it)
    targetUser.password = newPassword;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${targetUser.name} (${targetUser.gymId})`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Attendance record removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { planName, durationInMonths, price, description, features } = req.body;
    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      {
        planName,
        durationInMonths,
        price,
        description,
        features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : [])
      },
      { new: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Plan updated successfully', plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTrainer = async (req, res) => {
  try {
    await User.updateMany({ assignedTrainer: req.params.id }, { $unset: { assignedTrainer: 1 } });
    const trainer = await User.findByIdAndDelete(req.params.id);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    res.status(200).json({ success: true, message: 'Trainer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Payment record removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const payDuePayment = async (req, res) => {
  try {
    const { amount, paymentMode } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const additionalPay = Number(amount) || 0;
    payment.paidAmount += additionalPay;
    payment.dueAmount = Math.max(0, payment.totalAmount - payment.paidAmount);
    payment.status = payment.dueAmount === 0 ? 'Paid' : 'Pending';
    if (paymentMode) payment.paymentMode = paymentMode;

    await payment.save();

    res.status(200).json({
      success: true,
      message: `Due payment of ₹${additionalPay} recorded successfully! Remaining due: ₹${payment.dueAmount}`,
      payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};