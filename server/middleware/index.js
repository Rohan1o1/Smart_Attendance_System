/**
 * Middleware Index File
 * Exports all middleware for easy importing
 */

const auth = require('./auth');
const security = require('./security');
const validation = require('./validation');

module.exports = {
  ...auth,
  ...security,
  ...validation
};
