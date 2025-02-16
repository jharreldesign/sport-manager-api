const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true
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
      ref: 'User' 
    },
    schedule: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Schedule' 
    }],
    players: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Player' 
    }],  // Add the players field as an array of ObjectId references to Player model
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

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
