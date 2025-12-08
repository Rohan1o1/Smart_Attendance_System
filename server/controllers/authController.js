const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const config = require('../config');

/**
 * Authentication Controller
 * Handles user registration, login, and related authentication operations
 */

/**
 * Register a new user
 * POST /auth/register
 */
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role,
      department,
      semester,
      studentId,
      employeeId
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user data object
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phoneNumber,
      role
    };

    // Add role-specific fields
    if (role === 'student') {
      userData.department = department;
      userData.semester = semester;
      
      // Generate student ID if not provided
      if (studentId) {
        // Check if student ID is already taken
        const existingStudent = await User.findOne({ studentId, role: 'student' });
        if (existingStudent) {
          return res.status(400).json({
            success: false,
            message: 'Student ID already exists'
          });
        }
        userData.studentId = studentId;
      } else {
        userData.studentId = await User.generateStudentId(department);
      }
    }

    if (role === 'teacher') {
      userData.department = department;
      
      // Generate employee ID if not provided
      if (employeeId) {
        // Check if employee ID is already taken
        const existingTeacher = await User.findOne({ employeeId, role: 'teacher' });
        if (existingTeacher) {
          return res.status(400).json({
            success: false,
            message: 'Employee ID already exists'
          });
        }
        userData.employeeId = employeeId;
      } else {
        userData.employeeId = await User.generateEmployeeId(department);
      }
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from user object
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
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
      message: 'Internal server error during registration'
    });
  }
};

/**
 * Login user
 * POST /auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);
    console.log('Password length:', password ? password.length : 'undefined');

    // Find user by credentials
    const user = await User.findByCredentials(email, password);

    console.log('User found:', user.email, 'Role:', user.role);

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    await user.updateOne({ lastLogin: new Date() });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken: token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    res.status(401).json({
      success: false,
      message: error.message || 'Invalid email or password'
    });
  }
};

/**
 * Get current user profile
 * GET /auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
};

/**
 * Update user profile
 * PUT /auth/me
 */
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber'];
    
    // Add role-specific allowed updates
    if (req.user.role === 'student') {
      allowedUpdates.push('semester');
    }

    // Filter out non-allowed updates
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
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
      message: 'Failed to update profile'
    });
  }
};

/**
 * Change password
 * PUT /auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

/**
 * Refresh authentication token
 * POST /auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const { verifyToken } = require('../middleware/auth');
    const decoded = await verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token type'
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

/**
 * Logout user
 * POST /auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a production environment, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
};

/**
 * Get user statistics (for admins)
 * GET /auth/stats
 */
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments({ isActive: true });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        recentUsers,
        roleDistribution: stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
};

/**
 * Deactivate user account (for admins)
 * PUT /auth/deactivate/:id
 */
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: req.user._id,
        deactivationReason: reason
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User account deactivated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user account'
    });
  }
};

/**
 * Reactivate user account (for admins)
 * PUT /auth/reactivate/:id
 */
const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { 
        isActive: true,
        $unset: { deactivatedAt: 1, deactivatedBy: 1, deactivationReason: 1 }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User account reactivated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate user account'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  getUserStats,
  deactivateUser,
  reactivateUser
};
