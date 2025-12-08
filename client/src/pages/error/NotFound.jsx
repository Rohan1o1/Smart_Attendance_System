/**
 * Not Found (404) Error Page
 */

import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary-200 mb-4">404</div>
          <div className="w-32 h-32 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <Search className="w-16 h-16 text-primary-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-secondary-600 mb-6">
            Sorry, the page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
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
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-secondary-600">
            If you think this is a mistake, please{' '}
            <a 
              href="mailto:support@attendancesys.com" 
              className="text-primary-600 hover:underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
