const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

// Import routers
const authRouter = require('./controllers/auth');
const testJwtRouter = require('./controllers/test-jwt');
const usersRouter = require('./controllers/users');
const teamRouter = require('./controllers/teams');
const playerRouter = require('./controllers/players');
const scheduleRouter = require('./controllers/schedules');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
    console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Allow frontend requests
app.use(express.json());
app.use(logger('dev'));

// Routes
app.use('/auth', authRouter);
app.use('/test-jwt', testJwtRouter);
app.use('/users', usersRouter);
app.use('/teams', teamRouter);
app.use('/players', playerRouter);
app.use('/schedules', scheduleRouter);

// Start the server and listen on port 3000
app.listen(3000, () => {
    console.log('The express app is ready!');
});