const express = require("express");
const mongoose = require("mongoose");
const verifyToken = require('../middleware/verify-token');
const Team = require('../models/team');
const Schedule = require('../models/schedule');
const router = express.Router();

// Helper function to validate the date format
const validateDate = (date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate) ? parsedDate : null;
};

// Helper function to check if a team exists
const checkTeamExists = async (teamId) => {
    const team = await Team.findById(teamId);
    if (!team) throw new Error('Team not found');
    return team;
};

// Helper function to check if teams are different
const checkTeamsAreDifferent = (home_team, away_team) => {
    if (home_team.equals(away_team)) {
        throw new Error('Home team and away team cannot be the same');
    }
};

// 1. Route to create a game for a specific team
router.post('/teams/:teamId/schedules', verifyToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { home_team, away_team, date } = req.body;

        if (!home_team || !away_team || !date) {
            return res.status(400).json({ error: "Home team, away team, and date are required" });
        }

        const parsedDate = validateDate(date);
        if (!parsedDate) return res.status(400).json({ error: "Invalid date format" });

        // Check if the teams exist
        const homeTeam = await checkTeamExists(home_team);
        const awayTeam = await checkTeamExists(away_team);

        // Ensure home team and away team are different
        checkTeamsAreDifferent(home_team, away_team);

        // Check if a game is already scheduled for this date
        const existingGame = await Schedule.findOne({
            home_team,
            away_team,
            date: parsedDate
        });
        if (existingGame) {
            return res.status(400).json({ error: "A game between these teams is already scheduled for this date." });
        }

        // Ensure that the schedule being created belongs to the correct team (home_team or away_team)
        if (home_team.toString() !== teamId && away_team.toString() !== teamId) {
            return res.status(400).json({ error: "The schedule must belong to the specified team." });
        }

        const scheduleData = {
            home_team: home_team,
            away_team: away_team,
            date: parsedDate,
            arena: homeTeam.stadium,
            city: homeTeam.city
        };

        // Create the schedule
        const schedule = await Schedule.create(scheduleData);

        const populatedSchedule = await Schedule.findById(schedule._id)
            .populate('home_team', 'name city stadium')
            .populate('away_team', 'name city stadium');
        
        res.status(201).json(populatedSchedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Route to get all schedules
router.get('/', async (req, res) => {
    try {
        const schedules = await Schedule.find().populate('home_team away_team');
        res.status(200).json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Route to get a single schedule by ID
router.get('/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id).populate('home_team away_team');
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
        res.status(200).json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Route to update a schedule
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { home_team, away_team, date } = req.body;

        if (!home_team || !away_team || !date) {
            return res.status(400).json({ error: 'Home team, away team, and date are required' });
        }

        const parsedDate = validateDate(date);
        if (!parsedDate) return res.status(400).json({ error: "Invalid date format" });

        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

        // Check if the teams exist
        const homeTeam = await checkTeamExists(home_team);
        const awayTeam = await checkTeamExists(away_team);

        // Ensure home team and away team are different
        checkTeamsAreDifferent(home_team, away_team);

        // Check if a game is already scheduled for this date
        const existingGame = await Schedule.findOne({
            home_team,
            away_team,
            date: parsedDate
        });
        if (existingGame) {
            return res.status(400).json({ error: "A game between these teams is already scheduled for this date." });
        }

        // Update the schedule
        schedule.home_team = home_team;
        schedule.away_team = away_team;
        schedule.date = parsedDate;
        schedule.arena = homeTeam.stadium;
        schedule.city = homeTeam.city;

        await schedule.save();

        const populatedSchedule = await Schedule.findById(schedule._id)
            .populate('home_team', 'name city stadium')
            .populate('away_team', 'name city stadium');
        
        res.status(200).json(populatedSchedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Route to delete a schedule
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

        await schedule.remove();
        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Route to get a specific team with populated schedule
router.get('/team/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('schedule')
            .populate('manager')
            .exec();

        if (!team) return res.status(404).json({ error: 'Team not found.' });

        res.status(200).json(team);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
