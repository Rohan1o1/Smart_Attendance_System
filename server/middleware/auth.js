const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const config = require('../config');

/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

/**
 * Generate JWT token for user
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @returns {String} JWT token
 */
const generateToken = (userId, role) => {
  const payload = {
    userId,
    role,
    iat: Date.now()
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

/**
 * Generate refresh token
 * @param {String} userId - User ID
 * @returns {String} Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
    iat: Date.now()
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpire
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = async (token) => {
  try {
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Main authentication middleware
 * Protects routes by verifying JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = await verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists. Please login again.'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.'
      });
    }

    // Check if user account is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Authorization middleware
 * Restricts access based on user roles
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error.message);
      return res.status(403).json({
        success: false,
        message: 'Authorization failed.'
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (token) {
      try {
        const decoded = await verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive && !user.isLocked) {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
        // Token invalid, but continue without user
        console.log('Optional auth token invalid:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error.message);
    next();
  }
};

/**
 * Middleware to check if user owns the resource
 * @param {String} resourceField - Field name to check ownership (default: 'userId')
 */
const checkResourceOwnership = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params[resourceField];
      const userId = req.user._id.toString();

      // Admins can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Teachers can access resources of their students
      if (req.user.role === 'teacher') {
        // Additional logic can be added here to check teacher-student relationships
        return next();
      }

      // Students can only access their own resources
      if (req.user.role === 'student' && resourceId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error.message);
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }
  };
};

/**
 * Middleware to validate token freshness
 * Checks if token was issued recently for sensitive operations
 * @param {Number} maxAgeMinutes - Maximum age of token in minutes
 */
const requireFreshToken = (maxAgeMinutes = 30) => {
  return async (req, res, next) => {
    try {
      const token = req.token;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Fresh token required.'
        });
      }

      const decoded = jwt.decode(token);
      const tokenAge = (Date.now() - decoded.iat) / (1000 * 60); // Age in minutes

      if (tokenAge > maxAgeMinutes) {
        return res.status(401).json({
          success: false,
          message: `Token too old. Please re-authenticate. Max age: ${maxAgeMinutes} minutes.`
        });
      }

      next();
    } catch (error) {
      console.error('Fresh token validation error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token validation failed.'
      });
    }
  };
};

/**
 * Middleware to check specific permissions
 * @param {Array} permissions - Array of required permissions
 */
const checkPermissions = (permissions = []) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;
      
      // Define role-based permissions
      const rolePermissions = {
        admin: [
          'create_user',
          'read_user',
          'update_user',
          'delete_user',
          'create_class',
          'read_class',
          'update_class',
          'delete_class',
          'read_attendance',
          'update_attendance',
          'view_reports',
          'manage_system'
        ],
        teacher: [
          'create_class',
          'read_class',
          'update_class',
          'read_attendance',
          'update_attendance',
          'start_session',
          'end_session'
        ],
        student: [
          'read_own_profile',
          'update_own_profile',
          'submit_attendance',
          'read_own_attendance'
        ]
      };

      const userPermissions = rolePermissions[userRole] || [];
      const hasRequiredPermissions = permissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${permissions.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error.message);
      return res.status(403).json({
        success: false,
        message: 'Permission validation failed.'
      });
    }
  };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  checkResourceOwnership,
  requireFreshToken,
  checkPermissions
};
