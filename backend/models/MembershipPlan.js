const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    durationInMonths: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    features: [
      {
        type: String
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.MembershipPlan || mongoose.model('MembershipPlan', membershipPlanSchema);