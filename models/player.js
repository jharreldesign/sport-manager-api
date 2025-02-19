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
];

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
            unique: true,  // Ensure player numbers are unique across the system
        },
        position: {
            type: String,
            enum: positions, 
            required: true,
        },
        team: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Team',
            required: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Injured', 'Inactive'],
            default: 'Active',
        },
        headshot: {
            type: String,
            required: true,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',  // Assuming 'User' model for admins/managers
            required: true,
        },
        updated_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',  // Assuming 'User' model for tracking updates
        },
        // Optionally track when player data was updated (if needed)
        updated_at: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Add validation for player number uniqueness within the team
playerSchema.index({ player_number: 1, team: 1 }, { unique: true });

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
