const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Team = require('../models/team');
const { isAdmin, authorizeTeamOwner } = require('../middleware/authorization');  // Updated to use isAdmin and authorizeTeamOwner

const verifyToken = require('../middleware/verify-token');

// Admin can create teams
router.post('/teams', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, city, stadium, sport, stadium_photo } = req.body;

    // The logged-in admin is the manager of the team
    const manager = req.user._id;  // Manager is the logged-in user (admin)

    const team = new Team({
      name,
      city,
      stadium,
      sport,
      manager, // Set the manager field to the admin's _id
      stadium_photo
    });

    await team.save();
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User can only update their own team
router.put('/teams/:teamId', verifyToken, authorizeTeamOwner, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Ensure the user is the manager or owner of the team
    if (team.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to update this team' });
    }

    // Update team information (fields from the request body)
    Object.assign(team, req.body);
    await team.save();
    res.status(200).json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin can update any team
router.put('/teams/:teamId/admin', verifyToken, isAdmin, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Update team information (fields from the request body)
    Object.assign(team, req.body);
    await team.save();
    res.status(200).json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
