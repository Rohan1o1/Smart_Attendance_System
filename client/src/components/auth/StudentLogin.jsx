/**
 * Student Login Component
 * Login using Roll Number + Password
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Hash, Lock, AlertCircle, Loader, ArrowLeft, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

// Validation schema
const loginSchema = z.object({
  rollNumber: z
    .string()
    .min(1, 'Roll Number is required')
    .min(3, 'Roll Number must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

const StudentLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rollNumber: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setApiError('');

      const trimmedData = {
        rollNumber: data.rollNumber.trim().toUpperCase(),
        password: data.password.trim()
      };

      const result = await authAPI.loginStudent(trimmedData);
      
      if (result.success) {
        const { user, accessToken, refreshToken } = result.data;
        
        // Check if student is verified
        if (!user.verified) {
          setApiError('Your account is pending verification by your department admin. Please wait for approval.');
          return;
        }

        // Store auth data
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        setAuthData(user, accessToken);
        navigate('/student', { replace: true });
      } else {
        setApiError(result.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setApiError(error.message || 'Invalid roll number or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center">
            <GraduationCap className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Student Portal</h1>
          <p className="text-xl opacity-90 mb-6">
            Mark attendance with face recognition
          </p>
          <div className="text-sm opacity-75 space-y-2">
            <p>✓ View your attendance records</p>
            <p>✓ Mark attendance for active classes</p>
            <p>✓ Track your attendance percentage</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login options
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Student Login
            </h2>
            <p className="text-gray-600">
              Enter your roll number and password
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{apiError}</span>
              </div>
            )}

            {/* Roll Number Field */}
            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Roll Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('rollNumber')}
                  type="text"
                  id="rollNumber"
                  className={`block w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.rollNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., CS2021001"
                  autoComplete="username"
                />
              </div>
              {errors.rollNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.rollNumber.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register/student"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Register as Student
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
