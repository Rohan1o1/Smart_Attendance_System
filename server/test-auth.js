const mongoose = require('mongoose');
const User = require('./models/User');
const config = require('./config');
const bcrypt = require('bcryptjs');

async function testAuthentication() {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('Connected to database');
    
    // Test admin user
    const adminUser = await User.findOne({ email: 'admin@college.edu' }).select('+password');
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found');
    console.log('Password hash length:', adminUser.password.length);
    console.log('Password is hashed:', adminUser.password.startsWith('$2'));
    
    // Test password comparison
    const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
    console.log('Password comparison result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password comparison failed');
      console.log('🔧 Re-hashing password...');
      
      // Re-hash the password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await User.updateOne(
        { email: 'admin@college.edu' }, 
        { password: hashedPassword }
      );
      
      console.log('✅ Password re-hashed successfully');
      
      // Test again
      const updatedUser = await User.findOne({ email: 'admin@college.edu' }).select('+password');
      const newPasswordValid = await bcrypt.compare('admin123', updatedUser.password);
      console.log('New password comparison result:', newPasswordValid);
    }
    
    // Test the findByCredentials method
    try {
      const authUser = await User.findByCredentials('admin@college.edu', 'admin123');
      console.log('✅ Authentication successful for:', authUser.email);
    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testAuthentication();
