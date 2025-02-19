const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,  // Ensuring no duplicate team names within the same city
    },
    city: {
      type: String,
      required: true,
    },
    stadium: {
      type: String,
      required: true,
    },
    sport: {
      type: String,
      required: true,
      enum: ['Baseball', 'Basketball', 'Hockey', 'Football', 'Soccer'],
    },
    manager: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', // The manager is a user (admin or manager of the team)
    },
    schedule: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Schedule' 
    }],
    players: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Player' 
    }],
    stadium_photo: {
      type: String,
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // Assuming 'User' model for admins
      required: true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // To track who last updated the team
    },
    team_type: {
      type: String,
      enum: ['Youth', 'Professional', 'College', 'Amateur'],  // New field for team categorization
      required: false,
    },
    stadium_location: {
      type: String,  // Optional: to store stadium address or additional info
      required: false
    },
    stadium_capacity: {
      type: Number,  // Optional: to store the stadium's seating capacity
      required: false,
    }
  },
  { timestamps: true }
);

// Middleware to handle team deletion
teamSchema.post('findOneAndDelete', async function (team) {
  try {
    // Find all players associated with the deleted team
    const players = await mongoose.model('Player').find({ team: team._id });

    // Unassign the team from each player
    for (const player of players) {
      player.team = null; // Set the team field to null
      await player.save(); // Save the updated player
    }

    console.log(`Freed ${players.length} players from team ${team.id}`);
  } catch (err) {
    console.error("Error unassigning players:", err);
  }
});

// Create the Team model
const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
