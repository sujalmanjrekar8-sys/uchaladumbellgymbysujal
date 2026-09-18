const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    month: {
      type: String,
      required: true
    },
    baseSalary: {
      type: Number,
      required: true
    },
    bonuses: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer'],
      default: 'Bank Transfer'
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Paid'
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true
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

module.exports = mongoose.models.Salary || mongoose.model('Salary', salarySchema);