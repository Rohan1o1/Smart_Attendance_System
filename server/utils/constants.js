/**
 * Constants and Configuration
 * Application-wide constants and configuration values
 */

// Application Constants
const APP_NAME = 'Smart Attendance System';
const APP_VERSION = '1.0.0';
const APP_DESCRIPTION = 'Face Recognition + Location Verified Smart Attendance System';

// Environment Constants
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TESTING: 'test'
};

// User Roles
const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// User Status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

// Attendance Status
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
};

// Class Status
const CLASS_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Session Status
const SESSION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  PAUSED: 'paused'
};

// Face Recognition Constants
const FACE_RECOGNITION = {
  MIN_CONFIDENCE: 0.7,
  MAX_DISTANCE: 0.4,
  MIN_FACE_SIZE: 160,
  MAX_FACE_SIZE: 1024,
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  DESCRIPTOR_LENGTH: 128,
  LIVENESS_THRESHOLD: 0.5
};

// Location Constants
const LOCATION = {
  MAX_DISTANCE_METERS: 100, // Maximum distance from class location
  GPS_ACCURACY_THRESHOLD: 50, // Minimum GPS accuracy in meters
  SPEED_THRESHOLD: 100, // Maximum speed in km/h to detect potential spoofing
  ALTITUDE_THRESHOLD: 10000, // Maximum altitude in meters
  TIME_WINDOW_MINUTES: 5 // Time window for location verification
};

// Security Constants
const SECURITY = {
  JWT_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY: '30d',
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  OTP_LENGTH: 6,
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100
};

// File Upload Constants
const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  PROFILE_PICTURE_SIZE: 500, // Max width/height in pixels
  THUMBNAIL_SIZE: 150,
  UPLOAD_DIR: 'uploads',
  TEMP_DIR: 'temp'
};

// Database Constants
const DATABASE = {
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  QUERY_TIMEOUT: 5000, // 5 seconds
  MAX_POOL_SIZE: 10,
  MIN_POOL_SIZE: 2,
  MAX_IDLE_TIME: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Pagination Constants
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Cache Constants
const CACHE = {
  TTL_SHORT: 5 * 60, // 5 minutes
  TTL_MEDIUM: 30 * 60, // 30 minutes
  TTL_LONG: 24 * 60 * 60, // 24 hours
  PREFIX: 'attendance_system:'
};

// Email Templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  ATTENDANCE_ALERT: 'attendance_alert',
  CLASS_REMINDER: 'class_reminder'
};

// Notification Types
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// API Response Messages
const MESSAGES = {
  SUCCESS: {
    GENERAL: 'Operation completed successfully',
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    REGISTRATION: 'Registration successful',
    UPDATE: 'Updated successfully',
    DELETE: 'Deleted successfully',
    CREATE: 'Created successfully',
    UPLOAD: 'File uploaded successfully',
    SEND: 'Sent successfully'
  },
  ERROR: {
    GENERAL: 'An error occurred',
    INVALID_CREDENTIALS: 'Invalid credentials',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    DUPLICATE_ENTRY: 'Duplicate entry',
    FILE_TOO_LARGE: 'File too large',
    INVALID_FILE_TYPE: 'Invalid file type',
    FACE_NOT_DETECTED: 'Face not detected in image',
    LOCATION_REQUIRED: 'Location verification required',
    ATTENDANCE_ALREADY_MARKED: 'Attendance already marked',
    CLASS_NOT_ACTIVE: 'Class is not currently active',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions'
  },
  WARNING: {
    LOW_QUALITY_IMAGE: 'Image quality is low',
    WEAK_GPS_SIGNAL: 'GPS signal is weak',
    POTENTIAL_SPOOFING: 'Potential location spoofing detected',
    MULTIPLE_FACES: 'Multiple faces detected'
  }
};

// Regular Expressions
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[1-9][\d]{0,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
  STUDENT_ID: /^[A-Z0-9]{6,12}$/,
  CLASS_CODE: /^[A-Z0-9]{6,10}$/
};

// Time Zones (common ones)
const TIME_ZONES = {
  UTC: 'UTC',
  EST: 'America/New_York',
  PST: 'America/Los_Angeles',
  IST: 'Asia/Kolkata',
  JST: 'Asia/Tokyo',
  GMT: 'Europe/London'
};

// Days of Week
const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

// Months
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Log Levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  VERBOSE: 'verbose'
};

// Feature Flags
const FEATURES = {
  FACE_RECOGNITION: true,
  LOCATION_VERIFICATION: true,
  EMAIL_NOTIFICATIONS: true,
  SMS_NOTIFICATIONS: false,
  ATTENDANCE_ANALYTICS: true,
  BULK_OPERATIONS: true,
  API_RATE_LIMITING: true,
  TWO_FACTOR_AUTH: false
};

// API Endpoints
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email'
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    UPLOAD_AVATAR: '/users/avatar'
  },
  FACE: {
    UPLOAD: '/face/upload',
    VERIFY: '/face/verify',
    UPDATE: '/face/update',
    DELETE: '/face/delete'
  },
  CLASSES: {
    LIST: '/classes',
    CREATE: '/classes',
    UPDATE: '/classes/:id',
    DELETE: '/classes/:id',
    ENROLL: '/classes/:id/enroll',
    START_SESSION: '/classes/:id/start-session',
    END_SESSION: '/classes/:id/end-session'
  },
  ATTENDANCE: {
    MARK: '/attendance/mark',
    LIST: '/attendance',
    REPORT: '/attendance/report',
    ANALYTICS: '/attendance/analytics',
    EXPORT: '/attendance/export'
  }
};

// Environment Variables Template
const ENV_TEMPLATE = {
  NODE_ENV: 'development',
  PORT: 5000,
  
  // Database
  MONGODB_URI: 'mongodb://localhost:27017/attendance_system',
  
  // JWT
  JWT_SECRET: 'your-super-secret-jwt-key',
  JWT_REFRESH_SECRET: 'your-super-secret-refresh-key',
  
  // Email
  EMAIL_SERVICE: 'gmail',
  EMAIL_USER: 'your-email@gmail.com',
  EMAIL_PASSWORD: 'your-email-password',
  
  // File Storage
  UPLOAD_PATH: './uploads',
  MAX_FILE_SIZE: '10MB',
  
  // Security
  BCRYPT_ROUNDS: 12,
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX: 100,
  
  // Features
  ENABLE_FACE_RECOGNITION: 'true',
  ENABLE_LOCATION_VERIFICATION: 'true',
  ENABLE_EMAIL_NOTIFICATIONS: 'true'
};

module.exports = {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  ENVIRONMENTS,
  USER_ROLES,
  USER_STATUS,
  ATTENDANCE_STATUS,
  CLASS_STATUS,
  SESSION_STATUS,
  FACE_RECOGNITION,
  LOCATION,
  SECURITY,
  UPLOAD,
  DATABASE,
  PAGINATION,
  CACHE,
  EMAIL_TEMPLATES,
  NOTIFICATION_TYPES,
  MESSAGES,
  REGEX,
  TIME_ZONES,
  DAYS_OF_WEEK,
  MONTHS,
  HTTP_STATUS,
  LOG_LEVELS,
  FEATURES,
  API_ENDPOINTS,
  ENV_TEMPLATE
};
