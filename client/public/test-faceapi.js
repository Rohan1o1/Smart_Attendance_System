// Test face-api.js loading in browser environment
// This helps debug the model loading issues

// Simple test to check if face-api.js can load
async function testFaceApiJS() {
  console.log('🧪 Testing face-api.js loading...');
  
  try {
    // Import face-api.js
    const faceapi = await import('face-api.js');
    console.log('✅ face-api.js imported successfully');
    
    // Test TensorFlow backends
    try {
      await import('@tensorflow/tfjs-backend-webgl');
      console.log('✅ WebGL backend loaded');
    } catch (e) {
      console.warn('⚠️ WebGL backend failed:', e.message);
    }
    
    // Test model loading
    const MODEL_PATHS = [
      '/models',
      'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
    ];
    
    for (const modelPath of MODEL_PATHS) {
      try {
        console.log(`🔄 Testing model loading from: ${modelPath}`);
        
        // Test tiny face detector first (smallest model)
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        console.log(`✅ TinyFaceDetector loaded from: ${modelPath}`);
        
        // If we get here, the path works
        console.log(`🎉 Model loading successful from: ${modelPath}`);
        break;
        
      } catch (error) {
        console.warn(`❌ Failed from ${modelPath}:`, error.message);
        continue;
      }
    }
    
  } catch (error) {
    console.error('❌ Face-api.js test failed:', error);
  }
}

// Run test when script loads
if (typeof window !== 'undefined') {
  testFaceApiJS();
}
