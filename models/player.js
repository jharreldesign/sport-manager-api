const mongoose = require('mongoose');

// Define valid player positions as an enum for validation
const positions = [
    'Pitcher',
    'Catcher',
    'First Base',
    'Second Base',
    'Shortstop',
    'Third Base',
    'Left Field',
    'Center Field',
    'Right Field',
    'Designated Hitter',
    'Goalkeeper', 
    'Forward', 
    'Defender', 
    'Midfielder'
]; // Example positions

const playerSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
            required: true,
        },
        last_name: {
            type: String,
            required: true,
        },
        hometown: {
            type: String,
            required: true,
        },
        player_number: {
            type: Number,
            required: true,
        },
        position: {
            type: String,
            enum: positions,  // Enum for predefined positions
            required: true,
        },
        team: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Team',
            required: true,  // Ensures a team is assigned to the player
        },
        status: {
            type: String,
            enum: ['Active', 'Injured', 'Inactive'],
            default: 'Active',  // Default to Active
        }
    },
    { timestamps: true }
);

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
