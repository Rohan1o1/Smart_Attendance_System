const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('../config');

/**
 * Security Middleware Collection
 * Provides various security middlewares for the application
 */

/**
 * Rate limiting middleware
 * Prevents brute force attacks and API abuse
 */
const rateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(config.security.rateLimitWindowMs / 1000)
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased limit for development - allow 50 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Face upload rate limiter
 */
const faceUploadRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 face uploads per 5 minutes
  message: {
    success: false,
    message: 'Too many face upload attempts. Please try again in 5 minutes.'
  }
});

/**
 * Attendance submission rate limiter
 */
const attendanceRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // Limit to 3 attendance submissions per minute
  message: {
    success: false,
    message: 'Too many attendance submissions. Please wait a minute before trying again.'
  }
});

/**
 * Security headers middleware
 * Sets various security headers
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
});

/**
 * CORS headers middleware
 */
const corsHeaders = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite default
    'http://localhost:5176', // Vite current
    'http://localhost:5175', // Vite current
    'http://localhost:5174', // Vite fallback 1
    'http://localhost:5175', // Vite fallback 2
    config.security.corsOptions.origin
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

/**
 * Input sanitization middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Input sanitization error:', error.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid input format'
    });
  }
};

/**
 * Helper function to sanitize objects recursively
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip certain fields that should not be sanitized
    const skipFields = ['password', 'faceEmbedding', 'imageData'];
    
    if (skipFields.includes(key)) {
      sanitized[key] = value;
    } else {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
  }

  return sanitized;
};

/**
 * Helper function to sanitize strings
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .trim(); // Remove whitespace
};

/**
 * IP address validation middleware
 */
const validateIPAddress = (req, res, next) => {
  try {
    const clientIP = req.ip || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress || 
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);

    req.clientIP = clientIP;

    // Log suspicious patterns (optional)
    const suspiciousPatterns = [
      /^10\./, // Private IP ranges
      /^172\.(1[6-9]|2[0-9]|3[01])\./, 
      /^192\.168\./,
      /^127\./, // Localhost
      /^169\.254\./ // Link-local
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      clientIP && pattern.test(clientIP)
    );

    if (isSuspicious && config.server.env === 'production') {
      console.warn(`Suspicious IP access: ${clientIP}`);
    }

    next();
  } catch (error) {
    console.error('IP validation error:', error.message);
    next();
  }
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.originalUrl} - ${req.clientIP || req.ip}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Error handler middleware
 */
const errorHandler = (error, req, res, next) => {
  console.error('🚨 Error:', error);

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map(err => err.message).join(', ');
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    statusCode = 400;
    const field = Object.keys(error.keyPattern)[0];
    message = `${field} already exists`;
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  }

  // Don't expose error details in production
  if (config.server.env === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.server.env === 'development' && { stack: error.stack })
  });
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  rateLimiter,
  authRateLimiter,
  faceUploadRateLimiter,
  attendanceRateLimiter,
  securityHeaders,
  corsHeaders,
  sanitizeInput,
  validateIPAddress,
  requestLogger,
  errorHandler,
  notFoundHandler
};
