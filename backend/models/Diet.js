const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  mealTime: {
    type: String,
    enum: ['Breakfast', 'Morning Snack', 'Lunch', 'Pre-Workout', 'Post-Workout', 'Dinner'],
    required: true
  },
  items: { type: String, required: true },
  calories: { type: Number, default: 0 },
  proteinGrams: { type: Number, default: 0 }
});

const dietSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dietType: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Custom'],
      default: 'Non-Vegetarian'
    },
    dailyGoal: {
      type: String,
      default: 'Muscle Building & Strength'
    },
    meals: [mealItemSchema],
    notes: {
      type: String,
      default: 'Drink at least 3-4 liters of water daily.'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Diet || mongoose.model('Diet', dietSchema);