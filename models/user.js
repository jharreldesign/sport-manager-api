const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensure username is unique across all users
    trim: true, // Trim whitespace around the username
    minlength: [3, 'Username must be at least 3 characters long'], // Optional: enforce a minimum length
  },
  email: {
    type: String,
    required: true,
    unique: true,  // Ensure email is unique for user registration
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],  // Basic email format validation
  },
  hashedPassword: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'manager', 'coach'], // Expanded roles for potential growth
    default: 'user',
  },
  first_name: {
    type: String,
    required: false, // Optional: user’s first name
  },
  last_name: {
    type: String,
    required: false, // Optional: user’s last name
  },
}, { timestamps: true }); // Add timestamps for better tracking

// Ensure that sensitive data (like passwords) is not exposed in the API response
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    // Remove hashed password from the response
    delete returnedObject.hashedPassword;
  }
});

// Optional: Adding a method for password validation if needed
userSchema.methods.isValidPassword = function(password) {
  // Implement password validation logic here (e.g., comparing hashed password)
  return bcrypt.compareSync(password, this.hashedPassword);
};

module.exports = mongoose.model('User', userSchema);
