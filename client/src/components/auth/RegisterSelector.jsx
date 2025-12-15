/**
 * Register Selector Component
 * Page for users to select their registration type
 */

import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Building,
  ArrowRight,
  ArrowLeft,
  Fingerprint,
  CheckCircle
} from 'lucide-react';

const RegisterSelector = () => {
  const registerOptions = [
    {
      title: 'Student Registration',
      description: 'For students to register with roll number',
      requirements: ['Existing department required', 'Admin verification needed', 'Roll number required'],
      icon: GraduationCap,
      path: '/register/student',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Teacher Registration',
      description: 'For teachers and faculty members',
      requirements: ['Existing department required', 'Admin verification needed', 'Employee ID optional'],
      icon: BookOpen,
      path: '/register/teacher',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: 'Admin Registration',
      description: 'For Department Heads only',
      requirements: ['New department name required', 'One admin per department', 'Auto-approved upon registration'],
      icon: Building,
      path: '/register/admin',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center">
        <div className="text-center text-white p-8 max-w-lg">
          <div className="w-32 h-32 mx-auto mb-8 bg-white/20 rounded-full flex items-center justify-center">
            <Fingerprint className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Join Smart Attendance</h1>
          <p className="text-xl opacity-90 mb-8">
            Create your account to get started
          </p>
          <div className="text-left space-y-4 text-sm">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">How Registration Works:</h3>
              <ul className="space-y-2 opacity-85">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Admins create new departments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Teachers & Students join existing departments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Admin verifies teachers & students</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Options */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600">
              Select your role to register
            </p>
          </div>

          {/* Registration Options */}
          <div className="space-y-4">
            {registerOptions.map((option) => (
              <Link
                key={option.path}
                to={option.path}
                className="block group"
              >
                <div className={`bg-white p-5 rounded-xl shadow-sm border ${option.borderColor} hover:shadow-md transition-all duration-200`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 ${option.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <option.icon className={`w-7 h-7 ${option.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {option.title}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {option.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {option.requirements.map((req, idx) => (
                          <span 
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full ${option.bgColor} ${option.textColor}`}
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSelector;
