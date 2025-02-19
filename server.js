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

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' })); // Allow frontend requests
app.use(express.json());
app.use(logger('dev'));

// Routes
app.use('/auth', authRouter);
app.use('/test-jwt', testJwtRouter);
app.use('/users', usersRouter);
app.use('/teams', teamRouter);
app.use('/players', playerRouter);
app.use('/schedules', scheduleRouter);

// Get the port from environment or default to 3000
const port = process.env.PORT || 3000;

// Start the server
const server = app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
