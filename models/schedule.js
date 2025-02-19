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
      enum: ['home', 'away', 'neutral'],  // Added 'neutral' to support neutral site games
      required: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // Assuming 'User' model for admins/managers
      required: true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // Assuming 'User' model for tracking updates
    },
    game_duration: {
      type: Number,  // Optional: to store game duration in minutes
      required: false
    },
    time_zone: {
      type: String,  // Optional: to store the time zone for the game
      required: false
    }
  },
  { timestamps: true }
);

// Optional: Index for optimization
scheduleSchema.index({ home_team: 1, away_team: 1, date: 1 }, { unique: true });

// Create the Schedule model
const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
