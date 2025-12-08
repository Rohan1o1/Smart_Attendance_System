/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted file size
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generate random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 32) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after delay
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} - Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const cloned = {};
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key]);
  });
  
  return cloned;
};

/**
 * Remove sensitive fields from object
 * @param {object} obj - Object to sanitize
 * @param {array} sensitiveFields - Fields to remove
 * @returns {object} - Sanitized object
 */
const removeSensitiveFields = (obj, sensitiveFields = ['password', 'token', 'secret']) => {
  const sanitized = deepClone(obj);
  
  const removeSensitive = (current) => {
    if (typeof current !== 'object' || current === null) return current;
    
    if (Array.isArray(current)) {
      return current.map(item => removeSensitive(item));
    }
    
    const result = {};
    Object.keys(current).forEach(key => {
      if (!sensitiveFields.includes(key.toLowerCase())) {
        result[key] = removeSensitive(current[key]);
      }
    });
    
    return result;
  };
  
  return removeSensitive(sanitized);
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} - Formatted date string
 */
const formatDate = (date, options = {}) => {
  const dateObj = new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  return dateObj.toLocaleString('en-US', formatOptions);
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number} - Age in years
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone number
 */
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Generate pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination metadata
 */
const generatePaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  
  return {
    currentPage,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null
  };
};

/**
 * Convert string to slug
 * @param {string} text - Text to convert
 * @returns {string} - URL-friendly slug
 */
const createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} - Capitalized text
 */
const toTitleCase = (text) => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} - True if empty
 */
const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
};

/**
 * Retry function with exponential backoff
 * @param {function} fn - Function to retry
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
const retryWithBackoff = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${backoffDelay}ms...`);
      await sleep(backoffDelay);
    }
  }
};

/**
 * Convert object to query string
 * @param {object} params - Parameters object
 * @returns {string} - Query string
 */
const objectToQueryString = (params) => {
  const query = Object.keys(params)
    .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
    
  return query ? `?${query}` : '';
};

/**
 * Mask sensitive data
 * @param {string} value - Value to mask
 * @param {number} visibleChars - Number of visible characters
 * @param {string} maskChar - Character to use for masking
 * @returns {string} - Masked value
 */
const maskSensitiveData = (value, visibleChars = 4, maskChar = '*') => {
  if (!value || value.length <= visibleChars) {
    return maskChar.repeat(8);
  }
  
  const visible = value.slice(-visibleChars);
  const masked = maskChar.repeat(value.length - visibleChars);
  
  return masked + visible;
};

/**
 * Get client IP address from request
 * @param {object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIpAddress = (req) => {
  return req.ip ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
};

/**
 * Generate OTP (One Time Password)
 * @param {number} length - Length of OTP
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

/**
 * Time-based utilities
 */
const timeUtils = {
  /**
   * Get time ago string
   * @param {Date|string} date - Date to compare
   * @returns {string} - Time ago string
   */
  getTimeAgo: (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  },

  /**
   * Get start and end of day
   * @param {Date|string} date - Date
   * @returns {object} - Start and end of day
   */
  getStartAndEndOfDay: (date = new Date()) => {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
  },

  /**
   * Check if date is today
   * @param {Date|string} date - Date to check
   * @returns {boolean} - True if date is today
   */
  isToday: (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    
    return today.toDateString() === checkDate.toDateString();
  }
};

module.exports = {
  formatFileSize,
  generateRandomString,
  sleep,
  deepClone,
  removeSensitiveFields,
  formatDate,
  calculateAge,
  isValidEmail,
  isValidPhoneNumber,
  generatePaginationMeta,
  createSlug,
  toTitleCase,
  isEmpty,
  retryWithBackoff,
  objectToQueryString,
  maskSensitiveData,
  getClientIpAddress,
  generateOTP,
  timeUtils
};
