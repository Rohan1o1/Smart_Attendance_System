/**
 * Download Face-api.js Models Script
 * Downloads the required models for face detection, recognition and expression analysis
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Model URLs from face-api.js repository
const MODEL_URLS = {
  'tiny_face_detector_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
  'face_recognition_model-shard2': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json',
  'face_expression_model-shard1': 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1'
};

const MODELS_DIR = path.join(__dirname, 'models');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log('✅ Created models directory:', MODELS_DIR);
}

// Download function
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
        
        file.on('error', (err) => {
          fs.unlink(filepath, () => {}); // Delete partial file
          reject(err);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Main download function
async function downloadModels() {
  console.log('🤖 Starting face-api.js models download...\n');
  
  const modelNames = Object.keys(MODEL_URLS);
  let downloaded = 0;
  let skipped = 0;
  
  for (const modelName of modelNames) {
    const url = MODEL_URLS[modelName];
    const filepath = path.join(MODELS_DIR, modelName);
    
    // Skip if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping (already exists): ${modelName}`);
      skipped++;
      continue;
    }
    
    try {
      await downloadFile(url, filepath);
      downloaded++;
      
      // Small delay between downloads to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed to download ${modelName}:`, error.message);
    }
  }
  
  console.log('\n📊 Download Summary:');
  console.log(`   ✅ Downloaded: ${downloaded} files`);
  console.log(`   ⏭️  Skipped: ${skipped} files`);
  console.log(`   📁 Models directory: ${MODELS_DIR}\n`);
  
  // Verify all required files exist
  const missing = modelNames.filter(name => !fs.existsSync(path.join(MODELS_DIR, name)));
  
  if (missing.length === 0) {
    console.log('🎉 All face-api.js models are ready!');
    console.log('💡 Your face recognition system is now fully configured.\n');
  } else {
    console.log('⚠️  Missing models:', missing);
    console.log('🔄 Try running this script again or download manually.\n');
  }
}

// Run the download
downloadModels().catch(console.error);
