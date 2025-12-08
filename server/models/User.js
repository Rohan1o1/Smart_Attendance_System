const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

/**
 * User Schema
 * Handles students, teachers, and admins
 */
const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'Email cannot exceed 100 characters'],
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
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },

  // Personal Information
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

  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(phone) {
        return config.validation.phoneNumberRegex.test(phone);
      },
      message: 'Please provide a valid phone number'
    }
  },

  // Role and Academic Information
  role: {
    type: String,
    required: true,
    enum: {
      values: ['student', 'teacher', 'admin'],
      message: 'Role must be either student, teacher, or admin'
    }
  },

  // Student-specific fields
  studentId: {
    type: String,
    sparse: true, // Unique only if not null
    unique: true,
    validate: {
      validator: function(value) {
        // Only required for students
        if (this.role === 'student') {
          return value && value.trim().length > 0;
        }
        return true;
      },
      message: 'Student ID is required for students'
    }
  },

  department: {
    type: String,
    required: function() {
      return this.role === 'student' || this.role === 'teacher';
    },
    trim: true
  },

  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: function() {
      return this.role === 'student';
    }
  },

  // Teacher-specific fields
  employeeId: {
    type: String,
    sparse: true,
    unique: true,
    validate: {
      validator: function(value) {
        // Only required for teachers
        if (this.role === 'teacher') {
          return value && value.trim().length > 0;
        }
        return true;
      },
      message: 'Employee ID is required for teachers'
    }
  },

  // Face Recognition Data
  faceEmbeddings: [{
    embedding: {
      type: [Number], // Array of numbers for face embedding
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Security and Status
  isActive: {
    type: Boolean,
    default: true
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  lastLogin: {
    type: Date
  },

  loginAttempts: {
    type: Number,
    default: 0,
    max: 5
  },

  lockUntil: {
    type: Date
  },

  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Profile Image
  profileImage: {
    type: String,
    default: null
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Indexes for better performance (excluding unique fields which auto-create indexes)
userSchema.index({ role: 1, department: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with configurable salt rounds
    const hashedPassword = await bcrypt.hash(this.password, config.security.bcryptRounds);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for validation
userSchema.pre('save', function(next) {
  // Ensure face embeddings don't exceed max limit
  if (this.faceEmbeddings && this.faceEmbeddings.length > config.faceRecognition.maxFaceImages) {
    return next(new Error(`Cannot have more than ${config.faceRecognition.maxFaceImages} face images`));
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account if max attempts reached
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ 
    email: email.toLowerCase(),
    isActive: true 
  }).select('+password');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.isLocked) {
    throw new Error('Account is temporarily locked. Please try again later.');
  }

  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    await user.incLoginAttempts();
    throw new Error('Invalid email or password');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts || user.lockUntil) {
    await user.resetLoginAttempts();
  }

  return user;
};

// Static method to generate student ID
userSchema.statics.generateStudentId = async function(department, year) {
  const currentYear = year || new Date().getFullYear();
  const deptCode = department.substring(0, 3).toUpperCase();
  
  // Find the highest student ID for the department and year
  const lastStudent = await this.findOne(
    { 
      studentId: new RegExp(`^${currentYear}${deptCode}`),
      role: 'student'
    },
    {},
    { sort: { studentId: -1 } }
  );

  let sequenceNumber = 1;
  if (lastStudent && lastStudent.studentId) {
    const lastSequence = parseInt(lastStudent.studentId.slice(-3));
    sequenceNumber = lastSequence + 1;
  }

  return `${currentYear}${deptCode}${sequenceNumber.toString().padStart(3, '0')}`;
};

// Static method to generate employee ID
userSchema.statics.generateEmployeeId = async function(department) {
  const deptCode = department.substring(0, 3).toUpperCase();
  
  // Find the highest employee ID for the department
  const lastTeacher = await this.findOne(
    { 
      employeeId: new RegExp(`^${deptCode}`),
      role: 'teacher'
    },
    {},
    { sort: { employeeId: -1 } }
  );

  let sequenceNumber = 1;
  if (lastTeacher && lastTeacher.employeeId) {
    const lastSequence = parseInt(lastTeacher.employeeId.slice(3));
    sequenceNumber = lastSequence + 1;
  }

  return `${deptCode}${sequenceNumber.toString().padStart(4, '0')}`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
