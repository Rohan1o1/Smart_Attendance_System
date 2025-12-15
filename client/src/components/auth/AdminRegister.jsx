/**
 * Admin Registration Component
 * Register as Department Head (creates NEW department)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Eye, EyeOff, User, Mail, Lock, Phone, 
  AlertCircle, Loader, ArrowLeft, Building,
  BadgeCheck, CheckCircle, Info
} from 'lucide-react';
import { authAPI } from '../../services/api';

// Validation schema
const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  department: z
    .string()
    .min(1, 'Department name is required')
    .min(2, 'Department name must be at least 2 characters'),
  adminId: z
    .string()
    .min(8, 'Admin ID must be 8-12 digits')
    .max(12, 'Admin ID must be 8-12 digits')
    .regex(/^\d{8,12}$/, 'Admin ID must be numeric (8-12 digits)'),
  phone: z
    .string()
    .optional(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Confirm password is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const AdminRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingDepartments, setExistingDepartments] = useState([]);
  
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      department: '',
      adminId: '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  const watchDepartment = watch('department');

  // Fetch existing departments to show which ones are taken
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const result = await authAPI.getDepartments();
        if (result.success && result.data.departments) {
          setExistingDepartments(result.data.departments.map(d => d.toLowerCase()));
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const isDepartmentTaken = watchDepartment && existingDepartments.includes(watchDepartment.toLowerCase().trim());

  const onSubmit = async (data) => {
    if (isDepartmentTaken) {
      setApiError('This department already has an admin. Please choose a different department name.');
      return;
    }

    try {
      setIsLoading(true);
      setApiError('');

      // Split name into firstName and lastName (simple split on first space)
      const [firstName, ...rest] = data.name.trim().split(' ');
      const lastName = rest.join(' ') || '';

      const userData = {
        firstName: firstName,
        lastName: lastName,
        email: data.email.trim().toLowerCase(),
        department: data.department.trim(),
        adminId: data.adminId?.trim() || undefined,
        phoneNumber: data.phone?.trim() || undefined,
        password: data.password
      };

      const result = await authAPI.registerAdmin(userData);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setApiError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Registration Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your department admin account has been created. You can now login and start verifying teachers and students in your department.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>✓ Ready to use:</strong> As admin, your account is automatically verified. You can login right away!
              </p>
            </div>
            <Link
              to="/login/admin"
              className="inline-block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-purple-500 to-purple-700 items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center">
            <Building className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Admin Registration</h1>
          <p className="text-lg opacity-90 mb-6">
            Create a new department and become the admin
          </p>
          <div className="text-left bg-white/10 p-4 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">As Department Admin, you can:</h3>
            <ul className="space-y-2 opacity-85">
              <li>✓ Verify teachers in your department</li>
              <li>✓ Verify students in your department</li>
              <li>✓ View department attendance analytics</li>
              <li>✓ Manage department users</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg">
          <Link
            to="/register"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to registration options
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Building className="w-7 h-7 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Register as Admin
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Create a new department
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{apiError}</span>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-800">
                    <strong>Important:</strong> You must enter a NEW department name. Each department can only have one admin.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('name')}
                    type="text"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Dr. John Smith"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="admin@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              {/* Department Name (New) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name (New)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('department')}
                    type="text"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                      errors.department || isDepartmentTaken ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Computer Science"
                  />
                </div>
                {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>}
                {isDepartmentTaken && (
                  <p className="mt-1 text-xs text-red-600">
                    This department already exists. Please choose a different name.
                  </p>
                )}
                {watchDepartment && !isDepartmentTaken && watchDepartment.trim().length >= 2 && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Department name is available
                  </p>
                )}
              </div>

              {/* Admin ID (required, numeric 8-12 digits) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin ID</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('adminId')}
                    type="text"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.adminId ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="12345678"
                  />
                </div>
                {errors.adminId && <p className="mt-1 text-xs text-red-600">{errors.adminId.message}</p>}
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isDepartmentTaken}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Creating Department...
                  </>
                ) : (
                  'Create Department & Account'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link to="/login/admin" className="font-semibold text-purple-600 hover:text-purple-700">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
