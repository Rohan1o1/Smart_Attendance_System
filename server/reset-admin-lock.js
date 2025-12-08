const mongoose = require('mongoose');
require('./config'); // Load environment variables

const User = require('./models/User');

const resetAdminLock = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system');
    console.log('✅ Connected to database');

    // Find and reset admin account
    const admin = await User.findOne({ email: 'admin@college.edu' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('📊 Current admin status:');
    console.log('   - Login attempts:', admin.loginAttempts || 0);
    console.log('   - Is locked:', admin.isLocked);
    console.log('   - Lock until:', admin.lockUntil);

    // Reset login attempts and unlock
    await admin.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 }
    });

    console.log('✅ Admin account unlocked and login attempts reset');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdminLock();
