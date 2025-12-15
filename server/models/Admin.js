const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Admin Schema (Department Head)
 * Can verify teachers and students of their department
 * Department must be unique (new department only)
 */
const adminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  adminId: {
    type: String,
    required: [true, 'Admin ID is required'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{8,12}$/.test(v);
      },
      message: 'Admin ID must be 8-12 digits'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
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
    default: 'admin',
    immutable: true
  },
  isActive: {
    type: Boolean,
    default: true
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
adminSchema.pre('save', async function(next) {
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
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Update last login
adminSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save();
};

// Static method to check if department exists
adminSchema.statics.departmentExists = async function(department) {
  const admin = await this.findOne({ department: department.trim() });
  return !!admin;
};

// Static method to get all departments
adminSchema.statics.getAllDepartments = async function() {
  const admins = await this.find({ isActive: true }).select('department');
  return admins.map(admin => admin.department);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
