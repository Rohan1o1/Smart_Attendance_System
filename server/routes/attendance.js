const express = require('express');
const { attendanceController } = require('../controllers');
const { 
  authenticate, 
  authorize,
  validate,
  attendanceSubmissionSchema,
  idParameterSchema,
  paginationSchema,
  dateRangeSchema,
  attendanceRateLimiter
} = require('../middleware');

const router = express.Router();

/**
 * Attendance Routes
 */

// @route   POST /attendance/submit
// @desc    Submit attendance for a class
// @access  Private (Student)
router.post('/submit', 
  authenticate,
  authorize('student'),
  attendanceRateLimiter,
  validate(attendanceSubmissionSchema),
  attendanceController.submitAttendance
);

// @route   GET /attendance/student/:studentId
// @desc    Get student's attendance history
// @access  Private (Student - own records, Teacher - own classes, Admin - all)
router.get('/student/:studentId', 
  authenticate,
  validate(idParameterSchema, 'params'),
  validate(paginationSchema, 'query'),
  validate(dateRangeSchema, 'query'),
  attendanceController.getStudentAttendance
);

// @route   GET /attendance/class/:classId
// @desc    Get class attendance report
// @access  Private (Teacher - own classes, Admin - all)
router.get('/class/:classId', 
  authenticate,
  authorize('teacher', 'admin'),
  validate(idParameterSchema, 'params'),
  validate(paginationSchema, 'query'),
  attendanceController.getClassAttendance
);

// @route   PUT /attendance/:attendanceId
// @desc    Update attendance record
// @access  Private (Teacher - own classes, Admin - all)
router.put('/:attendanceId', 
  authenticate,
  authorize('teacher', 'admin'),
  validate(idParameterSchema, 'params'),
  attendanceController.updateAttendance
);

// Admin Routes

// @route   GET /attendance/stats
// @desc    Get attendance statistics for admin dashboard
// @access  Private (Admin only)
router.get('/stats', 
  authenticate,
  authorize('admin'),
  validate(dateRangeSchema, 'query'),
  attendanceController.getAttendanceStats
);

module.exports = router;
