/**
 * Login Selector Component
 * Landing page for users to select their login type
 */

import { Link } from 'react-router-dom';
import { 
  Shield, 
  GraduationCap, 
  BookOpen, 
  Building,
  ArrowRight,
  Fingerprint,
  MapPin
} from 'lucide-react';

const LoginSelector = () => {
  const loginOptions = [
    {
      title: 'Student Login',
      description: 'Login using your Roll Number',
      icon: GraduationCap,
      path: '/login/student',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Teacher Login',
      description: 'Login using your Email',
      icon: BookOpen,
      path: '/login/teacher',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Admin Login',
      description: 'Department Head Login',
      icon: Building,
      path: '/login/admin',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'SuperAdmin Login',
      description: 'System Administrator',
      icon: Shield,
      path: '/login/superadmin',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center">
        <div className="text-center text-white p-8 max-w-lg">
          <div className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <Fingerprint className="w-10 h-10 text-primary-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Smart Attendance</h1>
          <p className="text-xl opacity-90 mb-8">
            Face Recognition + Location Verified Attendance System
          </p>
          <div className="text-left space-y-3 text-sm opacity-85">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5" />
              <span>AI-powered face recognition</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <span>GPS location verification</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span>Secure & tamper-proof</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Options */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Select your role to continue
            </p>
          </div>

          {/* Login Options */}
          <div className="space-y-4">
            {loginOptions.map((option) => (
              <Link
                key={option.path}
                to={option.path}
                className="block group"
              >
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${option.bgColor} rounded-xl flex items-center justify-center`}>
                      <option.icon className={`w-7 h-7 ${option.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSelector;
