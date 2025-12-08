/**
 * Environment Configuration
 * Load and validate environment variables
 */

const path = require('path');
require('dotenv').config();

const { ENVIRONMENTS } = require('./constants');

/**
 * Get environment variable with optional default value
 * @param {string} key - Environment variable key
 * @param {any} defaultValue - Default value if not found
 * @param {boolean} required - Whether the variable is required
 * @returns {string} - Environment variable value
 */
const getEnvVar = (key, defaultValue = null, required = false) => {
  const value = process.env[key] || defaultValue;
  
  if (required && (value === null || value === undefined || value === '')) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value;
};

/**
 * Convert string to boolean
 * @param {string} value - String value
 * @returns {boolean} - Boolean value
 */
const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
};

/**
 * Convert string to number
 * @param {string} value - String value
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} - Number value
 */
const toNumber = (value, defaultValue = 0) => {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

// Environment Configuration
const config = {
  // App Configuration
  app: {
    name: getEnvVar('APP_NAME', 'Smart Attendance System'),
    version: getEnvVar('APP_VERSION', '1.0.0'),
    env: getEnvVar('NODE_ENV', ENVIRONMENTS.DEVELOPMENT),
    port: toNumber(getEnvVar('PORT', 5000)),
    host: getEnvVar('HOST', 'localhost'),
    url: getEnvVar('APP_URL', 'http://localhost:5000'),
    frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000')
  },

  // Database Configuration
  database: {
    uri: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/attendance_system', true),
    options: {
      maxPoolSize: toNumber(getEnvVar('DB_MAX_POOL_SIZE', 10)),
      minPoolSize: toNumber(getEnvVar('DB_MIN_POOL_SIZE', 2)),
      maxIdleTimeMS: toNumber(getEnvVar('DB_MAX_IDLE_TIME', 30000)),
      serverSelectionTimeoutMS: toNumber(getEnvVar('DB_CONNECTION_TIMEOUT', 10000))
    }
  },

  // JWT Configuration
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'your-super-secret-jwt-key', true),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET', 'your-super-secret-refresh-key', true),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '30d'),
    issuer: getEnvVar('JWT_ISSUER', 'attendance-system'),
    audience: getEnvVar('JWT_AUDIENCE', 'attendance-users')
  },

  // Security Configuration
  security: {
    bcryptRounds: toNumber(getEnvVar('BCRYPT_ROUNDS', 12)),
    maxLoginAttempts: toNumber(getEnvVar('MAX_LOGIN_ATTEMPTS', 5)),
    lockoutDuration: toNumber(getEnvVar('LOCKOUT_DURATION', 900000)), // 15 minutes
    sessionTimeout: toNumber(getEnvVar('SESSION_TIMEOUT', 86400000)), // 24 hours
    corsOrigins: getEnvVar('CORS_ORIGINS', '*').split(','),
    trustedProxies: getEnvVar('TRUSTED_PROXIES', '').split(',').filter(Boolean)
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: toNumber(getEnvVar('RATE_LIMIT_WINDOW_MS', 900000)), // 15 minutes
    max: toNumber(getEnvVar('RATE_LIMIT_MAX', 100)),
    message: getEnvVar('RATE_LIMIT_MESSAGE', 'Too many requests, please try again later'),
    standardHeaders: toBool(getEnvVar('RATE_LIMIT_STANDARD_HEADERS', true)),
    legacyHeaders: toBool(getEnvVar('RATE_LIMIT_LEGACY_HEADERS', false))
  },

  // File Upload Configuration
  upload: {
    path: getEnvVar('UPLOAD_PATH', './uploads'),
    maxFileSize: toNumber(getEnvVar('MAX_FILE_SIZE', 10485760)), // 10MB
    allowedImageTypes: getEnvVar('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/webp').split(','),
    allowedDocumentTypes: getEnvVar('ALLOWED_DOCUMENT_TYPES', 'application/pdf').split(','),
    profilePictureSize: toNumber(getEnvVar('PROFILE_PICTURE_SIZE', 500)),
    thumbnailSize: toNumber(getEnvVar('THUMBNAIL_SIZE', 150))
  },

  // Email Configuration
  email: {
    service: getEnvVar('EMAIL_SERVICE', 'gmail'),
    host: getEnvVar('EMAIL_HOST'),
    port: toNumber(getEnvVar('EMAIL_PORT', 587)),
    secure: toBool(getEnvVar('EMAIL_SECURE', false)),
    user: getEnvVar('EMAIL_USER'),
    password: getEnvVar('EMAIL_PASSWORD'),
    from: getEnvVar('EMAIL_FROM', 'noreply@attendance-system.com'),
    replyTo: getEnvVar('EMAIL_REPLY_TO'),
    templates: {
      path: getEnvVar('EMAIL_TEMPLATES_PATH', './templates/emails'),
      engine: getEnvVar('EMAIL_TEMPLATE_ENGINE', 'handlebars')
    }
  },

  // SMS Configuration
  sms: {
    service: getEnvVar('SMS_SERVICE', 'twilio'),
    accountSid: getEnvVar('SMS_ACCOUNT_SID'),
    authToken: getEnvVar('SMS_AUTH_TOKEN'),
    fromNumber: getEnvVar('SMS_FROM_NUMBER')
  },

  // Face Recognition Configuration
  faceRecognition: {
    enabled: toBool(getEnvVar('ENABLE_FACE_RECOGNITION', true)),
    minConfidence: parseFloat(getEnvVar('FACE_MIN_CONFIDENCE', 0.7)),
    maxDistance: parseFloat(getEnvVar('FACE_MAX_DISTANCE', 0.4)),
    minFaceSize: toNumber(getEnvVar('FACE_MIN_SIZE', 160)),
    maxFaceSize: toNumber(getEnvVar('FACE_MAX_SIZE', 1024)),
    livenessThreshold: parseFloat(getEnvVar('FACE_LIVENESS_THRESHOLD', 0.5)),
    modelsPath: getEnvVar('FACE_MODELS_PATH', './models')
  },

  // Location Configuration
  location: {
    enabled: toBool(getEnvVar('ENABLE_LOCATION_VERIFICATION', true)),
    maxDistance: toNumber(getEnvVar('LOCATION_MAX_DISTANCE', 100)),
    accuracyThreshold: toNumber(getEnvVar('GPS_ACCURACY_THRESHOLD', 50)),
    speedThreshold: toNumber(getEnvVar('LOCATION_SPEED_THRESHOLD', 100)),
    altitudeThreshold: toNumber(getEnvVar('LOCATION_ALTITUDE_THRESHOLD', 10000)),
    timeWindow: toNumber(getEnvVar('LOCATION_TIME_WINDOW', 300000)) // 5 minutes
  },

  // Logging Configuration
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    file: {
      enabled: toBool(getEnvVar('LOG_FILE_ENABLED', true)),
      path: getEnvVar('LOG_FILE_PATH', './logs'),
      maxSize: getEnvVar('LOG_FILE_MAX_SIZE', '20m'),
      maxFiles: toNumber(getEnvVar('LOG_FILE_MAX_FILES', 5)),
      datePattern: getEnvVar('LOG_FILE_DATE_PATTERN', 'YYYY-MM-DD')
    },
    console: {
      enabled: toBool(getEnvVar('LOG_CONSOLE_ENABLED', true)),
      colorize: toBool(getEnvVar('LOG_CONSOLE_COLORIZE', true))
    }
  },

  // Cache Configuration
  cache: {
    enabled: toBool(getEnvVar('CACHE_ENABLED', false)),
    type: getEnvVar('CACHE_TYPE', 'memory'), // memory, redis
    redis: {
      host: getEnvVar('REDIS_HOST', 'localhost'),
      port: toNumber(getEnvVar('REDIS_PORT', 6379)),
      password: getEnvVar('REDIS_PASSWORD'),
      db: toNumber(getEnvVar('REDIS_DB', 0)),
      keyPrefix: getEnvVar('REDIS_KEY_PREFIX', 'attendance:')
    },
    ttl: {
      short: toNumber(getEnvVar('CACHE_TTL_SHORT', 300)), // 5 minutes
      medium: toNumber(getEnvVar('CACHE_TTL_MEDIUM', 1800)), // 30 minutes
      long: toNumber(getEnvVar('CACHE_TTL_LONG', 86400)) // 24 hours
    }
  },

  // Notification Configuration
  notifications: {
    email: {
      enabled: toBool(getEnvVar('ENABLE_EMAIL_NOTIFICATIONS', true))
    },
    sms: {
      enabled: toBool(getEnvVar('ENABLE_SMS_NOTIFICATIONS', false))
    },
    push: {
      enabled: toBool(getEnvVar('ENABLE_PUSH_NOTIFICATIONS', false)),
      vapidPublicKey: getEnvVar('VAPID_PUBLIC_KEY'),
      vapidPrivateKey: getEnvVar('VAPID_PRIVATE_KEY'),
      vapidSubject: getEnvVar('VAPID_SUBJECT', 'mailto:admin@attendance-system.com')
    }
  },

  // Feature Flags
  features: {
    registration: toBool(getEnvVar('FEATURE_REGISTRATION', true)),
    passwordReset: toBool(getEnvVar('FEATURE_PASSWORD_RESET', true)),
    emailVerification: toBool(getEnvVar('FEATURE_EMAIL_VERIFICATION', false)),
    twoFactorAuth: toBool(getEnvVar('FEATURE_TWO_FACTOR_AUTH', false)),
    attendanceAnalytics: toBool(getEnvVar('FEATURE_ATTENDANCE_ANALYTICS', true)),
    bulkOperations: toBool(getEnvVar('FEATURE_BULK_OPERATIONS', true)),
    dataExport: toBool(getEnvVar('FEATURE_DATA_EXPORT', true)),
    maintenance: toBool(getEnvVar('FEATURE_MAINTENANCE_MODE', false))
  },

  // Development Configuration
  development: {
    debugMode: toBool(getEnvVar('DEBUG_MODE', false)),
    verboseLogging: toBool(getEnvVar('VERBOSE_LOGGING', false)),
    seedDatabase: toBool(getEnvVar('SEED_DATABASE', false)),
    mockServices: toBool(getEnvVar('MOCK_SERVICES', false))
  },

  // Production Configuration
  production: {
    enableCompression: toBool(getEnvVar('ENABLE_COMPRESSION', true)),
    enableCaching: toBool(getEnvVar('ENABLE_CACHING', true)),
    healthCheckPath: getEnvVar('HEALTH_CHECK_PATH', '/health'),
    metricsPath: getEnvVar('METRICS_PATH', '/metrics'),
    shutdownTimeout: toNumber(getEnvVar('SHUTDOWN_TIMEOUT', 10000)) // 10 seconds
  }
};

/**
 * Validate required configuration
 */
const validateConfig = () => {
  const requiredFields = [
    'database.uri',
    'jwt.secret',
    'jwt.refreshSecret'
  ];

  for (const field of requiredFields) {
    const keys = field.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Required configuration field '${field}' is missing or empty`);
      }
    }
  }
};

/**
 * Get configuration for specific environment
 */
const getConfig = () => {
  // Validate configuration
  validateConfig();
  
  // Override settings based on environment
  if (config.app.env === ENVIRONMENTS.PRODUCTION) {
    config.logging.console.enabled = false;
    config.development.debugMode = false;
    config.development.verboseLogging = false;
  }
  
  if (config.app.env === ENVIRONMENTS.TESTING) {
    config.logging.console.enabled = false;
    config.logging.file.enabled = false;
    config.notifications.email.enabled = false;
    config.notifications.sms.enabled = false;
  }
  
  return config;
};

/**
 * Check if running in development mode
 */
const isDevelopment = () => {
  return config.app.env === ENVIRONMENTS.DEVELOPMENT;
};

/**
 * Check if running in production mode
 */
const isProduction = () => {
  return config.app.env === ENVIRONMENTS.PRODUCTION;
};

/**
 * Check if running in test mode
 */
const isTest = () => {
  return config.app.env === ENVIRONMENTS.TESTING;
};

module.exports = {
  config: getConfig(),
  isDevelopment,
  isProduction,
  isTest,
  validateConfig
};
