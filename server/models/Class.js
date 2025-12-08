const mongoose = require('mongoose');

/**
 * Class Schema
 * Represents a class session with teacher location and geofence
 */
const classSchema = new mongoose.Schema({
  // Basic Class Information
  classId: {
    type: String,
    required: [true, 'Class ID is required'],
    unique: true,
    trim: true
  },

  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },

  subjectCode: {
    type: String,
    required: [true, 'Subject code is required'],
    trim: true,
    uppercase: true,
    maxlength: [10, 'Subject code cannot exceed 10 characters']
  },

  // Teacher Information
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required'],
    validate: {
      validator: async function(teacherId) {
        const teacher = await mongoose.model('User').findById(teacherId);
        return teacher && teacher.role === 'teacher';
      },
      message: 'Referenced user must be a teacher'
    }
  },

  teacherName: {
    type: String,
    required: true,
    trim: true
  },

  // Academic Information
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },

  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },

  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    validate: {
      validator: function(year) {
        return /^\d{4}-\d{4}$/.test(year);
      },
      message: 'Academic year must be in format YYYY-YYYY (e.g., 2023-2024)'
    }
  },

  // Schedule Information
  schedule: {
    dayOfWeek: {
      type: String,
      required: true,
      enum: {
        values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        message: 'Day of week must be a valid weekday'
      }
    },
    
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      validate: {
        validator: function(time) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      validate: {
        validator: function(time) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'End time must be in HH:MM format'
      }
    },

    duration: {
      type: Number, // Duration in minutes
      required: true
    }
  },

  // Location Information
  teacherLocation: {
    latitude: {
      type: Number,
      required: function() {
        return this.status === 'active';
      },
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    
    longitude: {
      type: Number,
      required: function() {
        return this.status === 'active';
      },
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },

    address: {
      type: String,
      trim: true
    },

    capturedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Geofence Configuration
  geofenceRadius: {
    type: Number,
    default: 20, // Default 20 meters
    min: [5, 'Geofence radius must be at least 5 meters'],
    max: [100, 'Geofence radius cannot exceed 100 meters']
  },

  // Class Session Status
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'active', 'completed', 'cancelled'],
      message: 'Status must be scheduled, active, completed, or cancelled'
    },
    default: 'scheduled'
  },

  // Session Timing
  sessionStartTime: {
    type: Date,
    required: function() {
      return this.status === 'active' || this.status === 'completed';
    }
  },

  sessionEndTime: {
    type: Date,
    validate: {
      validator: function(endTime) {
        return !endTime || !this.sessionStartTime || endTime > this.sessionStartTime;
      },
      message: 'Session end time must be after start time'
    }
  },

  // Attendance Configuration
  attendanceWindow: {
    beforeMinutes: {
      type: Number,
      default: 15, // Allow attendance 15 minutes before class
      min: [0, 'Before minutes cannot be negative']
    },
    
    afterMinutes: {
      type: Number,
      default: 15, // Allow attendance 15 minutes after class starts
      min: [0, 'After minutes cannot be negative']
    }
  },

  // Enrolled Students
  enrolledStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    
    status: {
      type: String,
      enum: ['enrolled', 'dropped', 'suspended'],
      default: 'enrolled'
    }
  }],

  // Class Statistics
  statistics: {
    totalStudents: {
      type: Number,
      default: 0
    },
    
    averageAttendance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    totalSessions: {
      type: Number,
      default: 0
    }
  },

  // Additional Information
  classroom: {
    type: String,
    trim: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance (excluding unique fields which auto-create indexes)
classSchema.index({ teacherId: 1, status: 1 });
classSchema.index({ department: 1, semester: 1 });
classSchema.index({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });
classSchema.index({ academicYear: 1, isActive: 1 });
classSchema.index({ status: 1, sessionStartTime: 1 });

// Virtual for current session duration
classSchema.virtual('currentSessionDuration').get(function() {
  if (!this.sessionStartTime) return 0;
  
  const endTime = this.sessionEndTime || new Date();
  return Math.floor((endTime - this.sessionStartTime) / (1000 * 60)); // Duration in minutes
});

// Virtual for attendance window times
classSchema.virtual('attendanceWindowTimes').get(function() {
  if (!this.sessionStartTime) return null;

  const startTime = new Date(this.sessionStartTime);
  const windowStart = new Date(startTime.getTime() - (this.attendanceWindow.beforeMinutes * 60 * 1000));
  const windowEnd = new Date(startTime.getTime() + (this.attendanceWindow.afterMinutes * 60 * 1000));

  return {
    start: windowStart,
    end: windowEnd,
    isOpen: Date.now() >= windowStart.getTime() && Date.now() <= windowEnd.getTime()
  };
});

// Pre-save middleware to calculate duration
classSchema.pre('save', function(next) {
  if (this.schedule && this.schedule.startTime && this.schedule.endTime) {
    const [startHour, startMinute] = this.schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.schedule.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    this.schedule.duration = endMinutes - startMinutes;
  }
  next();
});

// Pre-save middleware to update statistics
classSchema.pre('save', function(next) {
  if (this.isModified('enrolledStudents')) {
    this.statistics.totalStudents = this.enrolledStudents.filter(
      student => student.status === 'enrolled'
    ).length;
  }
  next();
});

// Instance method to start class session
classSchema.methods.startSession = function(teacherLocation) {
  this.status = 'active';
  this.sessionStartTime = new Date();
  this.teacherLocation = {
    latitude: teacherLocation.latitude,
    longitude: teacherLocation.longitude,
    address: teacherLocation.address || '',
    capturedAt: new Date()
  };
  
  return this.save();
};

// Instance method to end class session
classSchema.methods.endSession = function() {
  this.status = 'completed';
  this.sessionEndTime = new Date();
  this.statistics.totalSessions += 1;
  
  return this.save();
};

// Instance method to check if attendance is allowed
classSchema.methods.isAttendanceAllowed = function() {
  if (this.status !== 'active') {
    return { allowed: false, reason: 'Class is not active' };
  }

  const windowTimes = this.attendanceWindowTimes;
  if (!windowTimes.isOpen) {
    return { 
      allowed: false, 
      reason: 'Attendance window is closed',
      windowStart: windowTimes.start,
      windowEnd: windowTimes.end
    };
  }

  return { allowed: true, windowEnd: windowTimes.end };
};

// Instance method to add student to class
classSchema.methods.enrollStudent = function(studentId) {
  const existingEnrollment = this.enrolledStudents.find(
    enrollment => enrollment.studentId.toString() === studentId.toString()
  );

  if (existingEnrollment) {
    if (existingEnrollment.status === 'dropped') {
      existingEnrollment.status = 'enrolled';
      existingEnrollment.enrolledAt = new Date();
    } else {
      throw new Error('Student is already enrolled in this class');
    }
  } else {
    this.enrolledStudents.push({
      studentId,
      enrolledAt: new Date(),
      status: 'enrolled'
    });
  }

  return this.save();
};

// Instance method to remove student from class
classSchema.methods.dropStudent = function(studentId) {
  const enrollment = this.enrolledStudents.find(
    enrollment => enrollment.studentId.toString() === studentId.toString()
  );

  if (!enrollment) {
    throw new Error('Student is not enrolled in this class');
  }

  enrollment.status = 'dropped';
  return this.save();
};

// Static method to generate class ID
classSchema.statics.generateClassId = async function(subjectCode, academicYear, semester) {
  const prefix = `${subjectCode}-${academicYear.split('-')[0]}-S${semester}`;
  
  // Find the highest class ID with this prefix
  const lastClass = await this.findOne(
    { classId: new RegExp(`^${prefix}`) },
    {},
    { sort: { classId: -1 } }
  );

  let sequenceNumber = 1;
  if (lastClass && lastClass.classId) {
    const lastSequence = parseInt(lastClass.classId.split('-').pop());
    sequenceNumber = lastSequence + 1;
  }

  return `${prefix}-${sequenceNumber.toString().padStart(2, '0')}`;
};

// Static method to find active classes for teacher
classSchema.statics.findActiveForTeacher = function(teacherId) {
  return this.find({
    teacherId,
    status: 'active',
    isActive: true
  }).populate('teacherId', 'firstName lastName email');
};

// Static method to find classes by schedule
classSchema.statics.findBySchedule = function(dayOfWeek, currentTime) {
  return this.find({
    'schedule.dayOfWeek': dayOfWeek,
    isActive: true
  }).where('schedule.startTime').lte(currentTime)
    .where('schedule.endTime').gte(currentTime);
};

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
