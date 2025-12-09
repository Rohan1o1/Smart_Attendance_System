const mongoose = require('mongoose');

/**
 * Attendance Schema
 * Records student attendance with location verification
 */
const attendanceSchema = new mongoose.Schema({
  // Student Information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
    validate: {
      validator: async function(studentId) {
        const student = await mongoose.model('User').findById(studentId);
        return student && student.role === 'student';
      },
      message: 'Referenced user must be a student'
    }
  },

  studentName: {
    type: String,
    required: true,
    trim: true
  },

  studentRollNumber: {
    type: String,
    required: true,
    trim: true
  },

  // Class Information
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },

  className: {
    type: String,
    required: true,
    trim: true
  },

  subjectCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },

  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Attendance Details
  status: {
    type: String,
    enum: {
      values: ['present', 'absent', 'late', 'excused', 'flagged'],
      message: 'Status must be present, absent, late, excused, or flagged'
    },
    required: [true, 'Attendance status is required']
  },

  // Timing Information
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },

  classStartTime: {
    type: Date,
    required: true
  },

  attendanceSubmissionTime: {
    type: Date,
    required: function() {
      return this.status === 'present' || this.status === 'late';
    }
  },

  // Location Information
  studentLocation: {
    latitude: {
      type: Number,
      required: function() {
        return this.status === 'present' || this.status === 'late';
      },
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    
    longitude: {
      type: Number,
      required: function() {
        return this.status === 'present' || this.status === 'late';
      },
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },

    accuracy: {
      type: Number, // GPS accuracy in meters
      min: 0
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

  teacherLocation: {
    latitude: {
      type: Number,
      required: function() {
        return this.status === 'present' || this.status === 'late';
      }
    },
    
    longitude: {
      type: Number,
      required: function() {
        return this.status === 'present' || this.status === 'late';
      }
    }
  },

  // Distance Calculations
  distanceFromTeacher: {
    type: Number, // Distance in meters
    min: 0
  },

  distanceFromCollege: {
    type: Number, // Distance in meters
    min: 0
  },

  // Face Recognition Data
  faceVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    
    faceImageUrl: {
      type: String // URL to the captured face image
    },
    
    livenessCheck: {
      passed: {
        type: Boolean,
        default: false
      },
      
      score: {
        type: Number,
        min: 0,
        max: 1
      },
      
      method: {
        type: String,
        enum: ['eye_blink', 'mouth_movement', 'head_movement', 'combined']
      }
    }
  },

  // Verification Results
  verificationResults: {
    locationVerified: {
      type: Boolean,
      default: false
    },
    
    faceVerified: {
      type: Boolean,
      default: false
    },
    
    timeVerified: {
      type: Boolean,
      default: false
    },
    
    overallStatus: {
      type: String,
      enum: ['verified', 'failed', 'flagged', 'pending'],
      default: 'pending'
    }
  },

  // Flags and Alerts
  flags: [{
    type: {
      type: String,
      enum: [
        'suspicious_location',
        'face_mismatch',
        'fake_gps',
        'multiple_attempts',
        'unusual_time',
        'device_mismatch',
        'ip_mismatch',
        'face_liveness_failed'
      ]
    },
    
    description: {
      type: String,
      required: true
    },
    
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Device Information
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown']
    },
    platform: String,
    browser: String
  },

  // Academic Information
  academicYear: {
    type: String,
    required: true
  },

  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },

  department: {
    type: String,
    required: true,
    trim: true
  },

  // Additional Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },

  // Manual Override (by teacher/admin)
  manualOverride: {
    isOverridden: {
      type: Boolean,
      default: false
    },
    
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    overrideReason: {
      type: String,
      trim: true
    },
    
    overrideTimestamp: {
      type: Date
    },
    
    originalStatus: {
      type: String
    }
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for better performance
attendanceSchema.index({ studentId: 1, classId: 1, timestamp: -1 });
attendanceSchema.index({ classId: 1, status: 1, timestamp: -1 });
attendanceSchema.index({ studentId: 1, academicYear: 1, semester: 1 });
attendanceSchema.index({ timestamp: -1 });
attendanceSchema.index({ 'verificationResults.overallStatus': 1 });
attendanceSchema.index({ 'flags.severity': 1, timestamp: -1 });
attendanceSchema.index({ teacherId: 1, timestamp: -1 });

// Compound indexes
attendanceSchema.index({ 
  studentId: 1, 
  classId: 1, 
  academicYear: 1, 
  semester: 1 
});

// Unique constraint to prevent duplicate attendance for same student in same class on same day
attendanceSchema.index(
  { 
    studentId: 1, 
    classId: 1, 
    timestamp: 1 
  },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['present', 'late'] },
      isActive: true
    }
  }
);

// Virtual for attendance date without time
attendanceSchema.virtual('attendanceDate').get(function() {
  const date = new Date(this.timestamp);
  return date.toISOString().split('T')[0];
});

// Virtual for lateness calculation
attendanceSchema.virtual('minutesLate').get(function() {
  if (!this.classStartTime || !this.attendanceSubmissionTime) return 0;
  
  const lateness = (this.attendanceSubmissionTime - this.classStartTime) / (1000 * 60);
  return Math.max(0, Math.floor(lateness));
});

// Virtual for verification status summary
attendanceSchema.virtual('verificationSummary').get(function() {
  const results = this.verificationResults;
  const total = 3; // location, face, time
  const verified = [
    results.locationVerified,
    results.faceVerified,
    results.timeVerified
  ].filter(Boolean).length;

  return {
    score: Math.round((verified / total) * 100),
    status: results.overallStatus,
    verifiedChecks: verified,
    totalChecks: total
  };
});

// Pre-save middleware to determine status based on timing
attendanceSchema.pre('save', function(next) {
  if (this.isNew && this.attendanceSubmissionTime && this.classStartTime) {
    const lateness = this.minutesLate;
    
    if (lateness > 15) { // Configurable threshold
      this.status = 'late';
    } else if (this.status !== 'flagged') {
      this.status = 'present';
    }
  }
  next();
});

// Pre-save middleware to update verification overall status
attendanceSchema.pre('save', function(next) {
  const results = this.verificationResults;
  const allVerified = results.locationVerified && 
                     results.faceVerified && 
                     results.timeVerified;
  
  const hasHighSeverityFlags = this.flags.some(flag => 
    ['high', 'critical'].includes(flag.severity)
  );

  if (hasHighSeverityFlags) {
    results.overallStatus = 'flagged';
  } else if (allVerified) {
    results.overallStatus = 'verified';
  } else if (results.locationVerified || results.faceVerified || results.timeVerified) {
    results.overallStatus = 'pending';
  } else {
    results.overallStatus = 'failed';
  }
  
  next();
});

// Instance method to add flag
attendanceSchema.methods.addFlag = function(type, description, severity = 'medium') {
  this.flags.push({
    type,
    description,
    severity,
    timestamp: new Date()
  });
  
  // Don't save automatically - let the caller handle saving
  // return this.save();
};

// Instance method to verify location
attendanceSchema.methods.verifyLocation = function(teacherDistance, collegeDistance, maxTeacherDistance, maxCollegeDistance) {
  this.distanceFromTeacher = teacherDistance;
  this.distanceFromCollege = collegeDistance;
  
  const withinTeacherRange = teacherDistance <= maxTeacherDistance;
  const withinCollegeRange = collegeDistance <= maxCollegeDistance;
  
  this.verificationResults.locationVerified = withinTeacherRange && withinCollegeRange;
  
  if (!withinTeacherRange) {
    this.addFlag(
      'suspicious_location',
      `Student is ${teacherDistance.toFixed(2)}m away from teacher (max: ${maxTeacherDistance}m)`,
      teacherDistance > maxTeacherDistance * 2 ? 'high' : 'medium'
    );
  }
  
  if (!withinCollegeRange) {
    this.addFlag(
      'suspicious_location',
      `Student is ${collegeDistance.toFixed(2)}m away from college (max: ${maxCollegeDistance}m)`,
      'critical'
    );
  }
  
  return this.verificationResults.locationVerified;
};

// Instance method to verify face
attendanceSchema.methods.verifyFace = function(confidence, livenessResult) {
  this.faceVerification.confidence = confidence;
  this.faceVerification.livenessCheck = livenessResult;
  
  const minimumConfidence = 0.65; // Match the face recognition service threshold
  const faceMatched = confidence >= minimumConfidence;
  // Check for isLive property (from production service) or passed property (legacy)
  const livenessOk = livenessResult && (livenessResult.isLive || livenessResult.passed);
  
  this.faceVerification.isVerified = faceMatched && livenessOk;
  this.verificationResults.faceVerified = this.faceVerification.isVerified;
  
  if (!faceMatched) {
    this.addFlag(
      'face_mismatch',
      `Face recognition confidence too low: ${(confidence * 100).toFixed(1)}% (minimum required: 65%)`,
      confidence < 0.3 ? 'high' : 'medium'
    );
  }
  
  if (!livenessOk) {
    this.addFlag(
      'face_liveness_failed',
      `Liveness check failed: ${livenessResult ? 'score ' + (livenessResult.score * 100).toFixed(1) + '%' : 'no liveness data'}`,
      'high'
    );
  }
  
  return this.verificationResults.faceVerified;
};

// Instance method to verify timing
attendanceSchema.methods.verifyTiming = function(classStartTime, windowBefore = 15, windowAfter = 15) {
  this.classStartTime = classStartTime;
  
  const submissionTime = this.attendanceSubmissionTime || this.timestamp;
  const windowStart = new Date(classStartTime.getTime() - (windowBefore * 60 * 1000));
  const windowEnd = new Date(classStartTime.getTime() + (windowAfter * 60 * 1000));
  
  const withinWindow = submissionTime >= windowStart && submissionTime <= windowEnd;
  this.verificationResults.timeVerified = withinWindow;
  
  if (!withinWindow) {
    const minutesDiff = Math.abs((submissionTime - classStartTime) / (1000 * 60));
    this.addFlag(
      'unusual_time',
      `Attendance submitted ${minutesDiff.toFixed(1)} minutes ${submissionTime > classStartTime ? 'after' : 'before'} class started`,
      minutesDiff > 60 ? 'high' : 'medium'
    );
  }
  
  return this.verificationResults.timeVerified;
};

// Static method to get attendance statistics
attendanceSchema.statics.getStatistics = async function(filters = {}) {
  const pipeline = [];
  
  // Match stage
  if (Object.keys(filters).length > 0) {
    pipeline.push({ $match: filters });
  }
  
  // Group and calculate statistics
  pipeline.push({
    $group: {
      _id: null,
      totalRecords: { $sum: 1 },
      presentCount: { 
        $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } 
      },
      lateCount: { 
        $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } 
      },
      absentCount: { 
        $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } 
      },
      flaggedCount: { 
        $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] } 
      },
      verifiedCount: { 
        $sum: { $cond: [{ $eq: ['$verificationResults.overallStatus', 'verified'] }, 1, 0] } 
      },
      averageDistanceFromTeacher: { $avg: '$distanceFromTeacher' },
      averageConfidence: { $avg: '$faceVerification.confidence' }
    }
  });
  
  const result = await this.aggregate(pipeline);
  
  if (result.length === 0) {
    return {
      totalRecords: 0,
      attendanceRate: 0,
      verificationRate: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      flaggedCount: 0
    };
  }
  
  const stats = result[0];
  const attendanceRate = ((stats.presentCount + stats.lateCount) / stats.totalRecords) * 100;
  const verificationRate = (stats.verifiedCount / stats.totalRecords) * 100;
  
  return {
    ...stats,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    verificationRate: Math.round(verificationRate * 100) / 100
  };
};

// Static method to find duplicate attempts
attendanceSchema.statics.findDuplicateAttempts = function(studentId, classId, timeWindow = 5) {
  const windowStart = new Date(Date.now() - (timeWindow * 60 * 1000));
  
  return this.find({
    studentId,
    classId,
    timestamp: { $gte: windowStart },
    isActive: true
  }).sort({ timestamp: -1 });
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
