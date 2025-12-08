const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

/**
 * Application Configuration
 * Centralizes all environment-based configuration
 */
const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5003,
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost'
  },

  // Client Configuration
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system',
    name: process.env.DB_NAME || 'attendance_system',
    options: {
      maxPoolSize: 10,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  // Geolocation Configuration
  geolocation: {
    college: {
      latitude: parseFloat(process.env.COLLEGE_LATITUDE) || 28.6139,
      longitude: parseFloat(process.env.COLLEGE_LONGITUDE) || 77.2090,
      radius: parseInt(process.env.COLLEGE_GEOFENCE_RADIUS) || 200
    },
    teacher: {
      radius: parseInt(process.env.TEACHER_LOCATION_RADIUS) || 20
    }
  },

  // Face Recognition Configuration
  faceRecognition: {
    similarityThreshold: parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.6,
    maxFaceImages: parseInt(process.env.MAX_FACE_IMAGES) || 5,
    modelPath: path.join(__dirname, 'utils', 'models')
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    allowedVideoTypes: ['video/mp4', 'video/webm']
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    corsOptions: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      optionsSuccessStatus: 200
    }
  },

  // Attendance Configuration
  attendance: {
    windowMinutes: parseInt(process.env.ATTENDANCE_WINDOW_MINUTES) || 30,
    maxAttendancePerDay: 1,
    latenessThresholdMinutes: 15
  },

  // Admin Configuration
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@college.edu',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  },

  // Face Recognition Configuration
  faceRecognition: {
    enabled: process.env.USE_REAL_FACE_RECOGNITION === 'true' || true, // Enable production face recognition
    confidenceThreshold: parseFloat(process.env.FACE_CONFIDENCE_THRESHOLD) || 0.6,
    modelPath: process.env.FACE_MODELS_PATH || path.join(__dirname, 'models'),
    maxFaceImages: parseInt(process.env.MAX_FACE_IMAGES) || 3,
    imageFormat: process.env.FACE_IMAGE_FORMAT || 'jpeg',
    imageQuality: parseFloat(process.env.FACE_IMAGE_QUALITY) || 0.95,
    livenessThreshold: parseFloat(process.env.LIVENESS_THRESHOLD) || 0.5
  },

  // Validation Configuration
  validation: {
    minPasswordLength: 8,
    maxNameLength: 50,
    maxEmailLength: 100,
    phoneNumberRegex: /^[+]?[1-9][\d]{0,15}$/
  }
};

// Validation function to check required environment variables
const validateConfig = () => {
  const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
  
  if (config.server.env === 'production') {
    requiredEnvVars.push('COLLEGE_LATITUDE', 'COLLEGE_LONGITUDE');
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
  }
};

// Auto-validate configuration on import
validateConfig();

module.exports = config;
