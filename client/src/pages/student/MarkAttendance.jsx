/**
 * Mark Attendance Component
 * Combines face recognition and location verification for attendance marking
 */

import { useState, useEffect } from 'react';
import { UserCheck, MapPin, Camera, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AttendanceWebcamCapture from '../../components/AttendanceWebcamCapture';
import LocationVerification from '../../components/LocationService';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI } from '../../services/api';

const MarkAttendance = ({ classSession, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState('location'); // 'location', 'face', 'processing', 'success'
  const [locationData, setLocationData] = useState(null);
  const [faceData, setFaceData] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Session location (would come from props or API)
  const sessionLocation = {
    latitude: classSession?.location?.latitude || 37.7749,
    longitude: classSession?.location?.longitude || -122.4194,
    address: classSession?.location?.address || 'Classroom A, Building 1'
  };

  const handleLocationVerification = (result) => {
    if (result.success) {
      setLocationData(result);
      setCurrentStep('face');
    } else {
      setError(result.message);
      toast.error('Location verification failed');
    }
  };

  const handleFaceCapture = async (imageData) => {
    try {
      setFaceData(imageData);
      setShowWebcam(false);
      setCurrentStep('processing');
      await processAttendance(locationData, imageData);
    } catch (error) {
      console.error('Face capture error:', error);
      toast.error('Failed to process face capture');
      setCurrentStep('face');
    }
  };

  const processAttendance = async (locationResult, faceResult) => {
    setLoading(true);
    
    try {
      console.log('Processing attendance with:', { locationResult, faceResult }); // Debug log
      
      // Prepare attendance data according to server expectations
      const attendanceData = {
        classId: classSession.classId || classSession._id, // Use classId if available, fallback to _id
        location: {
          latitude: locationResult.currentLocation?.latitude || locationResult.latitude,
          longitude: locationResult.currentLocation?.longitude || locationResult.longitude,
          accuracy: locationResult.accuracy || 10,
          address: locationResult.address || 'Unknown location'
        },
        faceImage: faceResult.imageData.includes(',') ? 
          faceResult.imageData.split(',')[1] : 
          faceResult.imageData, // Remove data:image prefix if present
        deviceInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          screen: {
            width: window.screen?.width || 1920,
            height: window.screen?.height || 1080
          }
        }
      };

      console.log('Submitting attendance data:', {
        ...attendanceData,
        faceImage: `[Image data: ${attendanceData.faceImage.length} chars]` // Don't log full image
      }); // Debug log

      // Submit attendance
      const response = await attendanceAPI.submitAttendance(attendanceData);
      
      console.log('Attendance API response:', response); // Debug log
      
      if (response.success) {
        setCurrentStep('success');
        toast.success('Attendance marked successfully!');
        
        // Call success callback after a brief delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.data);
          }
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to mark attendance');
      }
      
    } catch (error) {
      console.error('Attendance processing error:', error);
      
      // Better error handling
      if (error.message.includes('required')) {
        setError('Missing required data for attendance submission');
      } else if (error.message.includes('classId')) {
        setError('Invalid class information. Please try again.');
      } else {
        setError(error.message || 'Failed to process attendance');
      }
      
      toast.error(error.message || 'Attendance marking failed');
      setCurrentStep('location');
    } finally {
      setLoading(false);
    }
  };

  const resetProcess = () => {
    setCurrentStep('location');
    setLocationData(null);
    setFaceData(null);
    setError(null);
  };

  const getStepStatus = (step) => {
    if (currentStep === step) return 'current';
    if (
      (step === 'location' && ['face', 'processing', 'success'].includes(currentStep)) ||
      (step === 'face' && ['processing', 'success'].includes(currentStep)) ||
      (step === 'processing' && currentStep === 'success')
    ) {
      return 'completed';
    }
    return 'pending';
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'location', label: 'Location', icon: MapPin },
      { key: 'face', label: 'Face Recognition', icon: Camera },
      { key: 'processing', label: 'Processing', icon: Clock },
      { key: 'success', label: 'Complete', icon: CheckCircle }
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const status = getStepStatus(step.key);
          
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status === 'completed'
                    ? 'bg-success-100 text-success-600'
                    : status === 'current'
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  status === 'completed' || status === 'current'
                    ? 'text-secondary-900'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  key={`separator-${step.key}`}
                  className={`mx-4 h-0.5 w-12 ${
                    status === 'completed' ? 'bg-success-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">
                Mark Attendance
              </h2>
              <p className="text-secondary-600">
                {classSession?.className} - {classSession?.sessionName}
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-secondary-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card mb-6">
        <div className="card-body">
          {renderStepIndicator()}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-error-800 font-medium">Error</h4>
            <p className="text-error-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      {currentStep === 'location' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">
              Verify Location
            </h3>
            <p className="text-secondary-600">
              Ensure you're in the correct location to mark attendance
            </p>
          </div>
          <div className="card-body">
            <div className="bg-primary-50 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-primary-900 font-medium">Session Location</h4>
                  <p className="text-primary-800 text-sm">{sessionLocation.address}</p>
                  <p className="text-primary-700 text-xs mt-1">
                    {sessionLocation.latitude}, {sessionLocation.longitude}
                  </p>
                </div>
              </div>
            </div>

            <LocationVerification
              targetLocation={sessionLocation}
              allowedRadius={100}
              onVerification={handleLocationVerification}
              showMap={true}
            />
          </div>
        </div>
      )}

      {currentStep === 'face' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">
              Face Recognition
            </h3>
            <p className="text-secondary-600">
              Capture your face for identity verification
            </p>
          </div>
          <div className="card-body">
            <div className="bg-success-50 p-4 rounded-lg mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success-600" />
              <span className="text-success-800 text-sm">
                Location verified successfully
              </span>
            </div>

            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Camera className="w-12 h-12 text-primary-600" />
              </div>
              
              <div>
                <h4 className="text-secondary-900 font-medium mb-2">
                  Ready for Face Capture
                </h4>
                <p className="text-secondary-600 text-sm">
                  Click the button below to start face recognition
                </p>
              </div>

              <button
                onClick={() => setShowWebcam(true)}
                className="btn btn-primary"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Face Recognition
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'processing' && (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Processing Attendance
              </h3>
              <p className="text-secondary-600 mb-6">
                Verifying your identity and location data...
              </p>
              
              {loading && (
                <div className="flex justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentStep === 'success' && (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Attendance Marked Successfully!
              </h3>
              <p className="text-secondary-600 mb-6">
                Your attendance has been recorded for this session.
              </p>
              
              <div className="bg-success-50 p-4 rounded-lg text-sm text-success-800">
                <p>Session: {classSession?.sessionName}</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
                <p>Student: {user?.firstName} {user?.lastName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {currentStep !== 'success' && currentStep !== 'processing' && (
        <div className="flex justify-between mt-6">
          <button
            onClick={resetProcess}
            className="btn btn-secondary"
          >
            Reset
          </button>
          
          {currentStep === 'location' && (
            <span className="text-sm text-secondary-600">
              Complete location verification to continue
            </span>
          )}
          
          {currentStep === 'face' && (
            <span className="text-sm text-secondary-600">
              Complete face recognition to continue
            </span>
          )}
        </div>
      )}

      {/* Webcam Modal */}
      <AttendanceWebcamCapture
        isOpen={showWebcam}
        onCapture={handleFaceCapture}
        onClose={() => setShowWebcam(false)}
      />
    </div>
  );
};

export default MarkAttendance;
