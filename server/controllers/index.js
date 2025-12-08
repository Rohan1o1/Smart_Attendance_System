/**
 * Controllers Index File
 * Exports all controllers for easy importing
 */

const authController = require('./authController');
const faceController = require('./faceController');
const classController = require('./classController');
const attendanceController = require('./attendanceController');

module.exports = {
  authController,
  faceController,
  classController,
  attendanceController
};
