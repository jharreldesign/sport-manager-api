const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const saltRounds = 12;

// Sign-up route
router.post('/sign-up', async (req, res) => {
  try {
    const { username, password, email, role = 'user' } = req.body;

    // Check if the username already exists in the database
    const userInDatabase = await User.findOne({ username });
    if (userInDatabase) {
      return res.status(409).json({ err: 'Username already taken.' });
    }

    // Create the user with hashedPassword and email
    const user = await User.create({
      username,
      hashedPassword: password,  // Hashing happens in the model before saving
      email,
      role,
    });

    // Create JWT payload
    const payload = { username: user.username, _id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with token
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Sign-in route
router.post('/sign-in', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ err: 'Invalid credentials.' });
    }

    // Check if the password matches the hashed password
    const isPasswordCorrect = await user.isValidPassword(password);  // Use the model method
    if (!isPasswordCorrect) {
      return res.status(401).json({ err: 'Invalid credentials.' });
    }

    // Create JWT payload
    const payload = { username: user.username, _id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Respond with token
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
