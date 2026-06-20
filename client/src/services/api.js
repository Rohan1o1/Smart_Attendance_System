/**
 * API Service Layer
 * Centralized API client with axios for all HTTP requests
 */

import axios from 'axios';

// API Configuration
// In development use relative '/api' so Vite proxy forwards requests to the backend.
// In production set VITE_API_BASE_URL to the deployed API URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Request interceptor to add auth token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling and token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh token for login or register requests
    if (originalRequest.url.includes('/auth/login') || 
        originalRequest.url.includes('/auth/register')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API response wrapper
 */
const handleResponse = (response) => {
  return {
    data: response.data.data || response.data,
    message: response.data.message,
    success: response.data.success !== false,
    status: response.status
  };
};

/**
 * API error handler
 */
const handleError = (error) => {
  const errorResponse = {
    success: false,
    message: 'An unexpected error occurred',
    status: error.response?.status || 500,
    data: null
  };

  if (error.response?.data?.message) {
    errorResponse.message = error.response.data.message;
  } else if (error.message) {
    errorResponse.message = error.message;
  }

  if (error.response?.data?.errors) {
    errorResponse.errors = error.response.data.errors;
  }

  return errorResponse;
};

/**
 * Authentication API endpoints
 */
export const authAPI = {
  /**
   * User login
   */
  login: async (credentials) => {
    try {
      console.log('🌐 API: Login request with credentials:', credentials);
      console.log('🌐 API: Password length:', credentials.password?.length);
      console.log('🌐 API: Password chars:', credentials.password?.split('').map((c, i) => `${i}:'${c}'(${c.charCodeAt(0)})`));
      const response = await apiClient.post('/auth/login', credentials);
      console.log('🌐 API: Response status:', response.status);
      console.log('🌐 API: Response data:', response.data);
      return handleResponse(response);
    } catch (error) {
      console.log('🌐 API: Error occurred:', error);
      console.log('🌐 API: Error response:', error.response?.data);
      throw handleError(error);
    }
  },

  /**
   * User registration
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * User logout
   */
  logout: async () => {
    try {
      const response = await apiClient.post('/auth/logout');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  // ============================
  // Role-Specific Registration
  // ============================

  /**
   * Register Admin (Department Head)
   * Requires NEW department (no existing admin for that department)
   */
  registerAdmin: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register/admin', userData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Register Teacher
   * Requires EXISTING department (must have an admin)
   */
  registerTeacher: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register/teacher', userData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Register Student
   * Requires EXISTING department, rollNumber required
   */
  registerStudent: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register/student', userData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Student Login (using rollNumber)
   */
  loginStudent: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login/student', credentials);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get all departments (for registration dropdowns)
   */
  getDepartments: async () => {
    try {
      const response = await apiClient.get('/auth/departments');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  }
};

/**
 * Admin API endpoints (for Department Admins)
 */
export const adminAPI = {
  /**
   * Get unverified users in admin's department
   */
  getUnverifiedUsers: async () => {
    try {
      const response = await apiClient.get('/auth/admin/unverified');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Verify a user (teacher/student)
   */
  verifyUser: async (userId) => {
    try {
      const response = await apiClient.put(`/auth/admin/verify/${userId}`);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get all users in department
   */
  getDepartmentUsers: async (params = {}) => {
    try {
      const response = await apiClient.get('/auth/admin/users', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Assign teacher to year/section
   */
  assignTeacher: async (teacherId, data) => {
    try {
      const response = await apiClient.put(`/auth/admin/assign-teacher/${teacherId}`, data);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Deactivate user
   */
  deactivateUser: async (userId) => {
    try {
      const response = await apiClient.put(`/auth/deactivate/${userId}`);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Reactivate user
   */
  reactivateUser: async (userId) => {
    try {
      const response = await apiClient.put(`/auth/reactivate/${userId}`);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get user statistics
   */
  getUserStats: async () => {
    try {
      const response = await apiClient.get('/auth/stats');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  }
};

// Add reject user endpoint for admin
adminAPI.rejectUser = async (userId, reason = 'Rejected by admin') => {
  try {
    const response = await apiClient.put(`/auth/admin/reject/${userId}`, { reason });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Get list of teachers in the admin's department (for selection in class creation)
 */
adminAPI.getTeachers = async (params = {}) => {
  try {
    // The backend doesn't have a dedicated /auth/teachers route; reuse admin users endpoint
    const response = await apiClient.get('/auth/admin/users', { params: { role: 'teacher', ...params } });
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * SuperAdmin API endpoints
 */
export const superAdminAPI = {
  /**
   * Get all admins
   */
  getAllAdmins: async () => {
    try {
      const response = await apiClient.get('/auth/superadmin/admins');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Create a new admin
   */
  createAdmin: async (adminData) => {
    try {
      const response = await apiClient.post('/auth/superadmin/create-admin', adminData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Delete (deactivate) an admin
   */
  deleteAdmin: async (adminId) => {
    try {
      const response = await apiClient.delete(`/auth/superadmin/admin/${adminId}`);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get all users across all departments
   */
  getAllUsers: async (params = {}) => {
    try {
      const response = await apiClient.get('/auth/superadmin/users', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get system statistics
   */
  getSystemStats: async () => {
    try {
      const response = await apiClient.get('/auth/superadmin/stats');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  }
};

/**
 * User Profile API endpoints
 */
export const userAPI = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/auth/me', profileData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Change password
   */
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/users/change-password', passwordData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Upload avatar
   */
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Upload profile image
   */
  uploadProfileImage: async (formData) => {
    try {
      const response = await apiClient.post('/users/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Update user face data
   */
  updateFaceData: async (faceData) => {
    try {
      const response = await apiClient.post('/face/update', faceData, {
        timeout: 60000 // 60 seconds for face processing
      });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Register face data for first time
   */
  registerFaceData: async (faceData) => {
    try {
      const response = await apiClient.post('/face/register', faceData, {
        timeout: 60000 // 60 seconds for face processing
      });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get face registration status
   */
  getFaceStatus: async () => {
    try {
      const response = await apiClient.get('/face/status');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Remove user face data
   */
  removeFaceData: async () => {
    try {
      const response = await apiClient.delete('/face/delete');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  }
};

/**
 * Face Recognition API endpoints
 */
export const faceAPI = {
  /**
   * Upload face image for registration
   */
  uploadFace: async (file) => {
    try {
      const formData = new FormData();
      formData.append('face', file);

      const response = await apiClient.post('/face/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Verify face for attendance
   */
  verifyFace: async (file, location) => {
    try {
      const formData = new FormData();
      formData.append('face', file);
      formData.append('location', JSON.stringify(location));

      const response = await apiClient.post('/face/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Update face data
   */
  updateFace: async (file) => {
    try {
      const formData = new FormData();
      formData.append('face', file);

      const response = await apiClient.put('/face/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Delete face data
   */
  deleteFace: async () => {
    try {
      const response = await apiClient.delete('/face/delete');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  }
};

/**
 * Class Management API endpoints
 */
export const classAPI = {
  /**
   * Get classes for the current teacher (or paginated list)
   */
  getMyClasses: async (params = {}) => {
    try {
      const response = await apiClient.get('/class/my-classes', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get active classes
   */
  getActiveClasses: async (params = {}) => {
    try {
      const response = await apiClient.get('/class/active', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get classes for admin/teacher schedule management
   */
  getManageClasses: async (params = {}) => {
    try {
      const response = await apiClient.get('/class/manage', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get class by ID
   */
  getClass: async (id) => {
    try {
      const response = await apiClient.get(`/class/${id}`);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Create new class
   */
  createClass: async (classData) => {
    try {
      const response = await apiClient.post('/class/create', classData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Update class
   */
  updateClass: async (id, classData) => {
    try {
      const response = await apiClient.put(`/class/${id}`, classData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Delete class
   */
  deleteClass: async (id) => {
    try {
      const response = await apiClient.delete(`/class/${id}`);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Enroll in class
   */
  enrollClass: async (classId, studentIds = []) => {
    try {
      const response = await apiClient.post(`/class/${classId}/enroll`, { studentIds });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Start class session
   */
  startSession: async (classId, sessionData) => {
    try {
      const response = await apiClient.post(`/class/${classId}/start`, sessionData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * End attendance session
   */
  endSession: async (classId) => {
    try {
      const response = await apiClient.post(`/class/${classId}/end`);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get enrolled classes for student
   */
  getEnrolledClasses: async () => {
    try {
      const response = await apiClient.get('/class/enrolled');
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  }
};

/**
 * Attendance API endpoints
 */
export const attendanceAPI = {
  /**
   * Submit attendance with face and location verification
   */
  submitAttendance: async (attendanceData) => {
    try {
      const response = await apiClient.post('/attendance/submit', attendanceData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Mark attendance (legacy method - use submitAttendance for new implementations)
   */
  markAttendance: async (attendanceData) => {
    try {
      const response = await apiClient.post('/attendance/submit', attendanceData);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get attendance records
   */
  getAttendance: async (params = {}) => {
    try {
      const response = await apiClient.get('/attendance', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get attendance report
   */
  getReport: async (params = {}) => {
    try {
      const response = await apiClient.get('/attendance/report', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get attendance analytics
   */
  getAnalytics: async (params = {}) => {
    try {
      const response = await apiClient.get('/attendance/analytics', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get aggregated attendance statistics (admin/teacher/student scoped)
   */
  getStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/attendance/stats', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Get attendance statistics for the authenticated teacher
   */
  getTeacherStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/attendance/teacher/stats', { params });
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Export attendance data
   */
  exportAttendance: async (params = {}) => {
    try {
      const response = await apiClient.get('/attendance/export', { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  }
};

/**
 * Generic API client for custom requests
 */
export const api = {
  get: async (url, config = {}) => {
    try {
      const response = await apiClient.get(url, config);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  post: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  put: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  }
};

export default apiClient;
