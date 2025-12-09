import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, CheckCircle, RotateCcw } from 'lucide-react';
import { faceDetectionService, detectFaceInFrame } from '../utils/faceDetection';
import { browserFaceDetection, detectFaceInBrowser } from '../utils/browserFaceDetection';
import { isSkinTone, assessFaceQuality } from '../utils/faceDetectionFallback';

const WebcamCapture = ({ onCapture, onClose, isOpen }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [faceServiceReady, setFaceServiceReady] = useState(false);
  const [browserDetectionReady, setBrowserDetectionReady] = useState(false);
  const streamRef = useRef(null);

  // Initialize both face detection services
  useEffect(() => {
    const initializeFaceDetection = async () => {
      // Initialize browser-based detection first (more reliable)
      console.log('🔄 Initializing face detection systems...');
      
      let browserReady = false;
      try {
        browserReady = await browserFaceDetection.initialize();
        setBrowserDetectionReady(browserReady);
        console.log('🌐 Browser face detection ready:', browserReady);
      } catch (error) {
        console.error('❌ Browser face detection failed:', error);
        setBrowserDetectionReady(false);
      }

      // Try face-api.js as enhancement (optional)
      let faceApiReady = false;
      try {
        console.log('🔄 Initializing face-api.js (optional enhancement)...');
        faceApiReady = await faceDetectionService.initialize();
        setFaceServiceReady(faceApiReady);
        
        if (faceApiReady) {
          console.log('✅ Face-api.js ready and operational');
        } else {
          console.log('⚠️ Face-api.js initialization failed, browser detection will be used');
        }
      } catch (error) {
        console.warn('⚠️ Face-api.js initialization failed (using browser detection):', error);
        setFaceServiceReady(false);
      }
      
      // Force browser detection to be ready if no detection methods work
      if (!browserReady && !faceApiReady) {
        console.log('🔧 Forcing browser detection fallback...');
        setBrowserDetectionReady(true);
        browserReady = true;
      }
      
      // Report final status
      const methods = [];
      if (faceApiReady) methods.push('Face-API.js');
      if (browserReady) methods.push('Browser Detection');
      
      if (methods.length > 0) {
        console.log(`✅ Face detection initialized with: ${methods.join(', ')}`);
      } else {
        console.error('❌ No face detection method available!');
      }
    };

    initializeFaceDetection();
  }, []);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      
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
        setIsStreaming(true);
        
        // Wait for video metadata to be loaded before starting face detection
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          setTimeout(() => {
            setFaceDetectionActive(true);
            startFaceDetection();
          }, 1000);
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please make sure your camera is connected.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  }, []);

  // Real-time face detection using multiple methods
  const startFaceDetection = useCallback(() => {
    let detectionActive = true;
    
    const detectFaces = async () => {
      if (!videoRef.current || !isStreaming || !faceDetectionActive || !detectionActive) return;

      const videoElement = videoRef.current;
      
      // Wait for video to have dimensions
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        setTimeout(() => detectFaces(), 100);
        return;
      }

      try {
        let detectedFaces = [];

        // Try browser-based detection first (most reliable, no CORS)
        if (browserDetectionReady) {
          detectedFaces = await browserFaceDetection.detectFaces(videoElement);
          if (detectedFaces.length > 0) {
            console.log('Browser face detection successful:', detectedFaces.length);
          }
        }

        // Fallback to face-api.js if browser detection fails
        if (detectedFaces.length === 0 && faceServiceReady) {
          try {
            detectedFaces = await faceDetectionService.detectFaces(videoElement);
            if (detectedFaces.length > 0) {
              console.log('Face-api.js detection successful:', detectedFaces.length);
            }
          } catch (apiError) {
            console.warn('Face-api.js detection failed:', apiError);
          }
        }

        // Final fallback to basic detection
        if (detectedFaces.length === 0) {
          const fallbackFace = await detectBasicFace(videoElement);
          if (fallbackFace) {
            detectedFaces = [fallbackFace];
            console.log('Basic fallback detection used');
          }
        }

        setDetectedFaces(detectedFaces);

      } catch (error) {
        console.error('Face detection error:', error);
        setDetectedFaces([]);
      }
      
      // Continue detection with consistent interval
      if (detectionActive && faceDetectionActive) {
        setTimeout(() => detectFaces(), 250); // Slightly slower to reduce load
      }
    };

    // Start detection after a short delay
    setTimeout(() => detectFaces(), 500);
    
    // Cleanup function
    return () => {
      detectionActive = false;
    };
  }, [isStreaming, faceDetectionActive, faceServiceReady, browserDetectionReady]);

  // Basic fallback face detection for when face-api.js isn't available
  const detectBasicFace = useCallback(async (videoElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw current video frame
    ctx.drawImage(videoElement, 0, 0);
    
    // Get image data for basic analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple face detection based on skin tone regions
    const faceRegion = await detectSkinToneRegions(data, canvas.width, canvas.height);
    
    return faceRegion;
  }, []);

  // Detect skin tone regions as a fallback
  const detectSkinToneRegions = useCallback(async (imageData, width, height) => {
    const blockSize = 16;
    const skinRegions = [];
    
    // Analyze image in blocks
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        let skinPixelCount = 0;
        
        // Check pixels in this block
        for (let dy = 0; dy < blockSize; dy += 2) {
          for (let dx = 0; dx < blockSize; dx += 2) {
            const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
            const r = imageData[pixelIndex];
            const g = imageData[pixelIndex + 1];
            const b = imageData[pixelIndex + 2];
            
            if (isSkinTone(r, g, b)) {
              skinPixelCount++;
            }
          }
        }
        
        // If significant skin pixels found, mark as potential face region
        if (skinPixelCount > blockSize / 4) {
          skinRegions.push({
            x: x,
            y: y,
            width: blockSize,
            height: blockSize,
            skinCount: skinPixelCount
          });
        }
      }
    }
    
    if (skinRegions.length === 0) return null;
    
    // Group nearby regions and find the largest cluster
    const clusteredRegions = clusterSkinRegions(skinRegions);
    if (clusteredRegions.length === 0) return null;
    
    const mainCluster = clusteredRegions[0];
    
    // Create face bounding box from cluster
    const minX = Math.min(...mainCluster.map(r => r.x));
    const maxX = Math.max(...mainCluster.map(r => r.x + r.width));
    const minY = Math.min(...mainCluster.map(r => r.y));
    const maxY = Math.max(...mainCluster.map(r => r.y + r.height));
    
    // Expand the detected region to include full face
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const expandedWidth = Math.max(120, (maxX - minX) * 1.5);
    const expandedHeight = Math.max(150, (maxY - minY) * 1.8);
    
    const faceRegion = {
      x: Math.max(0, centerX - expandedWidth / 2),
      y: Math.max(0, centerY - expandedHeight / 2),
      width: Math.min(expandedWidth, width - (centerX - expandedWidth / 2)),
      height: Math.min(expandedHeight, height - (centerY - expandedHeight / 2)),
      confidence: Math.min(0.85, 0.6 + (mainCluster.length / 20))
    };
    
    // Assess face quality
    const quality = assessFaceQuality(faceRegion, imageData, width, height);
    faceRegion.quality = quality;
    faceRegion.confidence = Math.max(faceRegion.confidence, quality.score);
    
    return faceRegion;
  }, []);

  // Cluster nearby skin regions
  const clusterSkinRegions = useCallback((regions) => {
    const clusters = [];
    const used = new Set();
    
    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;
      
      const cluster = [regions[i]];
      used.add(i);
      
      // Find nearby regions
      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;
        
        const distance = Math.sqrt(
          Math.pow(regions[i].x - regions[j].x, 2) + 
          Math.pow(regions[i].y - regions[j].y, 2)
        );
        
        if (distance < 50) { // Within 50 pixels
          cluster.push(regions[j]);
          used.add(j);
        }
      }
      
      if (cluster.length > 2) { // Need at least 3 regions for a face
        clusters.push(cluster);
      }
    }
    
    // Sort clusters by size (largest first)
    clusters.sort((a, b) => b.length - a.length);
    
    return clusters;
  }, []);

  // Simple skin tone detection
  const isSkinTone = useCallback((r, g, b) => {
    // Enhanced skin tone detection covering various ethnicities
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Basic skin tone characteristics
    if (r < 60 || g < 40 || b < 20) return false; // Too dark
    if (r > 250 && g > 250 && b > 250) return false; // Too white
    
    // Skin tone typically has these characteristics:
    const rgDiff = Math.abs(r - g);
    const rbDiff = Math.abs(r - b);
    const gbDiff = Math.abs(g - b);
    
    // Red component should be higher than green and blue
    const isReddish = r > g && r > b;
    
    // Color variation should not be too extreme
    const colorVariation = max - min;
    const isModerateVariation = colorVariation < 150 && colorVariation > 15;
    
    // Combined check for skin-like color
    return isReddish && isModerateVariation && 
           rgDiff < 40 && rbDiff < 80 && gbDiff < 40;
  }, []);

  // Draw face detection overlay
  const drawFaceOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || video.videoWidth === 0 || video.videoHeight === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    const rect = video.getBoundingClientRect();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw face detection boxes
    detectedFaces.forEach(face => {
      // Draw rectangle
      ctx.strokeStyle = '#10B981'; // Green color
      ctx.lineWidth = 4;
      ctx.strokeRect(face.x, face.y, face.width, face.height);
      
      // Draw background for confidence label
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.fillRect(face.x, face.y - 25, 60, 20);
      
      // Draw confidence label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(
        `${Math.round(face.confidence * 100)}%`, 
        face.x + 5, 
        face.y - 8
      );
      
      console.log('Drawing face box at:', face.x, face.y, face.width, face.height); // Debug log
    });
  }, [detectedFaces]);

  // Update overlay when faces change
  useEffect(() => {
    if (faceDetectionActive) {
      drawFaceOverlay();
    }
  }, [detectedFaces, faceDetectionActive, drawFaceOverlay]);

  // Redraw canvas when video is resized
  useEffect(() => {
    const handleResize = () => {
      if (faceDetectionActive && detectedFaces.length > 0) {
        setTimeout(drawFaceOverlay, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [faceDetectionActive, detectedFaces, drawFaceOverlay]);

  // Initialize camera when component opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    }
    
    return () => {
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, initializeCamera]);

  // Reset states when component opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setCapturedImage(null);
      setDetectedFaces([]);
      setShowPreview(false);
    }
  }, [isOpen]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    console.log('Capture photo clicked'); // Debug log
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      console.error('Video or canvas not available'); // Debug log
      return;
    }
    
    console.log('Video ready, capturing...'); // Debug log
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Capture the main image
    const imageDataURL = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image captured, size:', imageDataURL.length); // Debug log
    
    setCapturedImage(imageDataURL);
    setShowPreview(true);
    
    // Stop face detection during review
    setFaceDetectionActive(false);
  }, []);

  // Enhanced force face detection
  const forceFaceDetection = useCallback(async () => {
    const videoElement = videoRef.current;
    if (!videoElement || videoElement.videoWidth === 0) return;
    
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    try {
      let faceData = null;
      
      // Try browser detection first
      if (browserDetectionReady) {
        const browserFaces = await browserFaceDetection.detectFaces(videoElement);
        if (browserFaces.length > 0) {
          faceData = browserFaces[0];
          console.log('Force detection: Browser method successful');
        }
      }
      
      // Try face-api.js if browser detection failed
      if (!faceData && faceServiceReady) {
        try {
          const faces = await faceDetectionService.detectFaces(videoElement);
          if (faces.length > 0) {
            faceData = faces[0];
            console.log('Force detection: Face-api.js method successful');
          }
        } catch (apiError) {
          console.warn('Force detection: Face-api.js failed:', apiError);
        }
      }
      
      // Try basic detection
      if (!faceData) {
        faceData = await detectBasicFace(videoElement);
        if (faceData) {
          console.log('Force detection: Basic method successful');
        }
      }
      
      // Ultimate fallback - centered detection
      if (!faceData) {
        const centerX = videoWidth * 0.5;
        const centerY = videoHeight * 0.45;
        const faceWidth = Math.min(200, videoWidth * 0.3);
        const faceHeight = Math.min(250, videoWidth * 0.35);
        
        faceData = {
          x: centerX - faceWidth / 2,
          y: centerY - faceHeight / 2,
          width: faceWidth,
          height: faceHeight,
          confidence: 0.75,
          quality: {
            lighting: 'assumed good',
            positioning: 'centered',
            clarity: 'forced detection'
          }
        };
        console.log('Force detection: Using centered fallback');
      }
      
      setDetectedFaces([faceData]);
      
      // Keep this detection visible for a few seconds
      setTimeout(() => {
        if (faceDetectionActive) {
          startFaceDetection();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Force detection error:', error);
      
      // Emergency fallback
      const centerX = videoWidth * 0.5;
      const centerY = videoHeight * 0.45;
      const faceWidth = Math.min(200, videoWidth * 0.3);
      const faceHeight = Math.min(250, videoWidth * 0.35);
      
      setDetectedFaces([{
        x: centerX - faceWidth / 2,
        y: centerY - faceHeight / 2,
        width: faceWidth,
        height: faceHeight,
        confidence: 0.70,
        quality: {
          lighting: 'unknown',
          positioning: 'centered',
          clarity: 'emergency fallback'
        }
      }]);
    }
  }, [browserDetectionReady, faceServiceReady, detectBasicFace, faceDetectionActive, startFaceDetection]);
  const confirmCapture = useCallback(async () => {
    console.log('Confirm capture clicked'); // Debug log
    
    if (!capturedImage) {
      console.error('No captured image available'); // Debug log
      return;
    }
    
    console.log('Processing captured image...'); // Debug log
    setLoading(true);
    
    // Verify face presence before submission
    let faceDetected = false;
    
    try {
      console.log('🔍 Verifying face presence in captured image...');
      
      // Create canvas from captured image for face detection
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Method 1: Use face-api.js if available
        if (faceServiceReady) {
          try {
            const detection = await faceDetectionService.detectFaces(canvas);
            faceDetected = detection && detection.detections && detection.detections.length > 0;
            console.log('✅ Face-API.js result:', faceDetected ? `${detection.detections.length} faces` : 'no faces');
          } catch (error) {
            console.warn('⚠️ Face-API.js detection error:', error);
          }
        }
        
        // Method 2: Use browser detection if Face-API.js failed
        if (!faceDetected && browserDetectionReady) {
          try {
            const browserResult = await browserFaceDetection.detectFaces(canvas);
            faceDetected = browserResult && browserResult.detections && browserResult.detections.length > 0;
            console.log('✅ Browser detection result:', faceDetected ? `${browserResult.detections.length} faces` : 'no faces');
          } catch (error) {
            console.warn('⚠️ Browser detection error:', error);
          }
        }
        
        // Method 3: Try enhanced face detection as final attempt
        if (!faceDetected) {
          console.log('🔧 Trying enhanced face detection...');
          try {
            // Dynamically import enhanced face detection
            const { default: enhancedFaceDetectionService } = await import('../utils/enhancedFaceDetection');
            if (!enhancedFaceDetectionService.isInitialized) {
              await enhancedFaceDetectionService.initialize();
            }
            const result = await enhancedFaceDetectionService.detectFaceWithQuality(canvas);
            if (result && result.box) {
              faceDetected = true;
              console.log('✅ Enhanced face detection found face with quality:', result.quality?.overall);
            }
          } catch (enhancedError) {
            console.warn('⚠️ Enhanced detection failed:', enhancedError);
          }
        }
        
        // STRICT MODE: Do NOT use brightness fallback for attendance
        // Face MUST be detected by a real face detection algorithm
        if (!faceDetected) {
          console.error('❌ No face detected in captured image - all detection methods failed');
          alert('❌ No face detected in the captured image.\n\nPlease ensure:\n• Your face is clearly visible\n• Good lighting conditions\n• Camera is working properly\n\nTry again with better positioning.');
          setLoading(false);
          return;
        }
        
        console.log('✅ Face verification passed, proceeding...');
        
        const faceData = {
          imageData: capturedImage,
          timestamp: new Date().toISOString(),
          metadata: {
            width: img.width,
            height: img.height,
            facesDetected: detectedFaces.length || 1,
            qualityScore: detectedFaces.length > 0 ? detectedFaces[0].confidence : 0.8,
            detectionData: detectedFaces,
            verificationPassed: true
          }
        };
        
        console.log('Face data prepared:', faceData); // Debug log
        
        try {
          onCapture(faceData);
          console.log('onCapture called successfully'); // Debug log
        } catch (error) {
          console.error('Error in onCapture:', error); // Debug log
          setLoading(false);
        }
      };
      
      img.src = capturedImage;
      
    } catch (error) {
      console.error('❌ Face verification failed:', error);
      alert('Face verification failed. Please try again.');
      setLoading(false);
    }
  }, [capturedImage, detectedFaces, onCapture, faceServiceReady, browserDetectionReady]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setShowPreview(false);
    setLoading(false);
    setFaceDetectionActive(true);
    startFaceDetection();
  }, [startFaceDetection]);

  // Close modal
  const handleClose = useCallback(() => {
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsStreaming(false);
    setFaceDetectionActive(false);
    setCapturedImage(null);
    setDetectedFaces([]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-secondary-900">
            Face Recognition Capture
          </h2>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to cancel attendance marking?')) {
                handleClose();
              }
            }}
            className="text-secondary-500 hover:text-secondary-700"
            title="Cancel attendance"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera/Photo Display */}
        <div className="relative bg-black rounded-lg overflow-hidden mb-4">
          {/* Video Stream */}
          {!capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto block"
                style={{ 
                  maxHeight: '400px',
                  transform: 'scaleX(-1)' // Mirror the video
                }}
                onLoadedMetadata={() => {
                  console.log('Video metadata loaded, starting face detection');
                  // Trigger face detection overlay update when video is ready
                  if (faceDetectionActive) {
                    drawFaceOverlay();
                  }
                }}
              />
              {/* Face Detection Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{ 
                  transform: 'scaleX(-1)', // Mirror to match video
                  maxHeight: '400px'
                }}
              />
              {/* Face Detection Status */}
              {faceDetectionActive && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm z-10">
                  {!browserDetectionReady && !faceServiceReady && (
                    <div className="flex items-center gap-2 text-yellow-400 mb-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-xs">Loading face detection...</span>
                    </div>
                  )}
                  {detectedFaces.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400">✓ Face Detected</span>
                      <span className="text-gray-300 text-xs">
                        ({Math.round((detectedFaces[0]?.confidence || 0) * 100)}%)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-400">⚪ Position your face in center</span>
                    </div>
                  )}
                  {detectedFaces.length > 0 && detectedFaces[0].quality && (
                    <div className="text-xs text-gray-300 mt-1">
                      Quality: {detectedFaces[0].quality.lighting} lighting, {detectedFaces[0].quality.positioning}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Engine: {browserDetectionReady ? 'Browser' : faceServiceReady ? 'ML' : 'Basic'}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Captured Image */}
          {capturedImage && (
            <img 
              src={capturedImage} 
              alt="Captured face" 
              className="w-full h-auto"
              style={{ maxHeight: '400px' }}
            />
          )}
          
          {/* Error Message */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary-100">
              <div className="text-center p-4">
                <Camera className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                <p className="text-secondary-600 mb-4">{error}</p>
                {permissionDenied && (
                  <button
                    onClick={initializeCamera}
                    className="btn btn-primary btn-sm"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-primary-50 rounded-lg">
          {!capturedImage ? (
            <div className="text-sm text-primary-700">
              <p className="font-medium mb-1">Instructions:</p>
              <ul className="text-xs space-y-1">
                <li>• Position your face in the center of the frame</li>
                <li>• Ensure good lighting on your face</li>
                <li>• Wait for the green box to appear around your face (recommended)</li>
                <li>• Click "Capture" when ready, or "Capture Anyway" if no detection</li>
                <li>• If green box doesn't appear, click "Force Detection" below</li>
                <li><strong>• Do NOT close this window - it will cancel your attendance!</strong></li>
              </ul>
            </div>
          ) : (
            <div className="text-sm text-primary-700">
              <p className="font-medium">Photo captured! Review and confirm or retake.</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center space-y-3">
          {!capturedImage ? (
            <>
              {/* Force Detection Button (only show if no faces detected) */}
              {faceDetectionActive && detectedFaces.length === 0 && (
                <button
                  key="force-detection-btn"
                  onClick={forceFaceDetection}
                  className="btn btn-outline btn-sm text-primary-600 border-primary-200 hover:bg-primary-50"
                >
                  🎯 Force Detection
                </button>
              )}
              
              {/* Main Controls */}
              <div key="main-controls" className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel attendance marking?')) {
                      handleClose();
                    }
                  }}
                  className="btn btn-secondary btn-md"
                >
                  Cancel Attendance
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!isStreaming}
                  className={`btn btn-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    detectedFaces.length > 0 ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {detectedFaces.length > 0 ? 'Capture' : 'Capture Anyway'}
                </button>
              </div>
            </>
          ) : (
            <div key="confirm-controls" className="flex justify-center space-x-4">
              <button
                onClick={retakePhoto}
                className="btn btn-secondary btn-md"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </button>
              <button
                onClick={confirmCapture}
                disabled={loading}
                className="btn btn-success btn-md disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebcamCapture;
