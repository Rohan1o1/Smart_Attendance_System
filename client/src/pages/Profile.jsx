/**
 * User Profile Page
 * Allows users to view and edit their profile information
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, Edit3, Save, X, User, Mail, Phone, MapPin, Calendar, Shield, Eye, Upload, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import BasicWebcamCapture from '../components/BasicWebcamCapture';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWebcamCapture, setShowWebcamCapture] = useState(false);
  const [faceDataRegistered, setFaceDataRegistered] = useState(false);
  const [faceStatusLoading, setFaceStatusLoading] = useState(true);
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentCaptureStep, setCurrentCaptureStep] = useState(0);
  const [useBasicCapture, setUseBasicCapture] = useState(true); // Default to basic capture
  const [EnhancedWebcamCapture, setEnhancedWebcamCapture] = useState(null);
  const [enhancedCaptureLoading, setEnhancedCaptureLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const fileInputRef = useRef(null);

  // Load face status on component mount
  useEffect(() => {
    const loadFaceStatus = async () => {
      try {
        setFaceStatusLoading(true);
        const response = await userAPI.getFaceStatus();
        console.log('Face status response:', response); // Debug log
        setFaceDataRegistered(response.data.hasFaceData);
      } catch (error) {
        console.error('Error loading face status:', error);
        // If there's an error, assume no face data
        setFaceDataRegistered(false);
      } finally {
        setFaceStatusLoading(false);
      }
    };

    loadFaceStatus();
  }, []);

  // Function to load enhanced capture dynamically
  const loadEnhancedCapture = async () => {
    if (EnhancedWebcamCapture) return; // Already loaded
    
    try {
      setEnhancedCaptureLoading(true);
      console.log('Loading enhanced capture component...');
      const module = await import('../components/EnhancedWebcamCapture');
      setEnhancedWebcamCapture(() => module.default);
      console.log('Enhanced capture component loaded successfully');
    } catch (error) {
      console.error('Failed to load enhanced capture:', error);
      toast.error('Enhanced capture failed to load. Using basic capture instead.');
      setUseBasicCapture(true);
    } finally {
      setEnhancedCaptureLoading(false);
    }
  };

  // Function to refresh face status
  const refreshFaceStatus = async (showToast = false) => {
    try {
      setFaceStatusLoading(true);
      const response = await userAPI.getFaceStatus();
      console.log('Refreshed face status:', response); // Debug log
      setFaceDataRegistered(response.data.hasFaceData);
      if (showToast) {
        toast.success('Face status refreshed');
      }
    } catch (error) {
      console.error('Error refreshing face status:', error);
      if (showToast) {
        toast.error('Failed to refresh face status');
      }
    } finally {
      setFaceStatusLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return;

    setLoading(true);
    try {
      const response = await userAPI.updateProfile(formData);
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    setLoading(true);
    try {
      const response = await userAPI.uploadProfileImage(formData);
      updateUser(response.data);
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const captureSteps = [
    { step: 0, title: "Front View", instruction: "Look straight at the camera" },
    { step: 1, title: "Left Profile", instruction: "Turn your head slightly to the left" },
    { step: 2, title: "Right Profile", instruction: "Turn your head slightly to the right" }
  ];

  const handleFaceDataCapture = async (faceData) => {
    console.log('handleFaceDataCapture called with:', faceData); // Debug log
    
    // Keep the full data URL format (server expects data:image/jpeg;base64,...)
    const fullImageData = faceData.imageData;
    
    // Add the captured image to our collection
    const newCapturedImages = [...capturedImages, fullImageData];
    setCapturedImages(newCapturedImages);
    
    // Check if we have captured enough images
    if (newCapturedImages.length < 3) {
      // Move to next step
      setCurrentCaptureStep(currentCaptureStep + 1);
      toast.success(`Image ${newCapturedImages.length} of 3 captured successfully!`);
      return;
    }
    
    // We have all 3 images, now process them
    console.log('Processing all 3 captured images...'); // Debug log
    setLoading(true);
    
    try {
      // Use the 3 different captured images
      const apiData = {
        images: newCapturedImages, // Use all 3 captured images
        metadata: faceData.metadata
      };

      console.log('API data prepared:', { 
        imagesCount: apiData.images.length,
        imageLength: newCapturedImages[0].length,
        metadata: apiData.metadata 
      }); // Debug log

      let response;
      let isUpdate = faceDataRegistered;
      
      console.log('Starting API call...'); // Debug log
      
      try {
        if (faceDataRegistered) {
          console.log('Updating existing face data...'); // Debug log
          response = await userAPI.updateFaceData(apiData);
        } else {
          console.log('Registering new face data...'); // Debug log
          response = await userAPI.registerFaceData(apiData);
        }
      } catch (error) {
        // If register fails because data already exists, try update instead
        if (!faceDataRegistered && error.status === 400 && error.message?.includes('already registered')) {
          console.log('Face data already exists, switching to update...'); // Debug log
          response = await userAPI.updateFaceData(apiData);
          isUpdate = true;
          setFaceDataRegistered(true); // Update local state
        } else {
          throw error; // Re-throw if it's a different error
        }
      }
      
      console.log('API response received:', response); // Debug log
      
      updateUser(response.data.user);
      setFaceDataRegistered(true);
      setShowWebcamCapture(false);
      
      // Reset capture state
      setCapturedImages([]);
      setCurrentCaptureStep(0);
      
      // Refresh face status to ensure consistency
      await refreshFaceStatus();
      
      toast.success(isUpdate ? 'Face data updated successfully!' : 'Face data registered successfully!');
    } catch (error) {
      console.error('Face data operation error:', error);
      toast.error(error.message || 'Failed to process face data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFaceData = async () => {
    if (!confirm('Are you sure you want to remove your face data? This will affect attendance verification.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.removeFaceData();
      updateUser(response.data);
      setFaceDataRegistered(false);
      
      // Refresh face status to ensure consistency
      await refreshFaceStatus();
      
      toast.success('Face data removed successfully!');
    } catch (error) {
      console.error('Face data removal error:', error);
      toast.error(error.message || 'Failed to remove face data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelFaceCapture = () => {
    setShowWebcamCapture(false);
    setCapturedImages([]);
    setCurrentCaptureStep(0);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-error-100 text-error-800';
      case 'teacher':
        return 'bg-warning-100 text-warning-800';
      case 'student':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-secondary-900">Profile</h1>
          <p className="text-secondary-600">Manage your account information</p>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary-600">
                        {getInitials(user?.firstName, user?.lastName)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input-field pl-10"
                        placeholder="Enter your first name"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input-field pl-10"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input-field pl-10"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="input-field pl-10"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-secondary-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows="3"
                      className="input-field pl-10"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                {/* Account Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Member Since
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="text"
                        value={new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                        disabled
                        className="input-field pl-10 bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={user?.studentId || user?._id || 'N/A'}
                      disabled
                      className="input-field bg-gray-50"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="btn btn-secondary flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-secondary-900">Security</h2>
          <p className="text-secondary-600">Manage your password and security settings</p>
        </div>
        <div className="card-body">
          <button className="btn btn-outline">
            Change Password
          </button>
        </div>
      </div>

      {/* Face Recognition Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-secondary-900">Face Recognition</h2>
            </div>
            <button
              onClick={() => refreshFaceStatus(true)}
              disabled={faceStatusLoading}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${faceStatusLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
          <p className="text-secondary-600">Register your face data for secure attendance verification</p>
        </div>
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Face Data Status */}
            <div className="flex-1">
              <div className="border rounded-lg p-4 bg-secondary-50">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${faceDataRegistered ? 'bg-success-100' : 'bg-warning-100'}`}>
                    {faceDataRegistered ? (
                      <CheckCircle className="w-6 h-6 text-success-600" />
                    ) : (
                      <Eye className="w-6 h-6 text-warning-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-900 mb-1">
                      {faceDataRegistered ? 'Face Data Registered' : 'Face Data Not Registered'}
                    </h3>
                    <p className="text-sm text-secondary-600 mb-3">
                      {faceDataRegistered 
                        ? 'Your face data is registered and ready for attendance verification.'
                        : 'Register your face data to enable secure attendance marking with face recognition.'
                      }
                    </p>
                    
                    {faceDataRegistered && user?.faceEmbeddings && user.faceEmbeddings.length > 0 && (
                      <p className="text-xs text-secondary-500">
                        Registered: {new Date(user.faceEmbeddings[0]?.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                <h4 className="text-sm font-medium text-primary-900 mb-2">Important Notes:</h4>
                <ul className="text-xs text-primary-700 space-y-1">
                  <li>• Face data is used only for attendance verification</li>
                  <li>• Ensure good lighting when capturing your face</li>
                  <li>• You can update your face data anytime if needed</li>
                  <li>• Face data is securely stored and encrypted</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 min-w-[200px]">
              {faceStatusLoading ? (
                <div className="btn btn-secondary opacity-50">
                  Loading...
                </div>
              ) : !faceDataRegistered ? (
                <>
                  <button
                    onClick={() => { setUseBasicCapture(true); setShowWebcamCapture(true); }}
                    disabled={loading}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {loading ? 'Processing...' : 'Register Face Data'}
                  </button>
                  <button
                    onClick={async () => { 
                      await loadEnhancedCapture(); 
                      if (EnhancedWebcamCapture) {
                        setUseBasicCapture(false); 
                        setShowWebcamCapture(true);
                      }
                    }}
                    disabled={loading || enhancedCaptureLoading}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {enhancedCaptureLoading ? 'Loading...' : 'Smart Face Capture'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setUseBasicCapture(true); setShowWebcamCapture(true); }}
                    disabled={loading}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {loading ? 'Processing...' : 'Update Face Data'}
                  </button>
                  <button
                    onClick={async () => { 
                      await loadEnhancedCapture(); 
                      if (EnhancedWebcamCapture) {
                        setUseBasicCapture(false); 
                        setShowWebcamCapture(true);
                      }
                    }}
                    disabled={loading || enhancedCaptureLoading}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {enhancedCaptureLoading ? 'Loading...' : 'Smart Update'}
                  </button>
                  <button
                    onClick={handleRemoveFaceData}
                    disabled={loading}
                    className="btn btn-outline text-error-600 border-error-200 hover:bg-error-50 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Remove Face Data
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Webcam Capture Modal */}
      {showWebcamCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Face Registration - Step {currentCaptureStep + 1} of 3</h3>
              <button 
                onClick={handleCancelFaceCapture}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Multi-step Progress */}
            <div className="mb-6">
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((capturedImages.length) / 3) * 100}%` }}
                ></div>
              </div>
              
              {/* Current Step Instructions */}
              <div className="text-center">
                <h4 className="text-md font-medium text-gray-800">
                  {captureSteps[currentCaptureStep]?.title || "Complete"}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {captureSteps[currentCaptureStep]?.instruction || "All images captured"}
                </p>
                
                {capturedImages.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✅ {capturedImages.length} of 3 images captured
                  </p>
                )}
                
                {loading && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <p className="text-sm text-blue-600 font-medium">
                        Processing your face data... Please wait.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {useBasicCapture || !EnhancedWebcamCapture ? (
              <BasicWebcamCapture
                isOpen={true}
                onClose={handleCancelFaceCapture}
                onCapture={handleFaceDataCapture}
                captureStep={currentCaptureStep}
                embedded={true}
              />
            ) : (
              <EnhancedWebcamCapture
                isOpen={true}
                onClose={handleCancelFaceCapture}
                onCapture={handleFaceDataCapture}
                captureStep={currentCaptureStep}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
