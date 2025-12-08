const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');

// Configure face-api.js for Node.js environment
faceapi.env.monkeyPatch({
  Canvas: Canvas,
  Image: Image,
  ImageData: ImageData
});

async function testFaceDetection() {
  console.log('🧪 Starting face-api.js test...');
  
  try {
    // Test face-api.js model loading
    console.log('📦 Loading face-api.js models...');
    const modelsPath = './models';
    
    // Load models
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
    
    console.log('✅ All models loaded successfully');
    
    // Create a test canvas
    console.log('🖼️  Creating test canvas...');
    const canvas = new Canvas(640, 480);
    const ctx = canvas.getContext('2d');
    
    // Fill with a simple pattern
    ctx.fillStyle = 'rgb(100, 100, 100)';
    ctx.fillRect(0, 0, 640, 480);
    
    // Add some circles to simulate facial features
    ctx.fillStyle = 'rgb(200, 180, 160)'; // skin-like color
    ctx.beginPath();
    ctx.ellipse(320, 240, 100, 120, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'rgb(50, 50, 50)';
    ctx.beginPath();
    ctx.ellipse(280, 200, 15, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(360, 200, 15, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    console.log('✅ Test canvas created');
    
    // Test face detection
    console.log('👤 Running face detection test...');
    const detections = await faceapi
      .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    console.log(`✅ Face detection completed: ${detections.length} faces detected`);
    
    if (detections.length > 0) {
      console.log('🎯 Face detection details:');
      detections.forEach((detection, index) => {
        console.log(`  Face ${index + 1}:`);
        console.log(`    Confidence: ${detection.detection.score.toFixed(3)}`);
        console.log(`    Box: ${JSON.stringify(detection.detection.box)}`);
        console.log(`    Descriptor length: ${detection.descriptor.length}`);
      });
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testFaceDetection()
    .then(() => {
      console.log('✅ All tests passed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testFaceDetection };
