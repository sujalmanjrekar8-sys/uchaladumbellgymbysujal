const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const User = require('./models/User');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uchaladumbellgymbysujal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all payments that still have the old format (INV-UDG-)
    const oldPayments = await Payment.find({
      invoiceNumber: { $regex: /^INV-UDG-/i }
    }).populate('member');

    console.log(`Found ${oldPayments.length} legacy invoices to update.`);

    let index = 1;
    for (const payment of oldPayments) {
      const memberGymId = payment.member ? payment.member.gymId : null;
      const memberCode = memberGymId ? String(memberGymId).replace(/\D/g, '') : '1000';
      
      const date = payment.paymentDate ? new Date(payment.paymentDate) : (payment.createdAt ? new Date(payment.createdAt) : new Date());

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      // Add padded index as seconds offset to ensure 100% uniqueness among migrated invoices
      const seconds = String((date.getSeconds() + index) % 60).padStart(2, '0');

      const newInvoiceNumber = `INV-${memberCode}${day}${month}${year}${hours}${minutes}${seconds}`;
      const oldNo = payment.invoiceNumber;
      payment.invoiceNumber = newInvoiceNumber;
      await payment.save();
      console.log(`Updated: ${oldNo} -> ${newInvoiceNumber} (${payment.member ? payment.member.name : 'Unknown'})`);
      index++;
    }

    console.log('🎉 Migration finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
