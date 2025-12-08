/**
 * Enhanced Logger Utility
 * Advanced logging system with multiple transports and formatting
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { config, isDevelopment } = require('./config');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create transports
const transports = [];

// Console transport
if (config.logging.console.enabled) {
  transports.push(
    new winston.transports.Console({
      format: isDevelopment() ? consoleFormat : logFormat,
      level: config.logging.level
    })
  );
}

// File transports
if (config.logging.file.enabled) {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Debug log file (only in development)
  if (isDevelopment()) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'debug.log'),
        level: 'debug',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3
      })
    );
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false
});

/**
 * Enhanced logging methods with context
 */
class Logger {
  constructor() {
    this.logger = logger;
  }

  /**
   * Log error with context
   * @param {string} message - Error message
   * @param {Error|object} error - Error object or metadata
   * @param {object} context - Additional context
   */
  error(message, error = null, context = {}) {
    const logData = {
      message,
      ...context
    };

    if (error) {
      if (error instanceof Error) {
        logData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else {
        logData.error = error;
      }
    }

    this.logger.error(logData);
  }

  /**
   * Log warning with context
   * @param {string} message - Warning message
   * @param {object} context - Additional context
   */
  warn(message, context = {}) {
    this.logger.warn({
      message,
      ...context
    });
  }

  /**
   * Log info with context
   * @param {string} message - Info message
   * @param {object} context - Additional context
   */
  info(message, context = {}) {
    this.logger.info({
      message,
      ...context
    });
  }

  /**
   * Log debug with context
   * @param {string} message - Debug message
   * @param {object} context - Additional context
   */
  debug(message, context = {}) {
    this.logger.debug({
      message,
      ...context
    });
  }

  /**
   * Log HTTP request
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {number} duration - Request duration in ms
   */
  request(req, res, duration) {
    this.logger.info({
      message: 'HTTP Request',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });
  }

  /**
   * Log authentication events
   * @param {string} event - Authentication event type
   * @param {string} userId - User ID
   * @param {string} ip - IP address
   * @param {object} context - Additional context
   */
  auth(event, userId, ip, context = {}) {
    this.logger.info({
      message: `Authentication: ${event}`,
      event,
      userId,
      ip,
      ...context
    });
  }

  /**
   * Log security events
   * @param {string} event - Security event type
   * @param {string} ip - IP address
   * @param {object} context - Additional context
   */
  security(event, ip, context = {}) {
    this.logger.warn({
      message: `Security Event: ${event}`,
      event,
      ip,
      ...context
    });
  }

  /**
   * Log database operations
   * @param {string} operation - Database operation
   * @param {string} collection - Database collection
   * @param {object} context - Additional context
   */
  database(operation, collection, context = {}) {
    this.logger.debug({
      message: `Database: ${operation}`,
      operation,
      collection,
      ...context
    });
  }

  /**
   * Log face recognition events
   * @param {string} event - Face recognition event
   * @param {string} userId - User ID
   * @param {object} context - Additional context
   */
  faceRecognition(event, userId, context = {}) {
    this.logger.info({
      message: `Face Recognition: ${event}`,
      event,
      userId,
      ...context
    });
  }

  /**
   * Log location verification events
   * @param {string} event - Location event
   * @param {string} userId - User ID
   * @param {object} location - Location data
   * @param {object} context - Additional context
   */
  location(event, userId, location, context = {}) {
    this.logger.info({
      message: `Location: ${event}`,
      event,
      userId,
      location: {
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy
      },
      ...context
    });
  }

  /**
   * Log attendance events
   * @param {string} event - Attendance event
   * @param {string} userId - User ID
   * @param {string} classId - Class ID
   * @param {object} context - Additional context
   */
  attendance(event, userId, classId, context = {}) {
    this.logger.info({
      message: `Attendance: ${event}`,
      event,
      userId,
      classId,
      ...context
    });
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {object} context - Additional context
   */
  performance(operation, duration, context = {}) {
    this.logger.debug({
      message: `Performance: ${operation}`,
      operation,
      duration: `${duration}ms`,
      ...context
    });
  }

  /**
   * Log system events
   * @param {string} event - System event
   * @param {object} context - Additional context
   */
  system(event, context = {}) {
    this.logger.info({
      message: `System: ${event}`,
      event,
      ...context
    });
  }
}

// Create singleton instance
const loggerInstance = new Logger();

/**
 * Express middleware for request logging
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    loggerInstance.request(req, res, duration);
    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (error, req, res, next) => {
  loggerInstance.error('Unhandled Error', error, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  next(error);
};

/**
 * Log stream for morgan
 */
const logStream = {
  write: (message) => {
    loggerInstance.info(message.trim());
  }
};

module.exports = {
  logger: loggerInstance,
  requestLogger,
  errorLogger,
  logStream
};
