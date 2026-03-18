const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  id: String,
  type: String, // e.g. 'Running', 'Walking'
  durationMinutes: Number,
  distanceKm: { type: Number, default: 0 },
  caloriesBurned: Number,
  intensity: String,
  timestamp: { type: Date, default: Date.now }
});

const NutritionSchema = new mongoose.Schema({
  foodName: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  summary: String,
  timestamp: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,

  // New Complex Data Storages
  activities: [ActivitySchema],
  nutrition: [NutritionSchema],

  stats: {
    steps: { type: Number, default: 0 },
    caloriesIn: { type: Number, default: 0 },
    caloriesOut: { type: Number, default: 0 },
    waterMl: { type: Number, default: 0 },
    sleepHours: { type: Number, default: 0 }
  },

  blueprint: {
    gender: { type: String, enum: ['Male', 'Female', 'None'], default: 'None' },
    heightCm: { type: Number, default: 170 },
    weightKg: { type: Number, default: 70 },
    healthScore: { type: Number, default: 50 },
  }
});

module.exports = mongoose.model("User", UserSchema);