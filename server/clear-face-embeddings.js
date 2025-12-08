/**
 * Clear Face Embeddings Script
 * This script clears all face embeddings from users to force fresh registration
 */

const mongoose = require('mongoose');
require('./database');

const User = require('./models/User');

async function clearFaceEmbeddings() {
  try {
    console.log('🧹 Clearing all face embeddings...');
    
    // Clear all face embeddings from all users
    const result = await User.updateMany(
      {}, 
      { 
        $set: { faceEmbeddings: [] } 
      }
    );
    
    console.log(`✅ Cleared face embeddings for ${result.modifiedCount} users`);
    console.log('💡 Users will need to register their faces again');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing face embeddings:', error.message);
    process.exit(1);
  }
}

// Connect to database and run
setTimeout(clearFaceEmbeddings, 2000);
