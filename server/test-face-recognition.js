/**
 * Face Recognition Test Script
 * Tests face recognition with various scenarios
 */

const faceRecognitionService = require('./services/faceRecognitionService');
const fs = require('fs').promises;
const path = require('path');

async function testFaceRecognition() {
  try {
    console.log('🧪 Starting Face Recognition Tests...');
    
    // Initialize face recognition service
    await faceRecognitionService.initialize();
    console.log('✅ Face recognition service initialized');
    
    // Test 1: Empty/blank image (should fail)
    console.log('\n🔬 Test 1: Testing empty image...');
    try {
      // Create a simple blank image in base64
      const blankImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const result1 = await faceRecognitionService.extractFaceEmbedding(blankImage.split(',')[1]);
      console.log('Result:', { success: result1.success, error: result1.error });
    } catch (error) {
      console.log('Error (expected):', error.message);
    }
    
    // Test 2: Image with no face content
    console.log('\n🔬 Test 2: Testing image without face...');
    try {
      // Create a simple colored rectangle (no face)
      const noFaceImage = Buffer.from([
        // Simple 10x10 blue square in PNG format
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x0A,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x02, 0x50, 0x58,
        0xEA, 0x00, 0x00, 0x00, 0x1C, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0xFC, 0xFF, 0xFF, 0x3F,
        0x03, 0x00, 0x08, 0x00, 0x03, 0xFF, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
        0x60, 0x82
      ]).toString('base64');
      
      const result2 = await faceRecognitionService.extractFaceEmbedding(noFaceImage);
      console.log('Result:', { success: result2.success, error: result2.error });
    } catch (error) {
      console.log('Error (expected):', error.message);
    }
    
    console.log('\n✅ Face recognition tests completed');
    console.log('💡 The service should reject images without faces');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

// Run tests
testFaceRecognition();
