/**
 * Face Detection Utility using face-api.js
 * Provides real-time face detection for webcam streams
 */

import * as faceapi from 'face-api.js';

class FaceDetectionService {
  constructor() {
    this.isInitialized = false;
    this.modelLoadPromise = null;
    this.initializationAttempted = false;
  }

  // Initialize face-api.js with required models
  async initialize() {
    if (this.isInitialized) return true;
    if (this.modelLoadPromise) return this.modelLoadPromise;
    if (this.initializationAttempted) return false;

    console.log('🔄 Initializing face detection service...');
    this.initializationAttempted = true;
    
    try {
      // Set up TensorFlow backend first
      await this.setupTensorFlowBackend();
      
      // Load models
      this.modelLoadPromise = this.loadModels();
      await Promise.race([
        this.modelLoadPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Model loading timeout')), 30000)
        )
      ]);
      
      this.isInitialized = true;
      console.log('✅ Face detection service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize face detection service:', error);
      this.modelLoadPromise = null;
      this.isInitialized = false;
      return false;
    }
  }

  // Setup TensorFlow backend
  async setupTensorFlowBackend() {
    try {
      // First, let's wait a bit for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('🌐 Not in browser environment, skipping TF setup');
        return;
      }

      // Try to import the WebGL backend
      console.log('🔄 Setting up TensorFlow WebGL backend...');
      
      // Import TensorFlow core first
      const tf = await import('@tensorflow/tfjs');
      console.log('✅ TensorFlow core imported');
      
      // Import WebGL backend
      await import('@tensorflow/tfjs-backend-webgl');
      console.log('✅ WebGL backend imported');
      
      // Make sure TensorFlow is ready
      await tf.ready();
      console.log('✅ TensorFlow backend ready');
      
      // Check available backends
      const backends = tf.getBackend();
      console.log(`🔧 Active backend: ${backends}`);
      
    } catch (error) {
      console.warn('⚠️ TensorFlow backend setup failed, using fallback:', error.message);
      
      // Try to continue with default backend
      try {
        const tf = await import('@tensorflow/tfjs');
        await tf.ready();
        console.log('✅ Using default TensorFlow backend');
      } catch (fallbackError) {
        console.error('❌ Complete TensorFlow setup failure:', fallbackError.message);
        throw fallbackError;
      }
    }
  }

  // Load required face-api.js models
  async loadModels() {
    const MODEL_PATHS = [
      '/models', // Local models first
      'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights', // GitHub CDN
      'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights' // JSDelivr CDN
    ];
    
    let lastError = null;
    
    for (const modelPath of MODEL_PATHS) {
      try {
        console.log(`🔄 Attempting to load models from: ${modelPath}`);
        
        // Load models sequentially to avoid conflicts
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        console.log('✅ TinyFaceDetector loaded');
        
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
        console.log('✅ FaceLandmark68Net loaded');
        
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
        console.log('✅ FaceRecognitionNet loaded');
        
        console.log(`✅ All models loaded successfully from: ${modelPath}`);
        return; // Success, exit the loop
        
      } catch (error) {
        console.warn(`⚠️ Failed to load from ${modelPath}:`, error.message);
        lastError = error;
        continue; // Try next path
      }
    }
    
    // If we get here, all paths failed
    throw new Error(`Failed to load models from all sources. Last error: ${lastError?.message}`);
  }

  // Detect faces in video element
  async detectFaces(videoElement) {
    if (!this.isInitialized) {
      console.warn('Face detection service not initialized');
      return [];
    }

    try {
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections.map(detection => ({
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height,
        confidence: detection.detection.score,
        landmarks: detection.landmarks,
        descriptor: detection.descriptor,
        quality: this.assessFaceQuality(detection)
      }));
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  // Assess face quality for better user feedback
  assessFaceQuality(detection) {
    const box = detection.detection.box;
    const confidence = detection.detection.score;
    const landmarks = detection.landmarks;

    // Calculate face size relative to detection area
    const faceArea = box.width * box.height;
    const minGoodSize = 10000; // Minimum area for good detection
    const maxGoodSize = 100000; // Maximum area for good detection

    // Assess lighting based on confidence (simplified)
    const lighting = confidence > 0.8 ? 'good' : confidence > 0.6 ? 'moderate' : 'poor';
    
    // Assess positioning based on face size and position
    const positioning = (faceArea > minGoodSize && faceArea < maxGoodSize) ? 'good' : 'adjust needed';
    
    // Assess clarity based on confidence and landmark detection
    const clarity = (confidence > 0.7 && landmarks) ? 'clear' : 'unclear';

    return {
      lighting,
      positioning,
      clarity,
      faceSize: faceArea,
      confidence: Math.round(confidence * 100)
    };
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized;
  }

  // Fallback detection for when face-api.js fails
  createFallbackDetection(videoWidth, videoHeight) {
    const centerX = videoWidth * 0.5;
    const centerY = videoHeight * 0.45;
    const width = Math.min(200, videoWidth * 0.3);
    const height = Math.min(240, videoHeight * 0.35);

    return [{
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
      confidence: 0.75,
      quality: {
        lighting: 'unknown',
        positioning: 'centered',
        clarity: 'fallback detection'
      }
    }];
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();

// Export simple detection function for backward compatibility
export const detectFaceInFrame = async (videoElement) => {
  try {
    const faces = await faceDetectionService.detectFaces(videoElement);
    return faces.length > 0 ? faces[0] : null;
  } catch (error) {
    console.error('Face detection failed:', error);
    return null;
  }
};
