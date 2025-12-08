/**
 * Services Index File
 * Exports all services for easy importing
 */

const faceRecognitionService = require('./faceRecognitionService');
const locationService = require('./locationService');

module.exports = {
  faceRecognitionService,
  locationService
};
