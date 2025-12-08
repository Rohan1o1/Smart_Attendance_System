/**
 * Login Component
 * User authentication login form
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setApiError('');

      // Trim email and password to prevent whitespace issues
      const trimmedData = {
        email: data.email.trim(),
        password: data.password.trim()
      };

      console.log('🔑 Form data received:', data);
      console.log('🔑 Trimmed data:', trimmedData);
      console.log('🔑 Password details:', {
        original: data.password?.split('').map((c, i) => `${i}:'${c}'(${c.charCodeAt(0)})`),
        trimmed: trimmedData.password?.split('').map((c, i) => `${i}:'${c}'(${c.charCodeAt(0)})`)
      });
      console.log('🔑 Attempting login with:', trimmedData.email);
      const result = await login(trimmedData);
      console.log('🔑 Login result:', result);
      
      if (result.success) {
        // Redirect based on user role
        const userRole = result.user.role;
        console.log('👤 User role:', userRole);
        
        const redirectPath = userRole === 'admin' 
          ? '/admin'
          : userRole === 'teacher'
          ? '/teacher'
          : '/student';
        
        console.log('🚀 Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      } else {
        console.log('❌ Login failed:', result.error);
        setApiError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.log('❌ Login error:', error);
      setApiError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <div className="text-primary-600 font-bold text-xl">SA</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Smart Attendance</h1>
          <p className="text-xl opacity-90 mb-6">
            Face Recognition + Location Verified Attendance System
          </p>
          <div className="text-sm opacity-75">
            <p>✓ Secure face recognition technology</p>
            <p>✓ GPS location verification</p>
            <p>✓ Real-time attendance tracking</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-secondary-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-secondary-600">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* API Error Alert */}
            {apiError && (
              <div className="alert alert-error">
                <AlertCircle className="w-5 h-5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={`form-input pl-10 ${errors.email ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input pl-10 pr-10 ${errors.password ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-700">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn btn-primary btn-md w-full"
            >
              {isLoading ? (
                <>
                  <Loader className="loading-spinner mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-secondary-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Create account
                </Link>
              </p>
            </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 p-4 bg-secondary-50 rounded-lg">
            <h3 className="text-sm font-medium text-secondary-900 mb-2">Demo Accounts</h3>
            <div className="text-xs text-secondary-600 space-y-1">
              <p><strong>Student:</strong> student@demo.com / password123</p>
              <p><strong>Teacher:</strong> teacher@demo.com / password123</p>
              <p><strong>Admin:</strong> admin@demo.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
