/**
 * Register Component
 * User registration form with role selection
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Validation schema
const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[+]?[1-9][\d]{9,14}$/, 'Please enter a valid phone number'),
  studentId: z
    .string()
    .min(1, 'Student/Employee ID is required')
    .min(6, 'ID must be at least 6 characters')
    .max(12, 'ID must not exceed 12 characters')
    .regex(/^[A-Z0-9]+$/, 'ID can only contain uppercase letters and numbers'),
  role: z
    .string()
    .min(1, 'Please select a role'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      studentId: '',
      role: '',
      password: '',
      confirmPassword: ''
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setApiError('');

      const { confirmPassword, ...registrationData } = data;
      const result = await registerUser(registrationData);
      
      if (result.success) {
        setRegistrationSuccess(true);
        setTimeout(() => {
          // Redirect based on user role
          const userRole = result.user.role;
          const redirectPath = userRole === 'admin' 
            ? '/admin'
            : userRole === 'teacher'
            ? '/teacher'
            : '/student';
          
          navigate(redirectPath, { replace: true });
        }, 2000);
      } else {
        setApiError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setApiError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Registration Successful!
          </h2>
          <p className="text-secondary-600 mb-4">
            Your account has been created successfully. You will be redirected to your dashboard shortly.
          </p>
          <div className="loading-spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-secondary-600">
            Join our smart attendance system
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* API Error Alert */}
            {apiError && (
              <div className="alert alert-error">
                <AlertCircle className="w-5 h-5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('firstName')}
                    type="text"
                    id="firstName"
                    className={`form-input pl-10 ${errors.firstName ? 'border-error-300' : ''}`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="form-error">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    className={`form-input pl-10 ${errors.lastName ? 'border-error-300' : ''}`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="form-error">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
                  className={`form-input pl-10 ${errors.email ? 'border-error-300' : ''}`}
                  placeholder="john.doe@email.com"
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Phone and ID Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className={`form-input pl-10 ${errors.phone ? 'border-error-300' : ''}`}
                    placeholder="+1234567890"
                  />
                </div>
                {errors.phone && (
                  <p className="form-error">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="studentId" className="form-label">
                  {selectedRole === 'student' ? 'Student ID' : 'Employee ID'}
                </label>
                <input
                  {...register('studentId')}
                  type="text"
                  id="studentId"
                  className={`form-input ${errors.studentId ? 'border-error-300' : ''}`}
                  placeholder={selectedRole === 'student' ? 'STU123456' : 'EMP123456'}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.studentId && (
                  <p className="form-error">{errors.studentId.message}</p>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                {...register('role')}
                id="role"
                className={`form-input ${errors.role ? 'border-error-300' : ''}`}
              >
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
              {errors.role && (
                <p className="form-error">{errors.role.message}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                    className={`form-input pl-10 pr-10 ${errors.password ? 'border-error-300' : ''}`}
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-secondary-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-secondary-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'border-error-300' : ''}`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-secondary-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-secondary-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-secondary-700">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn btn-primary btn-md w-full"
            >
              {isLoading ? (
                <>
                  <Loader className="loading-spinner mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-secondary-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
