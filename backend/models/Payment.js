const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paidAmount: {
      type: Number,
      required: true
    },
    dueAmount: {
      type: Number,
      default: 0
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI / GPay / PhonePe', 'Debit/Credit Card', 'Bank Transfer'],
      default: 'Cash'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Paid', 'Partial', 'Pending'],
      default: 'Paid'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);