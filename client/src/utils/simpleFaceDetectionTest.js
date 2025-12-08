/**
 * Simple Face Detection Test
 * Minimal implementation to test face-api.js functionality
 */

import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

class SimpleFaceDetectionTest {
  constructor() {
    this.initialized = false;
  }

  async testInitialization() {
    try {
      console.log('🧪 Testing TensorFlow.js initialization...');
      
      // Initialize TensorFlow.js backend properly
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('✅ TensorFlow.js ready, backend:', tf.getBackend());
      
      // Wait a moment for engine to be fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Test basic tensor operations
      try {
        const testTensor = tf.tensor2d([[1, 2], [3, 4]]);
        console.log('✅ Tensor operations working');
        testTensor.dispose();
      } catch (tensorError) {
        console.warn('⚠️ Tensor creation failed, trying CPU backend');
        await tf.setBackend('cpu');
        await tf.ready();
        const testTensor = tf.tensor2d([[1, 2], [3, 4]]);
        console.log('✅ Tensor operations working on CPU backend');
        testTensor.dispose();
      }
      
      console.log('🧪 Testing face-api.js model loading...');
      
      // Try loading just the tiny face detector
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      console.log('✅ TinyFaceDetector loaded successfully');
      
      this.initialized = true;
      return true;
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
  }

  async testFaceDetection(videoElement) {
    if (!this.initialized) {
      console.warn('⚠️ Service not initialized');
      return null;
    }

    try {
      console.log('🧪 Testing face detection on video element...');
      
      const detection = await faceapi.detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
      );
      
      if (detection) {
        console.log('✅ Face detected!', {
          x: Math.round(detection.box.x),
          y: Math.round(detection.box.y),
          width: Math.round(detection.box.width),
          height: Math.round(detection.box.height),
          confidence: detection.score.toFixed(3)
        });
        return detection;
      } else {
        console.log('ℹ️ No face detected in current frame');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Face detection test failed:', error);
      return null;
    }
  }
}

export default SimpleFaceDetectionTest;
