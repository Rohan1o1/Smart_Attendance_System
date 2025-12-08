/**
 * Unauthorized Access (403) Error Page
 */

import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Unauthorized = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Access Denied Illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-error-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-16 h-16 text-error-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Access Denied
          </h1>
          <p className="text-secondary-600 mb-6">
            You don't have permission to access this page. Please contact your administrator 
            if you believe this is an error.
          </p>
          
          {user && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
              <p className="text-warning-800 text-sm">
                Logged in as: <strong>{user.firstName} {user.lastName}</strong><br />
                Role: <strong className="capitalize">{user.role}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className="btn btn-outline w-full"
            >
              Switch Account
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-secondary-600">
            Need access? Contact your system administrator at{' '}
            <a 
              href="mailto:admin@attendancesys.com" 
              className="text-primary-600 hover:underline"
            >
              admin@attendancesys.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
