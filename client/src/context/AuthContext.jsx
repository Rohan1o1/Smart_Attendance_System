/**
 * Authentication Context
 * Global state management for user authentication
 */

import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user }
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.loading
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth data on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check authentication status from localStorage
   */
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        const user = JSON.parse(userData);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        });
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { loading: false } });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { loading: false } });
    }
  };

  /**
   * Login function
   */
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      console.log('🔐 AuthContext: Making login request to API');
      const response = await authAPI.login(credentials);
      console.log('🔐 AuthContext: API response:', response);

      if (response.success) {
        const { user, accessToken, refreshToken } = response.data;
        console.log('🔐 AuthContext: Extracting data - user:', user, 'token:', !!accessToken);

        // Store tokens and user data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        });

        console.log('🔐 AuthContext: Login successful, returning user:', user);
        return { success: true, user };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.log('🔐 AuthContext: Login error:', error);
      const errorMessage = error.message || 'An error occurred during login';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Register function
   */
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      const response = await authAPI.register(userData);

      if (response.success) {
        const { user, accessToken, refreshToken } = response.data;

        // Store tokens and user data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user }
        });

        return { success: true, user };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred during registration';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: { error: errorMessage }
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout function
   */
  const logout = async () => {
    try {
      // Call logout API
      await authAPI.logout();
    } catch (error) {
      console.error('Error during logout API call:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  /**
   * Update user profile
   */
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: { user: userData }
    });
  };

  /**
   * Clear error
   */
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  /**
   * Get user permissions based on role
   */
  const getPermissions = () => {
    if (!state.user?.role) return [];

    const rolePermissions = {
      admin: [
        'view_all_users',
        'manage_users',
        'manage_classes',
        'view_analytics',
        'manage_system',
        'export_data'
      ],
      teacher: [
        'manage_own_classes',
        'view_students',
        'manage_attendance',
        'view_class_analytics'
      ],
      student: [
        'view_own_attendance',
        'mark_attendance',
        'view_own_profile'
      ]
    };

    return rolePermissions[state.user.role] || [];
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission) => {
    const permissions = getPermissions();
    return permissions.includes(permission);
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    
    // Helper functions
    hasRole,
    hasAnyRole,
    hasPermission,
    getPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
