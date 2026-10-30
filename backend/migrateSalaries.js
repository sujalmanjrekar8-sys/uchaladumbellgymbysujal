const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Salary = require('./models/Salary');
const User = require('./models/User');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uchaladumbellgymbysujal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all salary vouchers that still have the old format (SAL-UDG-)
    const oldSalaries = await Salary.find({
      $or: [
        { receiptNumber: { $regex: /^SAL-UDG-/i } },
        { voucherNo: { $regex: /^SAL-UDG-/i } }
      ]
    }).populate('trainer');

    console.log(`Found ${oldSalaries.length} legacy salary vouchers to update.`);

    let index = 1;
    for (const salary of oldSalaries) {
      const trainerGymId = salary.trainer ? salary.trainer.gymId : null;
      const trainerCode = trainerGymId ? String(trainerGymId).replace(/\D/g, '') : '1000';
      
      const date = salary.paymentDate ? new Date(salary.paymentDate) : (salary.createdAt ? new Date(salary.createdAt) : new Date());

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String((date.getSeconds() + index) % 60).padStart(2, '0');

      const newVoucherNumber = `SAL-${trainerCode}${day}${month}${year}${hours}${minutes}${seconds}`;
      const oldNo = salary.receiptNumber || salary.voucherNo;
      salary.receiptNumber = newVoucherNumber;
      salary.voucherNo = newVoucherNumber;
      await salary.save();
      console.log(`Updated: ${oldNo} -> ${newVoucherNumber} (${salary.trainer ? salary.trainer.name : 'Unknown'})`);
      index++;
    }

    console.log('🎉 Salary voucher migration finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
