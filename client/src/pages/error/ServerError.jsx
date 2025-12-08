/**
 * Server Error (500) Error Page
 */

import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Home, AlertTriangle } from 'lucide-react';

const ServerError = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Server Error Illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-error-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-16 h-16 text-error-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-secondary-600 mb-6">
            We're experiencing some technical difficulties. Our team has been notified 
            and is working to fix the issue. Please try again in a few minutes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRefresh}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Page
          </button>
          
          <Link
            to="/"
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Error Code */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-secondary-600 mb-2">
            Error Code: 500 - Internal Server Error
          </p>
          <p className="text-xs text-secondary-500">
            If the problem persists, please{' '}
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

export default ServerError;
