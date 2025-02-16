const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const verifyToken = require("../middleware/verify-token.js");
const Player = require("../models/player.js");
const Team = require("../models/team.js");
const router = express.Router();

// Helper function to check if the logged-in user is the manager of the team
const isManagerOfTeam = async (userId, teamId) => {
    const team = await Team.findById(teamId);
    if (!team || !team.manager.equals(userId)) {
        throw new Error("You're not allowed to do that");
    }
    return team;
};

// Route to create a player
router.post(
    '/',
    verifyToken,
    // Validation checks
    body('first_name').isString().notEmpty().withMessage('First name is required'),
    body('last_name').isString().notEmpty().withMessage('Last name is required'),
    body('position').isString().withMessage('Position should be a string'),
    body('team').isMongoId().withMessage('Invalid Team ID'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { team } = req.body;
            if (!team) {
                return res.status(400).json({ error: "Team ID is required" });
            }

            // Validate the team exists
            const teamData = await Team.findById(team);
            if (!teamData) {
                return res.status(404).json({ error: "Team not found." });
            }

            // Set the team reference in the player document
            req.body.team = team;

            // Create the player and link them to the team
            const player = await Player.create(req.body);
            player._doc.manager = req.user; // Add manager info if needed

            // Populate and return the created player with team details
            const populatedPlayer = await Player.findById(player._id).populate('team');
            res.status(201).json(populatedPlayer); // Return the created player with populated team
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// Route to get all players with pagination and optional search/filter
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, teamId, position } = req.query; // Handle search & filter
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
            ];
        }
        if (teamId) {
            query.team = teamId;
        }
        if (position) {
            query.position = position;
        }

        // Fetch all players with pagination and populate 'team' field
        const players = await Player.find(query)
            .skip(skip)
            .limit(limit)
            .populate('team'); // Populate the team field

        if (!players || players.length === 0) {
            return res.status(404).json({ error: "No players found." });
        }

        const totalPlayers = await Player.countDocuments(query);
        const totalPages = Math.ceil(totalPlayers / limit);

        res.status(200).json({
            players,
            pagination: { page, limit, totalPages, totalPlayers }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to get player by ID
router.get('/:playerId', verifyToken, async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerId)
            .populate('team')
            .exec();

        if (!player) {
            return res.status(404).json({ error: "Player not found." });
        }

        res.status(200).json(player);  
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to update a player
router.put("/:playerId", verifyToken, async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerId);
        if (!player) {
            return res.status(404).json({ error: "Player not found" });
        }

        if (!player.team) {
            return res.status(400).json({ error: "Player does not have a team" });
        }

        const team = await isManagerOfTeam(req.user._id, player.team);

        const updatedPlayer = await Player.findByIdAndUpdate(
            req.params.playerId,
            req.body,
            { new: true }
        );

        const populatedPlayer = await Player.findById(updatedPlayer._id).populate('team');
        res.status(200).json(populatedPlayer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to delete a player
router.delete('/:playerId', verifyToken, async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerId);
        if (!player) {
            return res.status(404).json({ error: "Player not found" });
        }

        if (!player.team) {
            return res.status(400).json({ error: "Player does not have a team" });
        }

        await isManagerOfTeam(req.user._id, player.team);  // Check if the logged-in user is a manager of the player's team

        const deletedPlayer = await Player.findByIdAndDelete(req.params.playerId);

        const populatedPlayer = await Player.findById(deletedPlayer._id).populate('team');
        res.status(200).json(populatedPlayer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
