// const tf = require('@tensorflow/tfjs-node');
// const faceapi = require('face-api.js');
// const canvas = require('canvas');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

// Configure face-api.js to work with Node.js (commented out for now)
// const { Canvas, Image, ImageData } = canvas;
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

/**
 * Face Recognition Service
 * Handles face detection, embedding extraction, and comparison
 */
class FaceRecognitionService {
  constructor() {
    this.isInitialized = false;
    this.models = {};
    this.modelPath = path.join(__dirname, '../utils/models');
  }

  /**
   * Initialize face-api.js models
   */
  async initialize() {
    try {
      console.log('🧠 Initializing face recognition models...');
      
      // Ensure models directory exists
      await this.ensureModelsDirectory();

      // Load face detection models
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelPath);
      await faceapi.nets.faceExpressionNet.loadFromDisk(this.modelPath);

      this.isInitialized = true;
      console.log('✅ Face recognition models loaded successfully');
    } catch (error) {
      console.error('❌ Failed to initialize face recognition models:', error.message);
      throw new Error('Face recognition service initialization failed');
    }
  }

  /**
   * Ensure models directory exists and download models if needed
   */
  async ensureModelsDirectory() {
    try {
      await fs.access(this.modelPath);
      console.log('📁 Models directory exists');
    } catch (error) {
      console.log('📁 Creating models directory and downloading models...');
      await fs.mkdir(this.modelPath, { recursive: true });
      
      // Note: In production, you would download the models here
      // For now, we'll assume they're manually placed in the models directory
      console.log('⚠️  Please ensure face-api.js models are placed in:', this.modelPath);
      console.log('   Required models: ssd_mobilenetv1, face_landmark_68, face_recognition, face_expression');
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Process base64 image and convert to usable format
   * @param {String} base64Image - Base64 encoded image
   * @returns {Promise<Canvas>} - Canvas with loaded image
   */
  async processBase64Image(base64Image) {
    try {
      // Remove data URL prefix if present
      const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageData, 'base64');
      
      // Process image with sharp for consistency
      const processedBuffer = await sharp(imageBuffer)
        .resize(640, 480, { 
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Create canvas and load image
      const img = new Image();
      img.src = processedBuffer;
      
      const canvas = new Canvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      return canvas;
    } catch (error) {
      console.error('Image processing error:', error.message);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Detect faces in an image
   * @param {Canvas} canvas - Canvas with image
   * @returns {Promise<Array>} - Array of detected faces with landmarks
   */
  async detectFaces(canvas) {
    try {
      if (!this.isInitialized) {
        throw new Error('Face recognition service not initialized');
      }

      const detections = await faceapi
        .detectAllFaces(canvas)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

      return detections;
    } catch (error) {
      console.error('Face detection error:', error.message);
      throw new Error('Failed to detect faces');
    }
  }

  /**
   * Extract face embedding from image
   * @param {String} base64Image - Base64 encoded image
   * @returns {Promise<Object>} - Face embedding data and metadata
   */
  async extractFaceEmbedding(base64Image) {
    try {
      // Process image
      const canvas = await this.processBase64Image(base64Image);
      
      // Detect faces
      const detections = await this.detectFaces(canvas);

      if (!detections || detections.length === 0) {
        throw new Error('No faces detected in the image');
      }

      if (detections.length > 1) {
        throw new Error('Multiple faces detected. Please ensure only one face is visible');
      }

      const detection = detections[0];
      
      // Extract face embedding
      const embedding = detection.descriptor;
      
      // Perform basic liveness checks
      const livenessResult = this.performBasicLivenessCheck(detection);

      return {
        embedding: Array.from(embedding), // Convert Float32Array to regular array
        confidence: detection.detection.score,
        landmarks: detection.landmarks.positions,
        expressions: detection.expressions,
        livenessCheck: livenessResult,
        boundingBox: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height
        }
      };
    } catch (error) {
      console.error('Face embedding extraction error:', error.message);
      throw error;
    }
  }

  /**
   * Compare two face embeddings
   * @param {Array} embedding1 - First face embedding
   * @param {Array} embedding2 - Second face embedding
   * @returns {Number} - Similarity score (0-1, higher is more similar)
   */
  compareFaceEmbeddings(embedding1, embedding2) {
    try {
      if (!embedding1 || !embedding2) {
        throw new Error('Invalid embeddings provided');
      }

      if (embedding1.length !== embedding2.length) {
        throw new Error('Embedding dimensions do not match');
      }

      // Calculate Euclidean distance
      const distance = faceapi.euclideanDistance(embedding1, embedding2);
      
      // Convert distance to similarity score (0-1)
      // Distance of 0.6 or less is considered a match
      const similarity = Math.max(0, 1 - distance);
      
      return {
        similarity,
        distance,
        isMatch: distance <= config.faceRecognition.similarityThreshold
      };
    } catch (error) {
      console.error('Face comparison error:', error.message);
      throw new Error('Failed to compare face embeddings');
    }
  }

  /**
   * Find best matching face from stored embeddings
   * @param {Array} queryEmbedding - Embedding to match
   * @param {Array} storedEmbeddings - Array of stored face embeddings
   * @returns {Object} - Best match result
   */
  findBestMatch(queryEmbedding, storedEmbeddings) {
    try {
      if (!storedEmbeddings || storedEmbeddings.length === 0) {
        return {
          bestMatch: null,
          bestSimilarity: 0,
          isMatch: false,
          allComparisons: []
        };
      }

      let bestMatch = null;
      let bestSimilarity = 0;
      let bestDistance = Infinity;
      const allComparisons = [];

      storedEmbeddings.forEach((storedEmbedding, index) => {
        const comparison = this.compareFaceEmbeddings(queryEmbedding, storedEmbedding.embedding);
        
        allComparisons.push({
          index,
          similarity: comparison.similarity,
          distance: comparison.distance,
          isMatch: comparison.isMatch
        });

        if (comparison.similarity > bestSimilarity) {
          bestSimilarity = comparison.similarity;
          bestDistance = comparison.distance;
          bestMatch = {
            index,
            embeddingId: storedEmbedding._id,
            imageUrl: storedEmbedding.imageUrl
          };
        }
      });

      return {
        bestMatch,
        bestSimilarity,
        bestDistance,
        isMatch: bestDistance <= config.faceRecognition.similarityThreshold,
        allComparisons,
        threshold: config.faceRecognition.similarityThreshold
      };
    } catch (error) {
      console.error('Face matching error:', error.message);
      throw new Error('Failed to find face match');
    }
  }

  /**
   * Perform basic liveness detection
   * @param {Object} detection - Face detection result
   * @returns {Object} - Liveness check result
   */
  performBasicLivenessCheck(detection) {
    try {
      const landmarks = detection.landmarks.positions;
      const expressions = detection.expressions;

      // Check for basic face landmarks quality
      const landmarksQuality = this.assessLandmarksQuality(landmarks);
      
      // Check facial expressions for signs of life
      const expressionScore = this.assessExpressionVariation(expressions);
      
      // Simple liveness score based on landmarks and expressions
      const livenessScore = (landmarksQuality + expressionScore) / 2;
      
      return {
        passed: livenessScore > 0.3, // Configurable threshold
        score: livenessScore,
        method: 'basic_analysis',
        details: {
          landmarksQuality,
          expressionScore,
          expressions: expressions
        }
      };
    } catch (error) {
      console.error('Liveness check error:', error.message);
      return {
        passed: false,
        score: 0,
        method: 'basic_analysis',
        error: error.message
      };
    }
  }

  /**
   * Assess quality of facial landmarks
   * @param {Array} landmarks - Facial landmarks
   * @returns {Number} - Quality score (0-1)
   */
  assessLandmarksQuality(landmarks) {
    try {
      // Check if all major landmarks are present
      if (!landmarks || landmarks.length < 68) {
        return 0.1;
      }

      // Simple quality assessment based on landmark distribution
      const leftEye = landmarks.slice(36, 42);
      const rightEye = landmarks.slice(42, 48);
      const nose = landmarks.slice(27, 36);
      const mouth = landmarks.slice(48, 68);

      // Check eye symmetry
      const eyeSymmetry = this.calculateEyeSymmetry(leftEye, rightEye);
      
      // Check facial proportions
      const proportionScore = this.calculateFacialProportions(landmarks);

      return Math.min(1, (eyeSymmetry + proportionScore) / 2);
    } catch (error) {
      return 0.1;
    }
  }

  /**
   * Calculate eye symmetry score
   * @param {Array} leftEye - Left eye landmarks
   * @param {Array} rightEye - Right eye landmarks
   * @returns {Number} - Symmetry score (0-1)
   */
  calculateEyeSymmetry(leftEye, rightEye) {
    try {
      if (!leftEye || !rightEye || leftEye.length < 6 || rightEye.length < 6) {
        return 0.1;
      }

      // Calculate eye center points
      const leftCenter = leftEye.reduce((acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
      }), { x: 0, y: 0 });
      leftCenter.x /= leftEye.length;
      leftCenter.y /= leftEye.length;

      const rightCenter = rightEye.reduce((acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
      }), { x: 0, y: 0 });
      rightCenter.x /= rightEye.length;
      rightCenter.y /= rightEye.length;

      // Calculate horizontal alignment
      const yDifference = Math.abs(leftCenter.y - rightCenter.y);
      const eyeDistance = Math.abs(leftCenter.x - rightCenter.x);
      
      // Normalize score (smaller y difference = better symmetry)
      const symmetryScore = Math.max(0, 1 - (yDifference / (eyeDistance * 0.1)));
      
      return Math.min(1, symmetryScore);
    } catch (error) {
      return 0.1;
    }
  }

  /**
   * Calculate facial proportions score
   * @param {Array} landmarks - All facial landmarks
   * @returns {Number} - Proportion score (0-1)
   */
  calculateFacialProportions(landmarks) {
    try {
      // Simple proportion checks
      const jawline = landmarks.slice(0, 17);
      const leftEyebrow = landmarks.slice(17, 22);
      const rightEyebrow = landmarks.slice(22, 27);
      
      if (jawline.length < 17) return 0.1;

      // Check face width to height ratio
      const faceWidth = Math.abs(jawline[0].x - jawline[16].x);
      const faceHeight = Math.abs(jawline[8].y - landmarks[24].y); // Chin to forehead

      const ratio = faceWidth / faceHeight;
      
      // Ideal face ratio is approximately 0.6-0.8
      const idealRatio = 0.7;
      const ratioScore = Math.max(0, 1 - Math.abs(ratio - idealRatio));

      return Math.min(1, ratioScore);
    } catch (error) {
      return 0.1;
    }
  }

  /**
   * Assess expression variation for liveness
   * @param {Object} expressions - Facial expressions
   * @returns {Number} - Expression variation score (0-1)
   */
  assessExpressionVariation(expressions) {
    try {
      if (!expressions) return 0.1;

      // Look for natural expression variations
      const expressionValues = Object.values(expressions);
      const maxExpression = Math.max(...expressionValues);
      const expressionVariance = this.calculateVariance(expressionValues);

      // Natural faces should have some expression variation
      const variationScore = Math.min(1, expressionVariance * 10);
      
      // Avoid overly neutral expressions (might indicate fake face)
      const neutralPenalty = expressions.neutral > 0.9 ? 0.2 : 0;
      
      return Math.max(0.1, Math.min(1, variationScore - neutralPenalty));
    } catch (error) {
      return 0.1;
    }
  }

  /**
   * Calculate variance of an array
   * @param {Array} values - Array of numbers
   * @returns {Number} - Variance
   */
  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Validate face image quality
   * @param {String} base64Image - Base64 encoded image
   * @returns {Promise<Object>} - Validation result
   */
  async validateImageQuality(base64Image) {
    try {
      const canvas = await this.processBase64Image(base64Image);
      const detections = await this.detectFaces(canvas);

      if (!detections || detections.length === 0) {
        return {
          isValid: false,
          reason: 'No faces detected',
          suggestions: ['Ensure your face is clearly visible', 'Improve lighting conditions']
        };
      }

      if (detections.length > 1) {
        return {
          isValid: false,
          reason: 'Multiple faces detected',
          suggestions: ['Ensure only your face is visible in the image']
        };
      }

      const detection = detections[0];
      const confidence = detection.detection.score;
      const boundingBox = detection.detection.box;

      // Check detection confidence
      if (confidence < 0.8) {
        return {
          isValid: false,
          reason: 'Face detection confidence too low',
          suggestions: ['Improve lighting', 'Face the camera directly', 'Remove any obstructions']
        };
      }

      // Check face size in image
      const imageArea = canvas.width * canvas.height;
      const faceArea = boundingBox.width * boundingBox.height;
      const faceRatio = faceArea / imageArea;

      if (faceRatio < 0.15) {
        return {
          isValid: false,
          reason: 'Face too small in image',
          suggestions: ['Move closer to the camera', 'Ensure your face fills more of the frame']
        };
      }

      if (faceRatio > 0.8) {
        return {
          isValid: false,
          reason: 'Face too large in image',
          suggestions: ['Move back from the camera', 'Ensure your entire face is visible']
        };
      }

      // Perform liveness check
      const livenessResult = this.performBasicLivenessCheck(detection);

      if (!livenessResult.passed) {
        return {
          isValid: false,
          reason: 'Liveness check failed',
          suggestions: ['Ensure you are using a live image', 'Try again with better lighting']
        };
      }

      return {
        isValid: true,
        confidence,
        faceRatio,
        livenessScore: livenessResult.score,
        boundingBox
      };
    } catch (error) {
      return {
        isValid: false,
        reason: error.message,
        suggestions: ['Try again with a different image', 'Ensure the image is clear and well-lit']
      };
    }
  }
}

// Export singleton instance
const faceRecognitionService = new FaceRecognitionService();

module.exports = faceRecognitionService;
