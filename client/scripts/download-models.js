/**
 * Download script for face-api.js models
 * Downloads required models from face-api.js repository
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../public/models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

async function downloadModel(modelName) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${modelName}`;
    const filePath = path.join(MODELS_DIR, modelName);
    
    console.log(`Downloading ${modelName}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${modelName}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ ${modelName} downloaded`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllModels() {
  try {
    // Ensure models directory exists
    if (!fs.existsSync(MODELS_DIR)) {
      fs.mkdirSync(MODELS_DIR, { recursive: true });
    }
    
    console.log('Starting face-api.js models download...');
    
    // Download all models
    for (const model of MODELS) {
      await downloadModel(model);
    }
    
    console.log('✅ All models downloaded successfully!');
    console.log(`Models saved to: ${MODELS_DIR}`);
    
  } catch (error) {
    console.error('❌ Error downloading models:', error);
    process.exit(1);
  }
}

// Run the download
downloadAllModels();
