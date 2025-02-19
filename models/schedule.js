const mongoose = require('mongoose');

// Schedule schema definition
const scheduleSchema = new mongoose.Schema(
  {
    home_team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    away_team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v > Date.now(); // Ensure that the date is in the future
        },
        message: 'The game date must be in the future.'
      }
    },
    arena: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Canceled'],
      default: 'Scheduled'
    },
    season: {  // Optional field to categorize the game season
      type: String,
      enum: ['Regular', 'Playoffs', 'Friendly', 'Tournament'],
      default: 'Regular'
    },
    location: {  // New field for home or away
      type: String,
      enum: ['home', 'away'],
      required: true
    }
  },
  { timestamps: true }
);

// Optional: Index for optimization
scheduleSchema.index({ home_team: 1, away_team: 1, date: 1 });

// Create the Schedule model
const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
