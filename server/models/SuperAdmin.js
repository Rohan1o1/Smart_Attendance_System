const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * SuperAdmin Schema
 * Full system control - can manage Admin accounts only
 */
const superAdminSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{8,12}$/.test(v);
      },
      message: 'User ID must be 8-12 digits'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [100, 'Password cannot exceed 100 characters'],
    select: false
  },
  role: {
    type: String,
    default: 'superadmin',
    immutable: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
superAdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
superAdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
superAdminSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

module.exports = SuperAdmin;
