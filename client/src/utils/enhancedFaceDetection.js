/**
 * Enhanced Face Detection Service
 * Provides real-time face detection with quality assessment using face-api.js
 */

import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

class EnhancedFaceDetectionService {
  constructor() {
    this.modelsLoaded = false;
    this.isInitialized = false;
    this.detectionOptions = null;
    this.realTimeDetectionActive = false;
    this.detectionInterval = null;
  }

  /**
   * Initialize face detection models
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('Initializing TensorFlow.js and face detection models...');
      
      // Initialize TensorFlow.js backend properly
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js WebGL backend ready');
      } catch (webglError) {
        console.warn('WebGL backend failed, falling back to CPU:', webglError);
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('TensorFlow.js CPU backend ready');
      }
      
      console.log('TensorFlow.js backend:', tf.getBackend());
      
      // Wait for engine to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Load models from public directory
      const MODEL_URL = '/models';
      
      // Load models individually with error handling
      console.log('Loading TinyFaceDetector...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log('✅ TinyFaceDetector loaded');
      
      console.log('Loading FaceLandmark68Net...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('✅ FaceLandmark68Net loaded');
      
      console.log('Loading FaceRecognitionNet...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log('✅ FaceRecognitionNet loaded');

      // Set detection options
      this.detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      });

      this.modelsLoaded = true;
      this.isInitialized = true;
      console.log('✅ Face detection models loaded successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load face detection models:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Detect face in video element with quality assessment
   */
  async detectFaceWithQuality(videoElement) {
    if (!this.isInitialized || !videoElement) {
      return null;
    }

    try {
      // Detect face with landmarks and descriptors
      const detection = await faceapi
        .detectSingleFace(videoElement, this.detectionOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      // Perform quality assessment with error handling
      const quality = this.assessFaceQuality(detection, videoElement);
      const feedback = this.generateQualityFeedback(quality);

      // Extract box from detection object safely
      let box = null;
      let confidence = 0.5;

      if (detection.detection && detection.detection.box) {
        box = detection.detection.box;
        confidence = detection.detection.score || 0.5;
      } else if (detection.box) {
        box = detection.box;
        confidence = detection.score || 0.5;
      }

      if (!box) {
        console.warn('No valid face bounding box found in detection');
        return null;
      }

      return {
        box: box,
        landmarks: detection.landmarks,
        descriptor: detection.descriptor,
        confidence: confidence,
        quality: quality,
        feedback: feedback
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  /**
   * Assess face quality based on multiple factors
   */
  assessFaceQuality(detection, videoElement) {
    // Check if detection and required properties exist
    if (!detection) {
      return { overall: 0, factors: {} };
    }

    // Handle different detection object structures
    let box = null;
    let landmarks = null;

    if (detection.detection && detection.detection.box) {
      // Face-API.js with withFaceLandmarks() structure
      box = detection.detection.box;
      landmarks = detection.landmarks;
    } else if (detection.box) {
      // Direct detection structure
      box = detection.box;
      landmarks = detection.landmarks;
    } else {
      // Fallback - no valid box found
      console.warn('No valid face bounding box found in detection object:', detection);
      return { overall: 0, factors: { error: 'No bounding box available' } };
    }

    if (!box || typeof box.width !== 'number' || typeof box.height !== 'number') {
      console.warn('Invalid bounding box structure:', box);
      return { overall: 0, factors: { error: 'Invalid bounding box' } };
    }

    const videoWidth = videoElement.videoWidth || 640;
    const videoHeight = videoElement.videoHeight || 480;

    // 1. Face size assessment (should be 20-80% of frame)
    const faceArea = box.width * box.height;
    const frameArea = videoWidth * videoHeight;
    const faceRatio = faceArea / frameArea;
    
    let sizeScore = 0;
    if (faceRatio >= 0.1 && faceRatio <= 0.6) {
      sizeScore = 1.0;
    } else if (faceRatio >= 0.05 && faceRatio <= 0.8) {
      sizeScore = 0.7;
    } else {
      sizeScore = 0.3;
    }

    // 2. Face position assessment (should be centered)
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const frameCenterX = videoWidth / 2;
    const frameCenterY = videoHeight / 2;
    
    const offsetX = Math.abs(faceCenterX - frameCenterX) / (videoWidth / 2);
    const offsetY = Math.abs(faceCenterY - frameCenterY) / (videoHeight / 2);
    
    const positionScore = Math.max(0, 1 - (offsetX + offsetY) / 2);

    // 3. Face angle assessment (frontal vs profile)
    const angleScore = this.assessFaceAngle(landmarks);

    // 4. Image sharpness assessment (based on landmark stability)
    const sharpnessScore = this.assessSharpness(detection);

    // 5. Lighting assessment (basic contrast check)
    const lightingScore = this.assessLighting(box, videoElement);

    // 6. Symmetry assessment
    const symmetryScore = this.assessFaceSymmetry(landmarks);

    // Calculate overall quality score
    const weights = {
      size: 0.2,
      position: 0.15,
      angle: 0.25,
      sharpness: 0.15,
      lighting: 0.15,
      symmetry: 0.1
    };

    const overall = (
      sizeScore * weights.size +
      positionScore * weights.position +
      angleScore * weights.angle +
      sharpnessScore * weights.sharpness +
      lightingScore * weights.lighting +
      symmetryScore * weights.symmetry
    );

    return {
      overall: Math.max(0, Math.min(1, overall)),
      size: sizeScore,
      position: positionScore,
      angle: angleScore,
      sharpness: sharpnessScore,
      lighting: lightingScore,
      symmetry: symmetryScore,
      factors: {
        faceRatio: faceRatio,
        centerOffset: { x: offsetX, y: offsetY }
      }
    };
  }

  /**
   * Assess face angle based on landmarks
   */
  assessFaceAngle(landmarks) {
    if (!landmarks || !landmarks.positions) {
      return 0.5;
    }

    try {
      const positions = landmarks.positions;
      
      // Get key facial points
      const leftEye = positions[36]; // Left eye outer corner
      const rightEye = positions[45]; // Right eye outer corner
      const noseTip = positions[30]; // Nose tip
      const leftMouth = positions[48]; // Left mouth corner
      const rightMouth = positions[54]; // Right mouth corner

      if (!leftEye || !rightEye || !noseTip || !leftMouth || !rightMouth) {
        return 0.5;
      }

      // Calculate eye level
      const eyeSlope = (rightEye.y - leftEye.y) / (rightEye.x - leftEye.x);
      const eyeAngle = Math.abs(Math.atan(eyeSlope) * 180 / Math.PI);

      // Calculate mouth level
      const mouthSlope = (rightMouth.y - leftMouth.y) / (rightMouth.x - leftMouth.x);
      const mouthAngle = Math.abs(Math.atan(mouthSlope) * 180 / Math.PI);

      // Average angle
      const avgAngle = (eyeAngle + mouthAngle) / 2;

      // Score based on how close to frontal (0 degrees)
      if (avgAngle < 5) return 1.0;
      if (avgAngle < 10) return 0.8;
      if (avgAngle < 15) return 0.6;
      if (avgAngle < 25) return 0.4;
      return 0.2;
    } catch (error) {
      console.error('Error assessing face angle:', error);
      return 0.5;
    }
  }

  /**
   * Assess image sharpness (simplified)
   */
  assessSharpness(detection) {
    // Use confidence score as a proxy for sharpness
    const confidence = detection.detection.score;
    
    if (confidence > 0.9) return 1.0;
    if (confidence > 0.8) return 0.8;
    if (confidence > 0.7) return 0.6;
    if (confidence > 0.6) return 0.4;
    return 0.2;
  }

  /**
   * Assess lighting quality (basic implementation)
   */
  assessLighting(box, videoElement) {
    try {
      // Create a temporary canvas to analyze pixel data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = box.width;
      canvas.height = box.height;
      
      // Draw the face region
      ctx.drawImage(
        videoElement,
        box.x, box.y, box.width, box.height,
        0, 0, box.width, box.height
      );
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate average brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
      }
      
      const avgBrightness = totalBrightness / (data.length / 4);
      
      // Score based on ideal brightness range (100-200)
      if (avgBrightness >= 100 && avgBrightness <= 200) return 1.0;
      if (avgBrightness >= 80 && avgBrightness <= 220) return 0.8;
      if (avgBrightness >= 60 && avgBrightness <= 240) return 0.6;
      return 0.4;
    } catch (error) {
      console.error('Error assessing lighting:', error);
      return 0.7; // Default to acceptable
    }
  }

  /**
   * Assess face symmetry
   */
  assessFaceSymmetry(landmarks) {
    if (!landmarks || !landmarks.positions) {
      return 0.5;
    }

    try {
      const positions = landmarks.positions;
      
      // Get symmetric points
      const leftEyeOuter = positions[36];
      const rightEyeOuter = positions[45];
      const leftMouthCorner = positions[48];
      const rightMouthCorner = positions[54];
      const noseTip = positions[30];

      if (!leftEyeOuter || !rightEyeOuter || !leftMouthCorner || !rightMouthCorner || !noseTip) {
        return 0.5;
      }

      // Calculate distances from nose tip
      const leftEyeDistance = Math.sqrt(
        Math.pow(leftEyeOuter.x - noseTip.x, 2) + Math.pow(leftEyeOuter.y - noseTip.y, 2)
      );
      const rightEyeDistance = Math.sqrt(
        Math.pow(rightEyeOuter.x - noseTip.x, 2) + Math.pow(rightEyeOuter.y - noseTip.y, 2)
      );
      
      const leftMouthDistance = Math.sqrt(
        Math.pow(leftMouthCorner.x - noseTip.x, 2) + Math.pow(leftMouthCorner.y - noseTip.y, 2)
      );
      const rightMouthDistance = Math.sqrt(
        Math.pow(rightMouthCorner.x - noseTip.x, 2) + Math.pow(rightMouthCorner.y - noseTip.y, 2)
      );

      // Calculate symmetry ratios
      const eyeSymmetry = Math.min(leftEyeDistance, rightEyeDistance) / Math.max(leftEyeDistance, rightEyeDistance);
      const mouthSymmetry = Math.min(leftMouthDistance, rightMouthDistance) / Math.max(leftMouthDistance, rightMouthDistance);

      // Average symmetry score
      const avgSymmetry = (eyeSymmetry + mouthSymmetry) / 2;
      
      return Math.max(0.3, avgSymmetry); // Minimum score of 0.3
    } catch (error) {
      console.error('Error assessing face symmetry:', error);
      return 0.5;
    }
  }

  /**
   * Generate quality feedback messages
   */
  generateQualityFeedback(quality) {
    // Handle error cases
    if (!quality || quality.overall === 0) {
      if (quality && quality.factors && quality.factors.error) {
        return [`❌ ${quality.factors.error}`];
      }
      return ['⚠️ Unable to assess face quality'];
    }

    const feedback = [];
    const threshold = 0.7;

    if (quality.overall >= 0.8) {
      feedback.push('✅ Good face quality detected');
    } else {
      if (quality.size && quality.size < threshold) {
        if (quality.size < 0.3) {
          feedback.push('📏 Move closer to the camera');
        } else {
          feedback.push('📏 Adjust distance - face should fill more of the frame');
        }
      }

      if (quality.position && quality.position < threshold) {
        feedback.push('🎯 Center your face in the frame');
      }

      if (quality.angle && quality.angle < threshold) {
        feedback.push('📐 Face the camera straight on');
      }

      if (quality.lighting && quality.lighting < threshold) {
        feedback.push('💡 Improve lighting - face appears too dark or too bright');
      }

      if (quality.sharpness && quality.sharpness < threshold) {
        feedback.push('🔍 Hold still for a clearer image');
      }

      if (quality.symmetry < threshold) {
        feedback.push('⚖️ Position face more symmetrically');
      }
    }

    return feedback;
  }

  /**
   * Start real-time face detection
   */
  startRealTimeDetection(videoElement, callback, options = {}) {
    if (!this.isInitialized || this.realTimeDetectionActive) {
      return null;
    }

    const { interval = 200, minQuality = 0.6 } = options;
    this.realTimeDetectionActive = true;

    const detectLoop = async () => {
      if (!this.realTimeDetectionActive) {
        return;
      }

      try {
        const face = await this.detectFaceWithQuality(videoElement);
        const hasGoodQuality = face && face.quality.overall >= minQuality;
        
        callback({
          face,
          hasGoodQuality,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Real-time detection error:', error);
      }

      if (this.realTimeDetectionActive) {
        this.detectionInterval = setTimeout(detectLoop, interval);
      }
    };

    detectLoop();

    // Return cleanup function
    return () => {
      this.realTimeDetectionActive = false;
      if (this.detectionInterval) {
        clearTimeout(this.detectionInterval);
        this.detectionInterval = null;
      }
    };
  }

  /**
   * Stop real-time face detection
   */
  stopRealTimeDetection() {
    this.realTimeDetectionActive = false;
    if (this.detectionInterval) {
      clearTimeout(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      modelsLoaded: this.modelsLoaded,
      realTimeActive: this.realTimeDetectionActive
    };
  }
}

// Create and export singleton instance
const enhancedFaceDetectionService = new EnhancedFaceDetectionService();

// Initialize automatically when imported
enhancedFaceDetectionService.initialize().catch(console.error);

export default enhancedFaceDetectionService;
