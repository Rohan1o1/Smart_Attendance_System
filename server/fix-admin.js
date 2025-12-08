const mongoose = require('mongoose');
const User = require('./models/User');
const config = require('./config');
const bcrypt = require('bcryptjs');

async function fixAdminUser() {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('Connected to database');
    
    // Delete existing admin user
    await User.deleteOne({ email: 'admin@college.edu' });
    console.log('Deleted existing admin user');
    
    // Create fresh admin user using the User model (this will trigger password hashing)
    const adminUser = new User({
      email: 'admin@college.edu',
      password: 'admin123', // This will be hashed automatically by the pre-save middleware
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '+1234567890',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });
    
    await adminUser.save();
    console.log('✅ New admin user created successfully!');
    
    // Test the authentication
    try {
      const authUser = await User.findByCredentials('admin@college.edu', 'admin123');
      console.log('✅ Authentication test successful for:', authUser.email);
      console.log('User role:', authUser.role);
    } catch (error) {
      console.log('❌ Authentication test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

fixAdminUser();
