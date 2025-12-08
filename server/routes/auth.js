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

// Admin only routes

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
