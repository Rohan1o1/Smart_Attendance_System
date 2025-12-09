import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, CheckCircle, RotateCcw, AlertCircle, Loader } from 'lucide-react';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

/**
 * Attendance Webcam Capture Component
 * Real face detection with bounding box visualization for attendance marking
 * Matches the same face detection used in face registration
 */
const AttendanceWebcamCapture = ({ onCapture, onClose, isOpen }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const faceDetectionActiveRef = useRef(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedFace, setDetectedFace] = useState(null);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [initializingModels, setInitializingModels] = useState(true);
  const [qualityScore, setQualityScore] = useState(0);
  const [initStatus, setInitStatus] = useState('Starting...');

  // Initialize TensorFlow.js and face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setInitializingModels(true);
        console.log('🔄 Initializing TensorFlow.js and face detection models...');

        // Step 1: Initialize TensorFlow.js backend
        setInitStatus('Initializing TensorFlow.js...');
        try {
          await tf.setBackend('webgl');
          await tf.ready();
          console.log('✅ TensorFlow.js WebGL backend ready');
        } catch (webglError) {
          console.warn('⚠️ WebGL failed, trying CPU:', webglError);
          await tf.setBackend('cpu');
          await tf.ready();
          console.log('✅ TensorFlow.js CPU backend ready');
        }
        console.log('🔧 TensorFlow.js backend:', tf.getBackend());

        // Wait for engine to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 300));

        const MODEL_URL = '/models';

        // Step 2: Load TinyFaceDetector
        setInitStatus('Loading face detector...');
        console.log('📦 Loading TinyFaceDetector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('✅ TinyFaceDetector loaded');

        // Step 3: Load Face Landmarks
        setInitStatus('Loading face landmarks...');
        console.log('📦 Loading FaceLandmark68Net...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log('✅ FaceLandmark68Net loaded');

        // Step 4: Load Face Recognition
        setInitStatus('Loading face recognition...');
        console.log('📦 Loading FaceRecognitionNet...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log('✅ FaceRecognitionNet loaded');

        console.log('✅ All face detection models loaded successfully');
        setInitStatus('Ready');
        setModelsLoaded(true);
      } catch (error) {
        console.error('❌ Failed to load face detection models:', error);
        setError(`Failed to load face detection: ${error.message}`);
        setInitStatus('Failed');
      } finally {
        setInitializingModels(false);
      }
    };

    loadModels();
  }, []);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!isOpen) return;

    try {
      setLoading(true);
      setError(null);
      console.log('📷 Initializing camera...');

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
        console.log('✅ Camera streaming, video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        setIsStreaming(true);
        // Face detection will be started by the useEffect that watches isStreaming
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setError(
        error.message.includes('Permission denied')
          ? 'Camera permission denied. Please allow camera access and reload.'
          : 'Failed to initialize camera. Please check your camera connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  // Start real-time face detection
  const startFaceDetection = useCallback(() => {
    if (!modelsLoaded || !videoRef.current) {
      console.log('⚠️ Cannot start face detection - models loaded:', modelsLoaded, 'video:', !!videoRef.current);
      return;
    }

    // Stop any existing detection
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    faceDetectionActiveRef.current = true;
    setFaceDetectionActive(true);
    console.log('🎯 Starting real-time face detection...');

    const detectFaces = async () => {
      // Use ref instead of state for immediate check
      if (!videoRef.current || !faceDetectionActiveRef.current) {
        return;
      }

      try {
        const video = videoRef.current;
        
        if (video.readyState !== 4 || video.videoWidth === 0) {
          console.log('⏳ Video not ready, state:', video.readyState, 'width:', video.videoWidth);
          return;
        }

        // Detect face with landmarks and descriptor
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 320, // Smaller for faster detection
            scoreThreshold: 0.4 // Lower threshold for better detection
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          console.log('✅ Face detected! Score:', detection.detection.score.toFixed(2));
          const quality = assessFaceQuality(detection, video);
          setDetectedFace({
            box: detection.detection.box,
            landmarks: detection.landmarks,
            descriptor: detection.descriptor,
            score: detection.detection.score,
            quality
          });
          setQualityScore(quality.overall);
          
          // Draw overlay
          drawFaceOverlay(detection, quality);
        } else {
          setDetectedFace(null);
          setQualityScore(0);
          clearOverlay();
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    };

    // Run detection every 150ms (slightly slower for stability)
    detectionIntervalRef.current = setInterval(detectFaces, 150);
    
    // Run first detection after a short delay
    setTimeout(detectFaces, 500);
  }, [modelsLoaded]);

  // Assess face quality
  const assessFaceQuality = (detection, videoElement) => {
    const box = detection.detection.box;
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    // Size score (face should be at least 15% of frame)
    const faceArea = (box.width * box.height) / (videoWidth * videoHeight);
    const sizeScore = Math.min(1, faceArea / 0.15);

    // Position score (face should be centered)
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const idealCenterX = videoWidth / 2;
    const idealCenterY = videoHeight / 2;
    
    const distanceFromCenter = Math.sqrt(
      Math.pow((faceCenterX - idealCenterX) / videoWidth, 2) +
      Math.pow((faceCenterY - idealCenterY) / videoHeight, 2)
    );
    const positionScore = Math.max(0, 1 - distanceFromCenter * 2);

    // Detection confidence score
    const confidenceScore = detection.detection.score;

    // Overall quality
    const overall = (sizeScore * 0.3 + positionScore * 0.3 + confidenceScore * 0.4);

    return {
      overall,
      size: sizeScore,
      position: positionScore,
      confidence: confidenceScore,
      feedback: getFeedback(sizeScore, positionScore, confidenceScore)
    };
  };

  // Generate feedback messages
  const getFeedback = (sizeScore, positionScore, confidenceScore) => {
    const feedback = [];
    
    if (sizeScore < 0.5) {
      feedback.push('Move closer to the camera');
    }
    if (positionScore < 0.5) {
      feedback.push('Center your face in the frame');
    }
    if (confidenceScore < 0.7) {
      feedback.push('Ensure better lighting');
    }
    
    return feedback;
  };

  // Draw face overlay on canvas
  const drawFaceOverlay = (detection, quality) => {
    const overlayCanvas = overlayCanvasRef.current;
    const video = videoRef.current;

    if (!overlayCanvas || !video) return;

    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;

    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    const box = detection.detection.box;
    
    // Color based on quality
    const color = quality.overall > 0.7 ? '#10B981' : quality.overall > 0.5 ? '#F59E0B' : '#EF4444';

    // Draw bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw corner accents
    const cornerLength = 20;
    ctx.lineWidth = 4;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + cornerLength);
    ctx.lineTo(box.x, box.y);
    ctx.lineTo(box.x + cornerLength, box.y);
    ctx.stroke();
    
    // Top-right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerLength, box.y);
    ctx.lineTo(box.x + box.width, box.y);
    ctx.lineTo(box.x + box.width, box.y + cornerLength);
    ctx.stroke();
    
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + box.height - cornerLength);
    ctx.lineTo(box.x, box.y + box.height);
    ctx.lineTo(box.x + cornerLength, box.y + box.height);
    ctx.stroke();
    
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
    ctx.stroke();

    // Draw quality label
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Arial';
    const qualityText = `${Math.round(quality.overall * 100)}% Quality`;
    ctx.fillText(qualityText, box.x, box.y - 10);

    // Draw landmarks (small dots on face features)
    if (detection.landmarks) {
      ctx.fillStyle = color;
      const positions = detection.landmarks.positions;
      positions.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  };

  // Clear overlay canvas
  const clearOverlay = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext('2d');
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
  };

  // Stop face detection
  const stopFaceDetection = useCallback(() => {
    faceDetectionActiveRef.current = false;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setFaceDetectionActive(false);
    setDetectedFace(null);
    setQualityScore(0);
    clearOverlay();
  }, []);

  // Capture image
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Require face detection for capture
    if (!detectedFace) {
      setError('Please ensure your face is clearly visible before capturing.');
      return;
    }

    if (qualityScore < 0.5) {
      const proceed = window.confirm(
        'Face quality is low. The attendance might be flagged. Continue anyway?'
      );
      if (!proceed) return;
    }

    try {
      setLoading(true);
      stopFaceDetection();

      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      setCapturedImage(imageDataUrl);
      setShowPreview(true);

      console.log('✅ Image captured successfully with face quality:', qualityScore);
    } catch (error) {
      console.error('Capture error:', error);
      setError('Failed to capture image. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [detectedFace, qualityScore, stopFaceDetection]);

  // Confirm captured image
  const handleConfirmCapture = useCallback(async () => {
    if (!capturedImage) return;

    try {
      setLoading(true);

      // Extract face descriptor from captured image for verification
      const img = new Image();
      img.src = capturedImage;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Detect face in captured image to get descriptor
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected in captured image. Please retake.');
        setLoading(false);
        return;
      }

      const faceData = {
        imageData: capturedImage,
        timestamp: new Date().toISOString(),
        metadata: {
          width: img.width,
          height: img.height,
          faceDescriptor: Array.from(detection.descriptor), // Convert to array for JSON
          qualityScore: qualityScore,
          boundingBox: {
            x: detection.detection.box.x,
            y: detection.detection.box.y,
            width: detection.detection.box.width,
            height: detection.detection.box.height
          },
          confidence: detection.detection.score,
          verificationPassed: true
        }
      };

      console.log('✅ Face data prepared for submission:', {
        hasDescriptor: !!faceData.metadata.faceDescriptor,
        descriptorLength: faceData.metadata.faceDescriptor?.length,
        quality: faceData.metadata.qualityScore
      });

      if (onCapture) {
        await onCapture(faceData);
      }

      // Cleanup
      setCapturedImage(null);
      setShowPreview(false);
    } catch (error) {
      console.error('Confirm capture error:', error);
      setError('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [capturedImage, qualityScore, onCapture]);

  // Retake image
  const retakeImage = useCallback(() => {
    setCapturedImage(null);
    setShowPreview(false);
    setError(null);
    startFaceDetection();
  }, [startFaceDetection]);

  // Cleanup
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

  // Handle close
  const handleClose = useCallback(() => {
    cleanup();
    if (onClose) {
      onClose();
    }
  }, [cleanup, onClose]);

  // Initialize camera when opened and models loaded
  useEffect(() => {
    if (isOpen && modelsLoaded) {
      initializeCamera();
    }

    return () => {
      if (!isOpen) {
        cleanup();
      }
    };
  }, [isOpen, modelsLoaded, initializeCamera, cleanup]);

  // Start face detection when streaming starts
  useEffect(() => {
    if (isStreaming && modelsLoaded && !showPreview) {
      startFaceDetection();
    }
  }, [isStreaming, modelsLoaded, showPreview, startFaceDetection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Camera className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Face Recognition Capture</h3>
              <p className="text-sm text-gray-600">Look straight at the camera</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Cancel attendance marking?')) {
                handleClose();
              }
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Loading Models */}
          {initializingModels && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center space-x-2">
              <Loader className="h-5 w-5 text-blue-500 animate-spin" />
              <span className="text-blue-700">{initStatus}</span>
            </div>
          )}

          {/* Camera View */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
            {!showPreview ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {/* Face Detection Overlay */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Status Indicator */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
                  {detectedFace ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400">Face Detected</span>
                      <span className="text-gray-300">
                        ({Math.round(qualityScore * 100)}%)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      <span className="text-yellow-400">Position your face in center</span>
                    </div>
                  )}
                  {detectedFace?.quality?.feedback?.length > 0 && (
                    <div className="text-xs text-yellow-300 mt-1">
                      {detectedFace.quality.feedback[0]}
                    </div>
                  )}
                </div>

                {/* Quality Bar */}
                {detectedFace && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black bg-opacity-70 rounded-lg p-2">
                      <div className="flex justify-between text-xs text-white mb-1">
                        <span>Face Quality</span>
                        <span>{Math.round(qualityScore * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            qualityScore > 0.7 ? 'bg-green-500' :
                            qualityScore > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${qualityScore * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Instructions:</p>
              <ul className="text-xs space-y-1">
                <li>• Position your face in the center of the frame</li>
                <li>• Ensure good lighting on your face</li>
                <li>• Wait for the green box to appear around your face</li>
                <li>• Click "Capture Photo" when quality is above 70%</li>
                <li className="text-red-600 font-medium">
                  • Do NOT close this window - it will cancel your attendance!
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {!showPreview ? (
              <button
                onClick={captureImage}
                disabled={loading || !isStreaming || !detectedFace}
                className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  detectedFace && qualityScore > 0.5
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Camera className="w-5 h-5 mr-2" />
                {loading ? 'Processing...' : 'Capture Photo'}
              </button>
            ) : (
              <>
                <button
                  onClick={retakeImage}
                  className="flex items-center justify-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Retake
                </button>
                <button
                  onClick={handleConfirmCapture}
                  disabled={loading}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {loading ? 'Processing...' : 'Confirm & Submit'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceWebcamCapture;
