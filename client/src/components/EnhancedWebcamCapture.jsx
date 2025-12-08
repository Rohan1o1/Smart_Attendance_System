import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, CheckCircle, RotateCcw, User, AlertCircle, Zap } from 'lucide-react';
import enhancedFaceDetectionService from '../utils/enhancedFaceDetection';
import SimpleFaceDetectionTest from '../utils/simpleFaceDetectionTest';

const EnhancedWebcamCapture = ({ onCapture, onClose, isOpen, captureStep = 0 }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedFace, setDetectedFace] = useState(null);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [faceServiceReady, setFaceServiceReady] = useState(false);
  const [qualityFeedback, setQualityFeedback] = useState([]);
  const [canCapture, setCanCapture] = useState(false);
  const streamRef = useRef(null);
  const detectionCleanupRef = useRef(null);
  const testService = useRef(new SimpleFaceDetectionTest());

  // Face capture instructions for different steps
  const captureInstructions = [
    { step: 0, title: "Front View", instruction: "Look straight at the camera", icon: User },
    { step: 1, title: "Left Profile", instruction: "Turn your head slightly to the left", icon: RotateCcw },
    { step: 2, title: "Right Profile", instruction: "Turn your head slightly to the right", icon: RotateCcw }
  ];

  const currentInstruction = captureInstructions[captureStep] || captureInstructions[0];

  // Initialize enhanced face detection
  useEffect(() => {
    const initializeFaceDetection = async () => {
      try {
        console.log('🚀 Initializing face detection...');
        
        // Try the simple test first
        const testResult = await testService.current.testInitialization();
        if (testResult) {
          console.log('✅ Simple face detection test passed');
          // Now try the full enhanced service
          const ready = await enhancedFaceDetectionService.initialize();
          setFaceServiceReady(ready);
          console.log('Enhanced face detection ready:', ready);
        } else {
          console.warn('⚠️ Simple face detection test failed, enabling basic mode');
          setFaceServiceReady(false);
        }
      } catch (error) {
        console.error('❌ Face detection initialization failed:', error);
        setFaceServiceReady(false);
      }
    };

    initializeFaceDetection();
  }, []);

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
        
        // Start face detection after camera is ready
        if (faceServiceReady) {
          startFaceDetection();
        }
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setError(error.message.includes('Permission denied') 
        ? 'Camera permission denied. Please allow camera access and reload.' 
        : 'Failed to initialize camera. Please check your camera connection.');
    } finally {
      setLoading(false);
    }
  }, [isOpen, faceServiceReady]);

  // Start real-time face detection
  const startFaceDetection = useCallback(() => {
    if (!faceServiceReady || !videoRef.current || detectionCleanupRef.current) {
      return;
    }

    setFaceDetectionActive(true);

    // Start real-time detection
    detectionCleanupRef.current = enhancedFaceDetectionService.startRealTimeDetection(
      videoRef.current,
      (result) => {
        console.log('Detection result:', result); // Debug log
        setDetectedFace(result.face);
        setQualityFeedback(result.face?.feedback || []);
        
        // Lower threshold temporarily and add manual override
        const qualityScore = result.face?.quality?.overall || 0;
        const hasQuality = qualityScore >= 0.5; // Lower threshold from 0.7 to 0.5
        const hasFace = !!result.face;
        
        console.log('Quality score:', qualityScore, 'Has face:', hasFace, 'Can capture:', hasQuality || hasFace);
        setCanCapture(hasQuality || hasFace); // Enable if face detected, even with lower quality
        
        // Draw detection overlay
        drawFaceOverlay(result.face);
      },
      {
        interval: 100, // Check every 100ms
        minQuality: 0.5 // Lower threshold for testing
      }
    );
  }, [faceServiceReady]);

  // Draw face detection overlay
  const drawFaceOverlay = useCallback((face) => {
    const overlayCanvas = overlayCanvasRef.current;
    const video = videoRef.current;
    
    if (!overlayCanvas || !video || !face) {
      if (overlayCanvas) {
        const ctx = overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
      return;
    }

    // Set canvas size to match video
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;
    
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw face bounding box
    const { x, y, width, height } = face.box;
    const quality = face.quality.overall;
    
    // Color based on quality
    const color = quality > 0.8 ? '#10B981' : quality > 0.5 ? '#F59E0B' : '#EF4444';
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    
    // Draw quality indicator
    ctx.fillStyle = color;
    ctx.font = '16px Arial';
    ctx.fillText(`Quality: ${(quality * 100).toFixed(0)}%`, x, y - 10);
    
    // Draw landmarks if available
    if (face.landmarks && face.landmarks.positions) {
      ctx.fillStyle = color;
      face.landmarks.positions.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, []);

  // Stop face detection
  const stopFaceDetection = useCallback(() => {
    if (detectionCleanupRef.current) {
      detectionCleanupRef.current();
      detectionCleanupRef.current = null;
    }
    setFaceDetectionActive(false);
    setDetectedFace(null);
    setQualityFeedback([]);
    setCanCapture(false);
  }, []);

  // Capture image with enhanced quality
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !canCapture) {
      return;
    }

    try {
      setLoading(true);
      console.log('Confirm capture clicked');
      
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
      
      console.log('Processing captured image...');
      
      // Prepare face data with metadata
      const faceData = {
        imageData: imageDataUrl,
        timestamp: new Date().toISOString(),
        metadata: {
          step: captureStep,
          quality: detectedFace?.quality || {},
          confidence: detectedFace?.confidence || 0,
          faceBox: detectedFace?.box || null,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
          }
        }
      };
      
      console.log('Face data prepared:', faceData);
      
    } catch (error) {
      console.error('Capture error:', error);
      setError('Failed to capture image. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [canCapture, captureStep, detectedFace]);

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
          quality: detectedFace?.quality || {},
          confidence: detectedFace?.confidence || 0,
          faceBox: detectedFace?.box || null
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
  }, [capturedImage, onCapture, captureStep, detectedFace]);

  // Retake image
  const retakeImage = useCallback(() => {
    setCapturedImage(null);
    setShowPreview(false);
    if (faceServiceReady && isStreaming) {
      startFaceDetection();
    }
  }, [faceServiceReady, isStreaming, startFaceDetection]);

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
    stopFaceDetection();
    
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
  }, [stopFaceDetection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
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

            {/* Face Detection Overlay */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)', pointerEvents: 'none' }}
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

          {/* Face Detection Status */}
          {isStreaming && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Face Detection Status:</span>
                <div className="flex items-center space-x-2">
                  {faceDetectionActive ? (
                    <Zap className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${faceDetectionActive ? 'text-green-600' : 'text-red-600'}`}>
                    {faceDetectionActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Quality Feedback */}
              {qualityFeedback.length > 0 && (
                <div className="space-y-1">
                  {qualityFeedback.map((feedback, index) => (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        feedback.includes('Good') 
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}
                    >
                      {feedback}
                    </div>
                  ))}
                </div>
              )}

              {/* Face Quality Indicator */}
              {detectedFace && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Face Quality:</span>
                    <span>{(detectedFace.quality.overall * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        detectedFace.quality.overall > 0.8 ? 'bg-green-500' :
                        detectedFace.quality.overall > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${detectedFace.quality.overall * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
        
        {/* Fixed Footer with Buttons */}
        <div className="border-t bg-gray-50 p-4 flex-shrink-0">
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
              <>
                <button
                  onClick={captureImage}
                  disabled={loading || !isStreaming || !canCapture}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 ${
                    canCapture
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  <Camera className="h-5 w-5" />
                  <span>{canCapture ? 'Capture Photo' : 'Position Your Face'}</span>
                </button>
                
                {/* Force Capture Button - Always Available */}
                {!canCapture && isStreaming && (
                  <button
                    onClick={captureImage}
                    disabled={loading || !isStreaming}
                    className="flex items-center space-x-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Force Capture</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWebcamCapture;
