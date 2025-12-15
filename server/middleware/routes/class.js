const express = require('express');
const { classController } = require('../controllers');
const { 
  authenticate, 
  authorize,
  validate,
  classCreationSchema,
  startSessionSchema,
  studentEnrollmentSchema,
  idParameterSchema,
  paginationSchema
} = require('../middleware');

const router = express.Router();

/**
 * Class Management Routes
 */

// @route   POST /class/create
// @desc    Create a new class
// @access  Private (Teacher, Admin)
router.post('/create', 
  authenticate,
  authorize('teacher', 'admin'),
  validate(classCreationSchema),
  classController.createClass
);

// @route   GET /class/my-classes
// @desc    Get classes for teacher
// @access  Private (Teacher)
router.get('/my-classes', 
  authenticate,
  authorize('teacher'),
  validate(paginationSchema, 'query'),
  classController.getTeacherClasses
);

// @route   GET /class/enrolled
// @desc    Get enrolled classes for student
// @access  Private (Student)
router.get('/enrolled', 
  authenticate,
  authorize('student'),
  classController.getEnrolledClasses
);

// @route   GET /class/active
// @desc    Get active classes
// @access  Private
router.get('/active', 
  authenticate,
  classController.getActiveClasses
);

// @route   GET /class/:id
// @desc    Get class details
// @access  Private
router.get('/:id', 
  authenticate,
  validate(idParameterSchema, 'params'),
  classController.getClassDetails
);

// @route   PUT /class/:id
// @desc    Update class details
// @access  Private (Teacher, Admin)
router.put('/:id', 
  authenticate,
  authorize('teacher', 'admin'),
  validate(idParameterSchema, 'params'),
  classController.updateClass
);

// @route   DELETE /class/:id
// @desc    Delete class
// @access  Private (Teacher, Admin)
router.delete('/:id', 
  authenticate,
  authorize('teacher', 'admin'),
  validate(idParameterSchema, 'params'),
  classController.deleteClass
);

// Class Session Management

// @route   POST /class/:id/start
// @desc    Start class session
// @access  Private (Teacher)
router.post('/:id/start', 
  authenticate,
  authorize('teacher'),
  validate(idParameterSchema, 'params'),
  validate(startSessionSchema),
  classController.startClassSession
);

// @route   POST /class/:id/end
// @desc    End class session
// @access  Private (Teacher)
router.post('/:id/end', 
  authenticate,
  authorize('teacher'),
  validate(idParameterSchema, 'params'),
  classController.endClassSession
);

// Student Enrollment Management

// @route   POST /class/:id/enroll
// @desc    Enroll students in class
// @access  Private (Teacher, Admin)
router.post('/:id/enroll', 
  authenticate,
  authorize('teacher', 'admin'),
  validate(idParameterSchema, 'params'),
  validate(studentEnrollmentSchema),
  classController.enrollStudents
);

// @route   DELETE /class/:id/students/:studentId
// @desc    Drop student from class
// @access  Private (Teacher, Admin)
router.delete('/:id/students/:studentId', 
  authenticate,
  authorize('teacher', 'admin'),
  validate(idParameterSchema, 'params'),
  classController.dropStudent
);

module.exports = router;
