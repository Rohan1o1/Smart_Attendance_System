const express = require('express');

// Import route modules
const authRoutes = require('./auth');
const faceRoutes = require('./face');
const classRoutes = require('./class');
const attendanceRoutes = require('./attendance');

const router = express.Router();

/**
 * Main Routes Configuration
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Attendance System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Face Recognition + Location Verified Smart Attendance System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      authentication: '/api/auth',
      faceRecognition: '/api/face',
      classManagement: '/api/class',
      attendance: '/api/attendance'
    },
    features: [
      'Face Recognition Authentication',
      'GPS Location Verification',
      'Real-time Attendance Tracking',
      'Geofence Validation',
      'Liveness Detection',
      'Comprehensive Reporting'
    ]
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/face', faceRoutes);
router.use('/class', classRoutes);
router.use('/attendance', attendanceRoutes);

module.exports = router;
