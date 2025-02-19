const express = require("express");
const mongoose = require("mongoose");
const verifyToken = require("../middleware/verify-token.js");
const Team = require("../models/team.js");
const Player = require("../models/player.js");
const Schedule = require("../models/schedule.js");
const router = express.Router();

// Middleware to check if the logged-in user is the manager of the team
const checkManager = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });

        if (!team.manager) {
            return res.status(404).json({ error: "Team does not have a manager" });
        }

        const loggedInUserId = new mongoose.Types.ObjectId(req.user._id);
        if (!team.manager.equals(loggedInUserId)) {
            return res.status(403).json({ error: "You're not allowed to do that" });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: "Error checking manager: " + err.message });
    }
};

// Route to create a new team
router.post('/', verifyToken, async (req, res) => {
    try {
        req.body.manager = req.user._id;
        const team = await Team.create(req.body);

        // Populate the manager information
        await team.populate({
            path: 'manager',
            select: 'first_name last_name username'
        });

        res.status(201).json(team);
    } catch (err) {
        res.status(500).json({ error: "Error creating team: " + err.message });
    }
});

// Route to get all teams with pagination and optional filtering
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        // Fetch all teams with pagination and populate related data
        const teams = await Team.find(query)
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'schedule',
                populate: [
                    { path: 'home_team', select: 'name city stadium' },
                    { path: 'away_team', select: 'name city stadium' },
                ]
            })
            .populate({
                path: 'players',
                select: 'first_name last_name player_number position',
                populate: {
                    path: 'team',
                    select: 'name stadium'
                }
            })
            .populate({
                path: 'manager',
                select: 'first_name last_name username'
            })
            .lean();

        if (!teams || teams.length === 0) return res.status(404).json({ error: "No teams found." });

        const totalTeams = await Team.countDocuments(query);
        const totalPages = Math.ceil(totalTeams / limit);

        res.status(200).json({
            teams,
            pagination: { page, limit, totalPages, totalTeams }
        });
    } catch (err) {
        res.status(500).json({ error: "Error fetching teams: " + err.message });
    }
});

// Route to get team by ID
router.get('/:teamId', verifyToken, async (req, res) => {
    try {
        const team = await Team.findById(req.params.teamId)
            .populate({
                path: 'schedule',
                populate: [
                    { path: 'home_team', select: 'name city stadium' },
                    { path: 'away_team', select: 'name city stadium' },
                ]
            })
            .populate({
                path: 'players',
                select: 'first_name last_name position team',
                populate: {
                    path: 'team',
                    select: 'name stadium'
                }
            })
            .populate({
                path: 'manager',
                select: 'first_name last_name username'
            });

        if (!team) return res.status(404).json({ error: "Team not found." });

        res.status(200).json(team);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to update a team (only accessible by the manager)
router.put("/:teamId", verifyToken, checkManager, async (req, res) => {
    try {
        const updatedTeam = await Team.findByIdAndUpdate(
            req.params.teamId,
            req.body,
            { new: true }
        ).populate({
            path: 'manager',
            select: 'first_name last_name username'
        });

        if (!updatedTeam) return res.status(404).json({ error: "Team not found" });

        res.status(200).json(updatedTeam);
    } catch (err) {
        res.status(500).json({ error: "Error updating team: " + err.message });
    }
});

// Route to delete a team (only accessible by the manager)
router.delete('/:teamId', verifyToken, checkManager, async (req, res) => {
    try {
        const deletedTeam = await Team.findByIdAndDelete(req.params.teamId);

        if (!deletedTeam) return res.status(404).json({ error: "Team not found" });

        // Remove the team reference from all players
        await Player.updateMany({ team: deletedTeam._id }, { $set: { team: null } });

        res.status(200).json(deletedTeam);
    } catch (err) {
        res.status(500).json({ error: "Error deleting team: " + err.message });
    }
});

// Route to add a player to a team
router.post('/:teamId/players', verifyToken, async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });

        // Check if the player already exists in the team with the same number
        const existingPlayer = await Player.findOne({ team: teamId, player_number: req.body.player_number });
        if (existingPlayer) {
            return res.status(400).json({ error: "Player already exists in the team with the same number" });
        }

        const newPlayer = new Player({
            ...req.body,
            team: teamId,
        });

        await newPlayer.save();
        team.players.push(newPlayer._id);
        await team.save();

        res.status(201).json(newPlayer);
    } catch (err) {
        res.status(500).json({ error: "Error adding player: " + err.message });
    }
});

// Route to add a schedule for a team
router.post('/:teamId/schedules', verifyToken, async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });

        const newSchedule = new Schedule({
            ...req.body,
            team: teamId,
        });

        await newSchedule.save();

        team.schedule.push(newSchedule._id);
        await team.save();

        res.status(201).json(newSchedule);
    } catch (err) {
        res.status(500).json({ error: "Error adding schedule: " + err.message });
    }
});

module.exports = router;
