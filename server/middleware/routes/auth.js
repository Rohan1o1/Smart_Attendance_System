const express = require('express');
const { authController } = require('../controllers');
const { 
  authenticate, 
  authorize, 
  validate,
  userRegistrationSchema,
  userLoginSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  idParameterSchema,
  authRateLimiter
} = require('../middleware');

const router = express.Router();

/**
 * Authentication Routes
 */

// @route   POST /auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', 
  authRateLimiter,
  validate(userRegistrationSchema),
  authController.register
);

// @route   POST /auth/login
// @desc    Login user
// @access  Public
router.post('/login', 
  authRateLimiter,
  validate(userLoginSchema),
  authController.login
);

// @route   POST /auth/refresh
// @desc    Refresh authentication token
// @access  Public
router.post('/refresh', 
  authRateLimiter,
  authController.refreshToken
);

// @route   POST /auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', 
  authenticate,
  authController.logout
);

// @route   GET /auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', 
  authenticate,
  authController.getMe
);

// @route   PUT /auth/me
// @desc    Update user profile
// @access  Private
router.put('/me', 
  authenticate,
  validate(profileUpdateSchema),
  authController.updateProfile
);

// @route   PUT /auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', 
  authenticate,
  validate(passwordChangeSchema),
  authController.changePassword
);

// ============================
// Role-Specific Registration Routes
// ============================

// @route   POST /auth/register/admin
// @desc    Register a new Admin (Department Head) - requires NEW department
// @access  Public
router.post('/register/admin', 
  authRateLimiter,
  authController.registerAdmin
);

// @route   POST /auth/register/teacher
// @desc    Register a new Teacher - requires EXISTING department
// @access  Public
router.post('/register/teacher', 
  authRateLimiter,
  authController.registerTeacher
);

// @route   POST /auth/register/student
// @desc    Register a new Student - requires EXISTING department
// @access  Public
router.post('/register/student', 
  authRateLimiter,
  authController.registerStudent
);

// ============================
// Student Login (using rollNumber)
// ============================

// @route   POST /auth/login/student
// @desc    Student login using rollNumber + password
// @access  Public
router.post('/login/student', 
  authRateLimiter,
  authController.loginStudent
);

// ============================
// Department Routes
// ============================

// @route   GET /auth/departments
// @desc    Get all departments (for registration dropdowns)
// @access  Public
router.get('/departments', 
  authController.getDepartments
);

// ============================
// Admin Verification Routes
// ============================

// @route   GET /auth/admin/unverified
// @desc    Get all unverified users in admin's department
// @access  Private (Admin only)
router.get('/admin/unverified', 
  authenticate,
  authorize('admin'),
  authController.getUnverifiedUsers
);

// @route   PUT /auth/admin/verify/:id
// @desc    Verify a user (teacher/student) in admin's department
// @access  Private (Admin only)
router.put('/admin/verify/:id', 
  authenticate,
  authorize('admin'),
  validate(idParameterSchema, 'params'),
  authController.verifyUser
);

// @route   PUT /auth/admin/reject/:id
// @desc    Reject a user (teacher/student) in admin's department
// @access  Private (Admin only)
router.put('/admin/reject/:id',
  authenticate,
  authorize('admin'),
  validate(idParameterSchema, 'params'),
  authController.rejectUser
);

// @route   GET /auth/admin/users
// @desc    Get all users in admin's department
// @access  Private (Admin only)
router.get('/admin/users', 
  authenticate,
  authorize('admin'),
  authController.getDepartmentUsers
);

// @route   PUT /auth/admin/assign-teacher/:teacherId
// @desc    Assign teacher to year/section
// @access  Private (Admin only)
router.put('/admin/assign-teacher/:teacherId', 
  authenticate,
  authorize('admin'),
  authController.assignTeacher
);

// ============================
// SuperAdmin Routes
// ============================

// @route   GET /auth/superadmin/admins
// @desc    Get all admins
// @access  Private (SuperAdmin only)
router.get('/superadmin/admins', 
  authenticate,
  authorize('superadmin'),
  authController.getAllAdmins
);

// @route   POST /auth/superadmin/create-admin
// @desc    Create a new admin
// @access  Private (SuperAdmin only)
router.post('/superadmin/create-admin', 
  authenticate,
  authorize('superadmin'),
  authController.createAdmin
);

// @route   DELETE /auth/superadmin/admin/:id
// @desc    Delete (deactivate) an admin
// @access  Private (SuperAdmin only)
router.delete('/superadmin/admin/:id', 
  authenticate,
  authorize('superadmin'),
  validate(idParameterSchema, 'params'),
  authController.deleteAdmin
);

// @route   GET /auth/superadmin/users
// @desc    Get all users across all departments
// @access  Private (SuperAdmin only)
router.get('/superadmin/users', 
  authenticate,
  authorize('superadmin'),
  authController.getAllUsers
);

// @route   GET /auth/superadmin/stats
// @desc    Get system statistics
// @access  Private (SuperAdmin only)
router.get('/superadmin/stats', 
  authenticate,
  authorize('superadmin'),
  authController.getSystemStats
);

// ============================
// Admin Statistics Routes
// ============================

// @route   GET /auth/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/stats', 
  authenticate,
  authorize('admin'),
  authController.getUserStats
);

// @route   PUT /auth/deactivate/:id
// @desc    Deactivate user account
// @access  Private (Admin only)
router.put('/deactivate/:id', 
  authenticate,
  authorize('admin'),
  validate(idParameterSchema, 'params'),
  authController.deactivateUser
);

// @route   PUT /auth/reactivate/:id
// @desc    Reactivate user account
// @access  Private (Admin only)
router.put('/reactivate/:id', 
  authenticate,
  authorize('admin'),
  validate(idParameterSchema, 'params'),
  authController.reactivateUser
);

module.exports = router;
