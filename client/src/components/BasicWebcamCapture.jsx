import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, CheckCircle, RotateCcw, User, AlertCircle } from 'lucide-react';

// Pure basic webcam capture with no dependencies on face-api.js or TensorFlow.js
const BasicWebcamCapture = ({ onCapture, onClose, isOpen, captureStep = 0, embedded = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const streamRef = useRef(null);

  // Face capture instructions for different steps
  const captureInstructions = [
    { step: 0, title: "Front View", instruction: "Look straight at the camera", icon: User },
    { step: 1, title: "Left Profile", instruction: "Turn your head slightly to the left", icon: RotateCcw },
    { step: 2, title: "Right Profile", instruction: "Turn your head slightly to the right", icon: RotateCcw }
  ];

  const currentInstruction = captureInstructions[captureStep] || captureInstructions[0];

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!isOpen) return;

    try {
      setLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });

        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setError(error.message.includes('Permission denied') 
        ? 'Camera permission denied. Please allow camera access and reload.' 
        : 'Failed to initialize camera. Please check your camera connection.');
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  // Capture image
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      setLoading(true);
      console.log('Basic capture clicked');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to high-quality JPEG
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      setCapturedImage(imageDataUrl);
      setShowPreview(true);
      
      console.log('Image captured successfully');
      
    } catch (error) {
      console.error('Capture error:', error);
      setError('Failed to capture image. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Confirm captured image
  const handleConfirmCapture = useCallback(async () => {
    if (!capturedImage) return;
    
    try {
      setLoading(true);
      
      const faceData = {
        imageData: capturedImage,
        timestamp: new Date().toISOString(),
        metadata: {
          step: captureStep,
          captureMode: 'basic',
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }
        }
      };
      
      console.log('handleFaceDataCapture called with:', faceData);
      
      if (onCapture) {
        await onCapture(faceData);
        console.log('onCapture called successfully');
      }
      
      // Reset for next capture
      setCapturedImage(null);
      setShowPreview(false);
      
    } catch (error) {
      console.error('Confirm capture error:', error);
      setError('Failed to process captured image. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [capturedImage, onCapture, captureStep]);

  // Retake image
  const retakeImage = useCallback(() => {
    setCapturedImage(null);
    setShowPreview(false);
  }, []);

  // Cleanup
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isOpen, initializeCamera]);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setCapturedImage(null);
    setShowPreview(false);
    setError(null);
  }, []);

  if (!isOpen) return null;

  const content = (
    <div className={embedded ? "" : "bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh]"}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <currentInstruction.icon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Face Recognition Capture</h3>
              <p className="text-sm text-gray-600">{currentInstruction.title} - {currentInstruction.instruction}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className={embedded ? "" : "p-6"}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Camera View */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
              <div className="text-white text-center">
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Initializing camera...</p>
              </div>
            </div>
          )}

          {/* Video Stream */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }} // Mirror effect
          />

          {/* Hidden Canvas for Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Capture Preview */}
          {showPreview && capturedImage && (
            <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-full max-h-full object-contain"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            📸 Basic capture mode (no face detection). Position your face clearly in the frame and click capture when ready.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {showPreview ? (
            <>
              <button
                onClick={retakeImage}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retake</span>
              </button>
              <button
                onClick={handleConfirmCapture}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{loading ? 'Processing...' : 'Confirm'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={captureImage}
              disabled={loading || !isStreaming}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />
              <span>{isStreaming ? 'Capture Photo' : 'Starting Camera...'}</span>
            </button>
          )}
        </div>

        {/* Instructions */}
        {!showPreview && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Position your face clearly in the frame. The camera will capture your image when you click the button.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Return with or without modal wrapper
  return embedded ? content : (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      {content}
    </div>
  );
};

export default BasicWebcamCapture;
