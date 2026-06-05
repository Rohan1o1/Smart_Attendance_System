// Test MongoDB connection script
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    console.log('Using MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    await mongoose.connect(process.env.MONGODB_URI, { });
    console.log('✅ Connected to MongoDB');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Connection error:', err.message || err);
    process.exit(1);
  }
})();
