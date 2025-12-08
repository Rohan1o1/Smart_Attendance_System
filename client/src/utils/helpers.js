/**
 * Utility Functions
 * Common helper functions for the frontend application
 */

import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

/**
 * Format date for display
 */
export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date and time for display
 */
export const formatDateTime = (date, formatString = 'MMM dd, yyyy HH:mm') => {
  return formatDate(date, formatString);
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getTimeAgo = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Check if date is today
 */
export const isDateToday = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isToday(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Check if date is yesterday
 */
export const isDateYesterday = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isYesterday(dateObj);
  } catch (error) {
    return false;
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert string to title case
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

/**
 * Deep clone an object
 */
export const deepClone = (obj) => {
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
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
};

/**
 * Debounce function
 */
export const debounce = (func, wait, immediate) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Generate random color
 */
export const getRandomColor = () => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#06D6A0', '#F59E0B',
    '#EF4444', '#10B981', '#6366F1', '#F97316',
    '#84CC16', '#EC4899', '#14B8A6', '#F472B6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Download file from blob
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
};

/**
 * Parse error message from API response
 */
export const parseErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map(err => err.message || err).join(', ');
  }
  if (error.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

/**
 * Generate avatar URL from initials
 */
export const generateAvatarUrl = (name, size = 40, backgroundColor = null, color = '#FFFFFF') => {
  const initials = getInitials(name);
  const bgColor = backgroundColor || getRandomColor().replace('#', '');
  const textColor = color.replace('#', '');
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${bgColor}&color=${textColor}&bold=true`;
};

/**
 * Format attendance status
 */
export const formatAttendanceStatus = (status) => {
  const statusMap = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused'
  };
  
  return statusMap[status] || status;
};

/**
 * Get attendance status color
 */
export const getAttendanceStatusColor = (status) => {
  const colorMap = {
    present: 'text-green-600 bg-green-100',
    absent: 'text-red-600 bg-red-100',
    late: 'text-yellow-600 bg-yellow-100',
    excused: 'text-blue-600 bg-blue-100'
  };
  
  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Format user role
 */
export const formatUserRole = (role) => {
  const roleMap = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Administrator'
  };
  
  return roleMap[role] || role;
};

/**
 * Get role color
 */
export const getRoleColor = (role) => {
  const colorMap = {
    student: 'text-blue-600 bg-blue-100',
    teacher: 'text-green-600 bg-green-100',
    admin: 'text-purple-600 bg-purple-100'
  };
  
  return colorMap[role] || 'text-gray-600 bg-gray-100';
};

/**
 * Check if browser supports webcam
 */
export const hasWebcamSupport = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Check if browser supports geolocation
 */
export const hasGeolocationSupport = () => {
  return 'geolocation' in navigator;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Format distance for display
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

/**
 * Local storage utilities with error handling
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item to localStorage: ${key}`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage', error);
      return false;
    }
  }
};
