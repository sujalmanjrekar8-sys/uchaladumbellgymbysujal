const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Import all models
const User = require('./models/User');
const MembershipPlan = require('./models/MembershipPlan');
const Attendance = require('./models/Attendance');
const Workout = require('./models/Workout');
const Diet = require('./models/Diet');
const Payment = require('./models/Payment');
const Salary = require('./models/Salary');

const seedData = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uchaladumbellgymbysujal');
    console.log('✅ Connected to MongoDB for seeding...');

    // 2. Clear old test data
    await User.deleteMany();
    await MembershipPlan.deleteMany();
    await Attendance.deleteMany();
    await Workout.deleteMany();
    await Diet.deleteMany();
    await Payment.deleteMany();
    await Salary.deleteMany();
    console.log('🧹 Cleared existing database collections...');

    // 3. Create Default Membership Plans
    const plans = await MembershipPlan.insertMany([
      {
        planName: '1-Month Bronze Strength',
        durationInMonths: 1,
        price: 1500,
        description: 'Ideal for beginners starting their fitness journey.',
        features: ['Full Gym & Dumbbell Floor Access', 'Locker Room Access', 'General Trainer Guidance']
      },
      {
        planName: '3-Month Silver Hypertrophy',
        durationInMonths: 3,
        price: 4000,
        description: 'Most popular for steady body recomposition.',
        features: ['Full Gym Access', 'Cardio & Heavy Iron Zone', 'Steam Bath Access', 'Free Diet Consultation']
      },
      {
        planName: '6-Month Gold Transformation',
        durationInMonths: 6,
        price: 7500,
        description: 'Comprehensive fitness transformation package.',
        features: ['Full Gym Access', 'Personal Locker', 'Bi-weekly Body Composition Check', 'Personal Trainer Discounts']
      },
      {
        planName: '12-Month Platinum VIP',
        durationInMonths: 12,
        price: 13000,
        description: 'Full year all-inclusive access with dedicated perks.',
        features: ['Unlimited 24/7 Access', 'Dedicated Locker', 'Free Gym Merch', 'Custom Weekly Diet & Workout Updates']
      }
    ]);
    console.log('✅ 4 Membership Plans Created');

    // 4. Create Owner Account
    const owner = await User.create({
      gymId: 'UDGOWNER-1001',
      name: 'Sujal (Gym Owner)',
      email: 'owner@uchala.com',
      phone: '9876543210',
      password: 'owner123',
      role: 'owner'
    });
    console.log('👑 Owner Account Created: UDGOWNER-1001 (Password: owner123)');

    // 5. Create 2 Trainers
    const trainer1 = await User.create({
      gymId: 'UDGTRA-1001',
      name: 'Alex Mercer',
      email: 'alex@uchala.com',
      phone: '9876500001',
      password: 'trainer123',
      role: 'trainer',
      specialization: 'Heavy Strength & Powerlifting',
      monthlySalary: 30000
    });

    const trainer2 = await User.create({
      gymId: 'UDGTRA-1002',
      name: 'Sarah Connor',
      email: 'sarah@uchala.com',
      phone: '9876500002',
      password: 'trainer123',
      role: 'trainer',
      specialization: 'HIIT & Fat Loss Transformation',
      monthlySalary: 28000
    });
    console.log('🏋️ 2 Trainers Created: UDGTRA-1001, UDGTRA-1002 (Password: trainer123)');

    // 6. Create 2 Members
    const member1 = await User.create({
      gymId: 'UDGMEM-1001',
      name: 'John Doe',
      email: 'john@gmail.com',
      phone: '9876511111',
      password: 'member123',
      role: 'member',
      assignedTrainer: trainer1._id
    });

    const member2 = await User.create({
      gymId: 'UDGMEM-1002',
      name: 'Emily Davis',
      email: 'emily@gmail.com',
      phone: '9876522222',
      password: 'member123',
      role: 'member',
      assignedTrainer: trainer2._id
    });
    console.log('🏃 2 Members Created: UDGMEM-1001, UDGMEM-1002 (Password: member123)');

    // 7. Create Sample Workouts for John Doe
    await Workout.insertMany([
      {
        member: member1._id,
        trainer: trainer1._id,
        day: 'Monday',
        workoutTitle: 'Chest & Triceps Power',
        exercises: [
          { name: 'Flat Barbell Bench Press', sets: 4, reps: '8-10 reps', weight: '70kg', targetMuscle: 'Chest' },
          { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12 reps', weight: '24kg each', targetMuscle: 'Upper Chest' },
          { name: 'Cable Chest Flyes', sets: 3, reps: '15 reps', weight: '15kg', targetMuscle: 'Inner Chest' },
          { name: 'Triceps Rope Pushdown', sets: 4, reps: '12-15 reps', weight: '25kg', targetMuscle: 'Triceps' }
        ],
        isCompleted: true,
        completedAt: new Date(),
        notes: 'Great form today! Increase bench press weight next week.'
      },
      {
        member: member1._id,
        trainer: trainer1._id,
        day: 'Wednesday',
        workoutTitle: 'Back & Biceps Thickness',
        exercises: [
          { name: 'Conventional Deadlifts', sets: 4, reps: '6-8 reps', weight: '100kg', targetMuscle: 'Lower Back' },
          { name: 'Lat Pulldown', sets: 4, reps: '10-12 reps', weight: '55kg', targetMuscle: 'Lats' },
          { name: 'Dumbbell Bicep Curls', sets: 4, reps: '12 reps', weight: '14kg each', targetMuscle: 'Biceps' }
        ],
        isCompleted: false,
        notes: 'Focus on pulling with your elbows, not hands.'
      }
    ]);
    console.log('💪 Sample Workouts Seeded');

    // 8. Create Sample Diet for John Doe
    await Diet.create({
      member: member1._id,
      trainer: trainer1._id,
      dietType: 'Non-Vegetarian',
      dailyGoal: 'Lean Muscle Hypertrophy (2800 kcal)',
      meals: [
        { mealTime: 'Breakfast', items: '4 Whole Boiled Eggs + 75g Rolled Oats with Milk + 1 Banana', calories: 650, proteinGrams: 35 },
        { mealTime: 'Lunch', items: '200g Grilled Chicken Breast + 150g Brown Rice + Mixed Green Salad', calories: 700, proteinGrams: 55 },
        { mealTime: 'Pre-Workout', items: '2 Whole Wheat Toast + 2 tbsp Peanut Butter + Black Coffee', calories: 350, proteinGrams: 12 },
        { mealTime: 'Dinner', items: '150g Fish / Paneer + 2 Roti + Steamed Broccoli', calories: 600, proteinGrams: 40 }
      ],
      notes: 'Maintain 3.5 liters daily water intake. Consume pre-workout 45 mins before training.'
    });
    console.log('🥗 Sample Diet Seeded');

    // 9. Create Sample Payment Record for John Doe
    await Payment.create({
      invoiceNumber: 'INV-UDG-1001',
      member: member1._id,
      membershipPlan: plans[2]._id, // 6-Month Gold Plan
      totalAmount: 7500,
      paidAmount: 7500,
      dueAmount: 0,
      paymentMode: 'UPI / GPay / PhonePe',
      status: 'Paid',
      notes: 'Paid via GPay at front desk'
    });
    console.log('💳 Sample Payment Invoice Seeded');

    // 10. Create Sample Trainer Salary Slip for Alex
    await Salary.create({
      trainer: trainer1._id,
      month: 'August 2026',
      baseSalary: 30000,
      bonuses: 3500,
      deductions: 0,
      netSalary: 33500,
      paymentMode: 'Bank Transfer',
      status: 'Paid',
      receiptNumber: 'SAL-UDG-1001',
      notes: 'Includes performance bonus for August'
    });
    console.log('💵 Sample Salary Slip Seeded');

    // 11. Create Sample Attendance Logs
    await Attendance.insertMany([
      { user: member1._id, userRole: 'member', markedBy: trainer1._id, status: 'Present', notes: 'Morning session' },
      { user: trainer1._id, userRole: 'trainer', markedBy: owner._id, status: 'Present', notes: 'On time' }
    ]);
    console.log('📅 Sample Attendance Logs Seeded');

    console.log('\n=======================================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=======================================================');
    console.log('Login Credentials to test:');
    console.log('👑 Owner:   Gym ID: UDGOWNER-1001 | Password: owner123');
    console.log('🏋️ Trainer: Gym ID: UDGTRA-1001   | Password: trainer123');
    console.log('🏃 Member:  Gym ID: UDGMEM-1001   | Password: member123');
    console.log('=======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

seedData();
