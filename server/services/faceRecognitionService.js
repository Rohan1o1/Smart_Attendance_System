/**
 * Face Recognition Service 
 * Main entry point for face recognition functionality
 * Can switch between stub and production implementation based on environment
 */

const config = require('../utils/config');

let faceRecognitionService;

// Choose implementation based on environment
if (process.env.NODE_ENV === 'production' || process.env.USE_REAL_FACE_RECOGNITION === 'true') {
  // Use production face recognition implementation
  faceRecognitionService = require('./faceRecognitionService.production');
  console.log('🧠 Using Production Face Recognition Service');
} else {
  // Use simple stub implementation for development
  faceRecognitionService = require('./faceRecognitionService.simple');
  console.log('🧠 Using Simple Face Recognition Service');
}

module.exports = faceRecognitionService;
