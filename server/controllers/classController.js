const Class = require('../models/Class');
const User = require('../models/User');
const { locationService } = require('../services');
const config = require('../config');
const mongoose = require('mongoose');

/**
 * Class Controller
 * Handles class creation, session management, and enrollment
 */

/**
 * Create a new class
 * POST /class/create
 */
const createClass = async (req, res) => {
  try {
    const {
      subject,
      subjectCode,
      department,
      semester,
      academicYear,
      schedule,
      geofenceRadius,
      classroom,
      description
    } = req.body;

    // Determine teacher for the class
    let teacherId = req.user._id;

    // If admin is creating the class, allow specifying teacherId in body
    if (req.user.role === 'admin' && req.body.teacherId) {
      teacherId = req.body.teacherId;
    }

    // Only teachers or admins may create classes
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers or admins can create classes'
      });
    }

    // Generate class ID
    const classId = await Class.generateClassId(subjectCode, academicYear, semester);

    // Create class object
    const classData = {
      classId,
      subject,
      subjectCode: subjectCode.toUpperCase(),
      teacherId,
      teacherName: `${req.user.firstName} ${req.user.lastName}`,
      department,
      semester,
      academicYear,
      schedule,
      geofenceRadius: geofenceRadius || 20,
      classroom,
      description,
      createdBy: teacherId
    };

    const newClass = new Class(classData);
    await newClass.save();

    // Populate teacher information
    await newClass.populate('teacherId', 'firstName lastName email employeeId');

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: { class: newClass }
    });

  } catch (error) {
    console.error('Create class error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Class with this ID already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create class'
    });
  }
};

/**
 * Get classes for teacher
 * GET /class/my-classes
 */
const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { page = 1, limit = 10, status, academicYear } = req.query;

    // Build query
    const query = {
      teacherId,
      isActive: true
    };

    if (status) {
      query.status = status;
    }

    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const classes = await Class.find(query)
      .populate('teacherId', 'firstName lastName email')
      .populate('enrolledStudents.studentId', 'firstName lastName studentId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalClasses = await Class.countDocuments(query);
    const totalPages = Math.ceil(totalClasses / parseInt(limit));

    res.json({
      success: true,
      data: {
        classes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalClasses,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes'
    });
  }
};

/**
 * Get classes for student
 * GET /class/enrolled
 */
const getEnrolledClasses = async (req, res) => {
  try {
    const studentId = req.user._id;

    // First try to find classes where the student is explicitly enrolled
    // Be defensive: enrolledStudents.studentId may be stored as ObjectId or string
    const tryObjectId = (() => {
      try { return mongoose.Types.ObjectId(studentId); } catch (e) { return null; }
    })();

    const orConditions = [];
    if (tryObjectId) orConditions.push({ 'enrolledStudents.studentId': tryObjectId });
    orConditions.push({ 'enrolledStudents.studentId': String(studentId) });

    let classes = await Class.find({
      isActive: true,
      'enrolledStudents.status': 'enrolled',
      $or: orConditions
    })
    .populate('teacherId', 'firstName lastName email employeeId')
    .sort({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });

    console.debug(`getEnrolledClasses: studentId=${studentId} matched explicit enrollments: ${classes.length}`);

    // If no enrolled classes found, or the client requested a department/semester/section filter,
    // return classes that match the student's assignment (department/semester/section).
    const { department, semester, section } = req.query;
    const hasFilterParams = !!(department || semester || section);

    if ((classes.length === 0) || hasFilterParams) {
      const filterDepartment = department || req.user.department;
      const filterSemester = semester || req.user.semester;
      const filterSection = section || req.user.section;

      const filterQuery = { isActive: true };
      if (filterDepartment) filterQuery.department = filterDepartment;
      if (filterSemester) filterQuery.semester = parseInt(filterSemester);
      if (filterSection) filterQuery.section = filterSection;

      // Find classes matching the assignment. Note: these are available classes, not necessarily enrolled.
      classes = await Class.find(filterQuery)
        .populate('teacherId', 'firstName lastName email employeeId')
        .sort({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });
    }

    res.json({
      success: true,
      data: { classes }
    });

  } catch (error) {
    console.error('Get enrolled classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled classes'
    });
  }
};

/**
 * Start class session
 * POST /class/:id/start
 */
const startClassSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.body;
    const teacherId = req.user._id;

    const classObj = await Class.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not authorized'
      });
    }

    // Check if class is already active
    if (classObj.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Class session is already active'
      });
    }

    // Validate college geofence
    // Validate college geofence
    console.debug('StartClassSession: received location for validation:', location);
    const collegeValidation = locationService.validateCollegeGeofence(location);
    console.debug('StartClassSession: collegeValidation result:', collegeValidation);
    if (!collegeValidation.passed) {
      return res.status(400).json({
        success: false,
        message: 'Teacher must be within college premises to start class',
        locationError: collegeValidation.message,
        details: collegeValidation
      });
    }

    // Start session
    await classObj.startSession(location);

    res.json({
      success: true,
      message: 'Class session started successfully',
      data: {
        class: classObj,
        attendanceWindow: classObj.attendanceWindowTimes
      }
    });

  } catch (error) {
    console.error('Start class session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start class session'
    });
  }
};

/**
 * End class session
 * POST /class/:id/end
 */
const endClassSession = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user._id;

    const classObj = await Class.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not authorized'
      });
    }

    if (classObj.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Class session is not active'
      });
    }

    // End session
    await classObj.endSession();

    res.json({
      success: true,
      message: 'Class session ended successfully',
      data: {
        class: classObj,
        sessionDuration: classObj.currentSessionDuration
      }
    });

  } catch (error) {
    console.error('End class session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end class session'
    });
  }
};

/**
 * Get active classes
 * GET /class/active
 */
const getActiveClasses = async (req, res) => {
  try {
    const { role } = req.user;
    let query = { status: 'active', isActive: true };

    // If teacher, only show their classes
    if (role === 'teacher') {
      query.teacherId = req.user._id;
    }

    // If student, only show classes they're enrolled in
    if (role === 'student') {
      query['enrolledStudents.studentId'] = req.user._id;
      query['enrolledStudents.status'] = 'enrolled';
    }

    const classes = await Class.find(query)
      .populate('teacherId', 'firstName lastName email employeeId')
      .sort({ sessionStartTime: -1 });

    res.json({
      success: true,
      data: { classes }
    });

  } catch (error) {
    console.error('Get active classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active classes'
    });
  }
};

/**
 * Enroll students in class
 * POST /class/:id/enroll
 */
const enrollStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;
    const teacherId = req.user._id;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }

    const classObj = await Class.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not authorized'
      });
    }

    // Verify all students exist and have student role
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      isActive: true
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some student IDs are invalid or inactive'
      });
    }

    // Enroll students
    const enrollmentResults = [];
    for (const student of students) {
      try {
        await classObj.enrollStudent(student._id);
        enrollmentResults.push({
          studentId: student._id,
          name: `${student.firstName} ${student.lastName}`,
          status: 'enrolled'
        });
      } catch (error) {
        enrollmentResults.push({
          studentId: student._id,
          name: `${student.firstName} ${student.lastName}`,
          status: 'failed',
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Student enrollment processed',
      data: {
        enrollmentResults,
        totalStudents: classObj.statistics.totalStudents
      }
    });

  } catch (error) {
    console.error('Enroll students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll students'
    });
  }
};

/**
 * Drop student from class
 * DELETE /class/:id/students/:studentId
 */
const dropStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const teacherId = req.user._id;

    const classObj = await Class.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not authorized'
      });
    }

    await classObj.dropStudent(studentId);

    res.json({
      success: true,
      message: 'Student dropped from class successfully',
      data: {
        totalStudents: classObj.statistics.totalStudents
      }
    });

  } catch (error) {
    console.error('Drop student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to drop student'
    });
  }
};

/**
 * Update class details
 * PUT /class/:id
 */
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const teacherId = req.user._id;

    // Remove fields that shouldn't be updated directly
    const restrictedFields = ['classId', 'teacherId', 'teacherName', 'createdBy', 'statistics'];
    restrictedFields.forEach(field => delete updates[field]);

    const classObj = await Class.findOneAndUpdate(
      {
        _id: id,
        teacherId,
        isActive: true
      },
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate('teacherId', 'firstName lastName email');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not authorized'
      });
    }

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: { class: classObj }
    });

  } catch (error) {
    console.error('Update class error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update class'
    });
  }
};

/**
 * Delete class
 * DELETE /class/:id
 */
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user._id;

    const classObj = await Class.findOne({
      _id: id,
      teacherId,
      isActive: true
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not authorized'
      });
    }

    // Soft delete by setting isActive to false
    classObj.isActive = false;
    classObj.status = 'cancelled';
    await classObj.save();

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete class'
    });
  }
};

/**
 * Get class details
 * GET /class/:id
 */
const getClassDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id: userId, role } = req.user;

    let query = { _id: id, isActive: true };

    // Add role-based access control
    if (role === 'teacher') {
      query.teacherId = userId;
    } else if (role === 'student') {
      query['enrolledStudents.studentId'] = userId;
      query['enrolledStudents.status'] = 'enrolled';
    }

    const classObj = await Class.findOne(query)
      .populate('teacherId', 'firstName lastName email employeeId')
      .populate('enrolledStudents.studentId', 'firstName lastName studentId email');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not authorized'
      });
    }

    res.json({
      success: true,
      data: { class: classObj }
    });

  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class details'
    });
  }
};

module.exports = {
  createClass,
  getTeacherClasses,
  getEnrolledClasses,
  startClassSession,
  endClassSession,
  getActiveClasses,
  enrollStudents,
  dropStudent,
  updateClass,
  deleteClass,
  getClassDetails
};
