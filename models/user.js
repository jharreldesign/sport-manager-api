const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Add bcrypt for hashing and validation

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  hashedPassword: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'manager', 'coach'],
    default: 'user',
  },
  first_name: {
    type: String,
    required: false,
  },
  last_name: {
    type: String,
    required: false,
  },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.hashedPassword; // Don't send the password in the response
  },
});

// Hash the password before saving the user to the database
userSchema.pre('save', async function(next) {
  if (this.isModified('hashedPassword')) {
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 12); // Hash the password before saving
  }
  next();
});

// Password validation method (to be used in `auth.js` for login)
userSchema.methods.isValidPassword = async function(password) {
  return bcrypt.compare(password, this.hashedPassword); // Compare the hashed password
};

module.exports = mongoose.model('User', userSchema);
