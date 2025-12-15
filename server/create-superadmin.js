/**
 * Create SuperAdmin Script
 * Run this once to create the system's SuperAdmin user
 */

const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ Connected to MongoDB');

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  SuperAdmin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log('   Use this account to login as SuperAdmin');
      await mongoose.disconnect();
      process.exit(0);
    }

    // SuperAdmin credentials
    const superAdminData = {
      firstName: 'System',
      lastName: 'SuperAdmin',
      email: 'superadmin@system.com',
      password: 'SuperAdmin@123',
      phoneNumber: '9999999999',
      role: 'superadmin',
      department: 'System Administration',
      verified: true,
      isActive: true
    };

    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('');
    console.log('✅ SuperAdmin created successfully!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  SUPERADMIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email:    ${superAdminData.email}`);
    console.log(`  Password: ${superAdminData.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createSuperAdmin();
                                                                                                                                        