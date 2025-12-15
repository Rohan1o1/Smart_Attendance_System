/**
 * Student Registration Component
 * Register as a student with roll number (requires existing department)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Eye, EyeOff, User, Mail, Lock, Phone, 
  AlertCircle, Loader, ArrowLeft, GraduationCap,
  Hash, Building, Calendar, Users, CheckCircle
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
  rollNumber: z
    .string()
    .min(1, 'Roll Number is required')
    .min(3, 'Roll Number must be at least 3 characters'),
  department: z
    .string()
    .min(1, 'Department is required'),
  year: z
    .number({ invalid_type_error: 'Year is required' })
    .min(1, 'Year must be between 1 and 4')
    .max(4, 'Year must be between 1 and 4'),
  semester: z
    .number({ invalid_type_error: 'Semester is required' })
    .min(1, 'Semester must be between 1 and 8')
    .max(8, 'Semester must be between 1 and 8'),
  section: z
    .string()
    .min(1, 'Section is required'),
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

const StudentRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  const navigate = useNavigate();

  const yearOptions = [1, 2, 3, 4];
  const sectionOptions = ['A', 'B', 'C', 'D', 'E'];
  const semesterOptions = [1,2,3,4,5,6,7,8];

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      rollNumber: '',
      department: '',
  year: undefined,
  semester: undefined,
      section: '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const result = await authAPI.getDepartments();
        if (result.success && result.data.departments) {
          setDepartments(result.data.departments);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setApiError('');

      // split full name into firstName and lastName
      const parts = data.name.trim().split(/\s+/);
      const firstName = parts.shift() || '';
      const lastName = parts.join(' ') || '';

      const userData = {
        firstName,
        lastName,
        email: data.email.trim().toLowerCase(),
        rollNumber: data.rollNumber.trim().toUpperCase(),
        department: data.department,
        year: Number(data.year),
        semester: Number(data.semester),
        section: data.section,
        phoneNumber: data.phone?.trim() || undefined,
        password: data.password
      };

      const result = await authAPI.registerStudent(userData);
      
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
              Your account has been created. Please wait for your department admin to verify your account before you can login.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You will be able to login once your account is verified by the department admin.
              </p>
            </div>
            <Link
              to="/login/student"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
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
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center">
            <GraduationCap className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Student Registration</h1>
          <p className="text-lg opacity-90">
            Join your department and start marking attendance
          </p>
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
              <div className="w-14 h-14 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Register as Student
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Fill in your details to create an account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{apiError}</span>
                </div>
              )}

              {departments.length === 0 && !loadingDepartments && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  <p className="text-sm">
                    <strong>No departments available.</strong> Please wait for an admin to register a department first.
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('name')}
                    type="text"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="John Doe"
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
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="student@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('rollNumber')}
                    type="text"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.rollNumber ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="CS2021001"
                  />
                </div>
                {errors.rollNumber && <p className="mt-1 text-xs text-red-600">{errors.rollNumber.message}</p>}
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    {...register('department')}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${errors.department ? 'border-red-300' : 'border-gray-300'}`}
                    disabled={loadingDepartments || departments.length === 0}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>}
              </div>

              {/* Year and Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      {...register('year', { valueAsNumber: true })}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${errors.year ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year} Year</option>
                      ))}
                    </select>
                  </div>
                  {errors.year && <p className="mt-1 text-xs text-red-600">{errors.year.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      {...register('section')}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${errors.section ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Select Section</option>
                      {sectionOptions.map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                  {errors.section && <p className="mt-1 text-xs text-red-600">{errors.section.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      {...register('semester', { valueAsNumber: true })}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${errors.semester ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Select Semester</option>
                      {semesterOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {errors.semester && <p className="mt-1 text-xs text-red-600">{errors.semester.message}</p>}
                </div>
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
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
                    className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
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
                disabled={isLoading || departments.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link to="/login/student" className="font-semibold text-blue-600 hover:text-blue-700">
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

export default StudentRegister;
