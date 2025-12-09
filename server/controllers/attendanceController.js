const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const User = require('../models/User');
const { faceRecognitionService, locationService } = require('../services');
const config = require('../config');

/**
 * Attendance Controller
 * Handles attendance submission, verification, and management
 */

/**
 * Submit attendance for a class
 * POST /attendance/submit
 */
const submitAttendance = async (req, res) => {
  try {
    const {
      classId,
      location,
      faceImage,
      deviceInfo
    } = req.body;

    const studentId = req.user._id;
    const student = req.user;

    // Validate required fields
    if (!classId || !location || !faceImage) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, location, and face image are required'
      });
    }

    // Check if face recognition service is ready
    if (!faceRecognitionService.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Face recognition service is not ready. Please try again later.'
      });
    }

    // Find and validate class
    const classObj = await Class.findOne({
      _id: classId,
      'enrolledStudents.studentId': studentId,
      'enrolledStudents.status': 'enrolled',
      isActive: true
    }).populate('teacherId', 'firstName lastName');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not enrolled'
      });
    }

    // Check if attendance window is open
    const attendanceWindowCheck = classObj.isAttendanceAllowed();
    if (!attendanceWindowCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: attendanceWindowCheck.reason,
        windowInfo: {
          windowStart: attendanceWindowCheck.windowStart,
          windowEnd: attendanceWindowCheck.windowEnd
        }
      });
    }

    // Check for duplicate attendance
    const existingAttendance = await Attendance.findOne({
      studentId,
      classId,
      attendanceDate: new Date().toISOString().split('T')[0],
      isActive: true
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already submitted for this class today',
        existingAttendance: {
          status: existingAttendance.status,
          timestamp: existingAttendance.timestamp
        }
      });
    }

    // Check for multiple recent attempts (prevent spamming)
    const recentAttempts = await Attendance.findDuplicateAttempts(studentId, classId, 5);
    if (recentAttempts.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many attendance attempts. Please wait 5 minutes before trying again.'
      });
    }

    // Create attendance record
    const attendanceData = {
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      studentRollNumber: student.studentId,
      classId,
      className: classObj.subject,
      subjectCode: classObj.subjectCode,
      teacherId: classObj.teacherId._id,
      status: 'present', // Will be updated after verification
      timestamp: new Date(),
      classStartTime: classObj.sessionStartTime,
      attendanceSubmissionTime: new Date(),
      studentLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.address,
        capturedAt: new Date()
      },
      teacherLocation: {
        latitude: classObj.teacherLocation.latitude,
        longitude: classObj.teacherLocation.longitude
      },
      academicYear: classObj.academicYear,
      semester: classObj.semester,
      department: classObj.department,
      deviceInfo: deviceInfo || {}
    };

    const attendance = new Attendance(attendanceData);

    // Perform verifications
    const verificationResults = {
      locationVerified: false,
      faceVerified: false,
      timeVerified: false
    };

    // 1. Location Verification
    try {
      const locationValidation = locationService.validateStudentLocation(
        location,
        classObj.teacherLocation,
        {
          requireCollegeGeofence: true,
          requireTeacherProximity: true,
          customTeacherRadius: classObj.geofenceRadius
        }
      );

      const collegeCheck = locationValidation.validations.collegeGeofence;
      const teacherCheck = locationValidation.validations.teacherProximity;

      attendance.distanceFromTeacher = teacherCheck?.distance || 0;
      attendance.distanceFromCollege = collegeCheck?.distance || 0;

      verificationResults.locationVerified = attendance.verifyLocation(
        teacherCheck?.distance || 0,
        collegeCheck?.distance || 0,
        classObj.geofenceRadius,
        config.geolocation.college.radius
      );

      // Check for GPS spoofing
      const spoofingCheck = locationService.detectGPSSpoofing(
        location,
        deviceInfo
      );

      if (spoofingCheck.isPotentialSpoof) {
        attendance.addFlag(
          'fake_gps',
          `Potential GPS spoofing detected. Risk score: ${spoofingCheck.riskScore}`,
          spoofingCheck.riskLevel === 'critical' ? 'critical' : 'high'
        );
      }

    } catch (error) {
      console.error('Location verification error:', error);
      attendance.addFlag(
        'suspicious_location',
        'Failed to verify location: ' + error.message,
        'medium'
      );
    }

    // 2. Face Verification
    try {
      // Get user's registered face embeddings
      const userWithFaces = await User.findById(studentId);
      if (!userWithFaces.faceEmbeddings || userWithFaces.faceEmbeddings.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No face images registered. Please register your face first.'
        });
      }

      // Validate image quality
      const qualityValidation = await faceRecognitionService.validateImageQuality(faceImage);
      if (!qualityValidation.isValid) {
        attendance.addFlag(
          'face_mismatch',
          qualityValidation.reason,
          'medium'
        );
      }

      // Extract face embedding and perform liveness check
      const embeddingResult = await faceRecognitionService.extractFaceEmbedding(faceImage);
      
      // Check if face extraction was successful
      if (!embeddingResult.success) {
        console.log('❌ Face extraction failed:', embeddingResult.error);
        attendance.addFlag(
          'face_mismatch',
          `Face verification failed: ${embeddingResult.error}`,
          'high'
        );
        
        // Set face verification to false and continue with other checks
        verificationResults.faceVerified = false;
        
        // Note: Not adding suggestions flag as it's not a valid enum type
        // The error message is already captured in the face_mismatch flag above
      } else {
        // Face extraction successful, proceed with matching
        console.log('✅ Face extraction successful, proceeding with matching');
        
        // Extract actual embedding arrays from stored face embedding objects
        // Stored format: { embedding: [...], imageUrl: '...', createdAt: '...' }
        const storedEmbeddingArrays = userWithFaces.faceEmbeddings.map(fe => {
          // Handle both formats: direct array or object with embedding property
          if (Array.isArray(fe)) {
            return fe;
          } else if (fe.embedding && Array.isArray(fe.embedding)) {
            return fe.embedding;
          } else {
            console.warn('⚠️ Invalid face embedding format:', typeof fe);
            return null;
          }
        }).filter(e => e !== null);
        
        console.log(`📊 Found ${storedEmbeddingArrays.length} valid stored embeddings for comparison`);
        
        // Compare with registered faces (findBestMatch is async)
        const matchResult = await faceRecognitionService.findBestMatch(
          embeddingResult.embedding,
          storedEmbeddingArrays
        );

        console.log(`🔍 Face matching result: similarity=${matchResult.bestSimilarity?.toFixed(3) || 0}, isMatch=${matchResult.isMatch}`);

        // Save face image (optional - for audit trail)
        attendance.faceVerification.faceImageUrl = `data:image/jpeg;base64,${faceImage}`;

        verificationResults.faceVerified = attendance.verifyFace(
          matchResult.bestSimilarity,
          embeddingResult.livenessCheck
        );
        
        // Add detailed logs for face verification result
        if (verificationResults.faceVerified) {
          console.log('✅ Face verification passed');
        } else {
          console.log('❌ Face verification failed');
          attendance.addFlag(
            'face_mismatch',
            `Face does not match registered faces (similarity: ${matchResult.bestSimilarity.toFixed(3)})`,
            'high'
          );
        }
      }

    } catch (error) {
      console.error('Face verification error:', error);
      attendance.addFlag(
        'face_mismatch',
        'Failed to verify face: ' + error.message,
        'high'
      );
    }

    // 3. Time Verification
    verificationResults.timeVerified = attendance.verifyTiming(
      classObj.sessionStartTime,
      classObj.attendanceWindow.beforeMinutes,
      classObj.attendanceWindow.afterMinutes
    );

    // CRITICAL: Reject attendance if face verification fails
    // This ensures only the registered student can mark attendance
    if (!verificationResults.faceVerified) {
      console.log('❌ Attendance REJECTED - Face verification failed');
      return res.status(403).json({
        success: false,
        message: 'Face verification failed. Your face does not match the registered face.',
        verificationResults: {
          faceVerified: false,
          locationVerified: verificationResults.locationVerified,
          timeVerified: verificationResults.timeVerified
        },
        suggestions: [
          'Ensure good lighting on your face',
          'Look directly at the camera',
          'Remove any obstructions (glasses, mask, etc.)',
          'Make sure only your face is visible in the frame',
          'If problem persists, re-register your face'
        ]
      });
    }

    // Determine final status based on verifications
    const allVerified = verificationResults.locationVerified && 
                       verificationResults.faceVerified && 
                       verificationResults.timeVerified;

    const hasHighSeverityFlags = attendance.flags.some(flag => 
      ['high', 'critical'].includes(flag.severity)
    );

    if (hasHighSeverityFlags) {
      attendance.status = 'flagged';
    } else if (allVerified) {
      attendance.status = attendance.minutesLate > 15 ? 'late' : 'present';
    } else {
      attendance.status = 'flagged';
    }

    // Save attendance record
    await attendance.save();

    // Create response
    const responseData = {
      attendanceId: attendance._id,
      status: attendance.status,
      verificationResults: attendance.verificationSummary,
      timestamp: attendance.timestamp,
      flags: attendance.flags.length > 0 ? attendance.flags : undefined,
      distanceFromTeacher: Math.round(attendance.distanceFromTeacher * 100) / 100,
      distanceFromCollege: Math.round(attendance.distanceFromCollege * 100) / 100,
      minutesLate: attendance.minutesLate
    };

    // Log attendance submission
    console.log(`Attendance submitted for student ${studentId} in class ${classId}: ${attendance.status}`);

    res.status(201).json({
      success: true,
      message: 'Attendance submitted successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Submit attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit attendance',
      error: config.server.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get student's attendance history
 * GET /attendance/student/:studentId
 */
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10, classId, startDate, endDate, status } = req.query;

    // Authorization check
    const requesterId = req.user._id;
    const requesterRole = req.user.role;

    if (requesterRole === 'student' && requesterId.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Students can only view their own attendance'
      });
    }

    // Build query
    const query = {
      studentId,
      isActive: true
    };

    if (classId) query.classId = classId;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendanceRecords = await Attendance.find(query)
      .populate('classId', 'subject subjectCode classroom')
      .populate('teacherId', 'firstName lastName')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalRecords = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    // Calculate statistics
    const stats = await Attendance.getStatistics({ studentId });

    res.json({
      success: true,
      data: {
        attendanceRecords,
        statistics: stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records'
    });
  }
};

/**
 * Get class attendance report
 * GET /attendance/class/:classId
 */
const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, page = 1, limit = 50 } = req.query;

    // Verify access to class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Authorization check
    const userId = req.user._id;
    const userRole = req.user.role;

    if (userRole === 'teacher' && classObj.teacherId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view attendance for your own classes'
      });
    }

    // Build query
    const query = { classId, isActive: true };
    
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.timestamp = {
        $gte: targetDate,
        $lt: nextDay
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'firstName lastName studentId email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalRecords = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    // Get enrolled students for comparison
    const enrolledStudents = classObj.enrolledStudents.filter(
      enrollment => enrollment.status === 'enrolled'
    );

    // Calculate attendance statistics
    const stats = await Attendance.getStatistics({ classId });

    // Find absent students (if date is specified)
    let absentStudents = [];
    if (date) {
      const presentStudentIds = attendanceRecords
        .filter(record => ['present', 'late'].includes(record.status))
        .map(record => record.studentId._id.toString());

      absentStudents = enrolledStudents
        .filter(enrollment => !presentStudentIds.includes(enrollment.studentId.toString()))
        .map(enrollment => enrollment.studentId);

      // Populate absent student details
      await User.populate(absentStudents, { path: '', select: 'firstName lastName studentId email' });
    }

    res.json({
      success: true,
      data: {
        class: {
          _id: classObj._id,
          subject: classObj.subject,
          subjectCode: classObj.subjectCode,
          teacher: classObj.teacherName
        },
        attendanceRecords,
        absentStudents,
        statistics: stats,
        summary: {
          totalEnrolled: enrolledStudents.length,
          totalPresent: attendanceRecords.filter(r => r.status === 'present').length,
          totalLate: attendanceRecords.filter(r => r.status === 'late').length,
          totalAbsent: absentStudents.length,
          totalFlagged: attendanceRecords.filter(r => r.status === 'flagged').length
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get class attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class attendance'
    });
  }
};

/**
 * Update attendance record (for teachers/admins)
 * PUT /attendance/:attendanceId
 */
const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const attendance = await Attendance.findById(attendanceId)
      .populate('classId', 'teacherId');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Authorization check
    if (userRole === 'teacher' && 
        attendance.classId.teacherId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update attendance for your own classes'
      });
    }

    // Store original status for override tracking
    const originalStatus = attendance.status;

    // Update attendance
    const updates = {};
    if (status && ['present', 'late', 'absent', 'excused'].includes(status)) {
      updates.status = status;
      
      // Track manual override
      if (originalStatus !== status) {
        updates.manualOverride = {
          isOverridden: true,
          overriddenBy: userId,
          overrideReason: notes || 'Manual status change by ' + userRole,
          overrideTimestamp: new Date(),
          originalStatus
        };
      }
    }

    if (notes) {
      updates.notes = notes;
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      updates,
      { new: true, runValidators: true }
    ).populate('studentId', 'firstName lastName studentId');

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: { attendance: updatedAttendance }
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record'
    });
  }
};

/**
 * Get attendance statistics for admin dashboard
 * GET /attendance/stats
 */
const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, department, semester } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    // Build additional filters
    const additionalFilters = {};
    if (department) additionalFilters.department = department;
    if (semester) additionalFilters.semester = parseInt(semester);

    const filters = { ...dateFilter, ...additionalFilters, isActive: true };

    // Get overall statistics
    const overallStats = await Attendance.getStatistics(filters);

    // Get daily attendance trends (last 30 days)
    const dailyTrends = await Attendance.aggregate([
      {
        $match: {
          timestamp: { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          },
          isActive: true
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } 
          },
          totalRecords: { $sum: 1 },
          presentCount: { 
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } 
          },
          lateCount: { 
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } 
          },
          flaggedCount: { 
            $sum: { $cond: [{ $eq: ["$status", "flagged"] }, 1, 0] } 
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Get department-wise statistics
    const departmentStats = await Attendance.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$department",
          totalRecords: { $sum: 1 },
          presentCount: { 
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } 
          },
          lateCount: { 
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } 
          },
          attendanceRate: {
            $avg: {
              $cond: [
                { $in: ["$status", ["present", "late"]] },
                100,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get flagged attendance records
    const flaggedRecords = await Attendance.find({
      ...filters,
      status: 'flagged'
    })
    .populate('studentId', 'firstName lastName studentId')
    .populate('classId', 'subject subjectCode')
    .sort({ timestamp: -1 })
    .limit(20);

    res.json({
      success: true,
      data: {
        overallStatistics: overallStats,
        dailyTrends,
        departmentStatistics: departmentStats,
        recentFlaggedRecords: flaggedRecords,
        filters: {
          dateRange: { startDate, endDate },
          department,
          semester
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics'
    });
  }
};

module.exports = {
  submitAttendance,
  getStudentAttendance,
  getClassAttendance,
  updateAttendance,
  getAttendanceStats
};
