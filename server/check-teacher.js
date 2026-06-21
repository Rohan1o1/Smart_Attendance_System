/**
 * Check teacher account in database
 */

const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models').User;

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to database');

    // Find olivia smith teacher
    const teacher = await User.findOne({ 
      email: 'oliviacse@gmail.com' 
    }).select('+password');

    if (!teacher) {
      console.log('❌ Teacher not found with email: oliviacse@gmail.com');
      
      // Search for any teacher with olivia
      const oliviaUsers = await User.find({ 
        $or: [
          { firstName: /olivia/i },
          { lastName: /smith/i },
          { email: /olivia/i }
        ]
      }).select('_id firstName lastName email role verified isActive');
      
      console.log('\nUsers matching "olivia" or "smith":');
      oliviaUsers.forEach(u => {
        console.log(`  - ${u.firstName} ${u.lastName} (${u.email}) - Role: ${u.role}, Verified: ${u.verified}, Active: ${u.isActive}`);
      });
    } else {
      console.log('\n✅ Found teacher:');
      console.log(`  Name: ${teacher.firstName} ${teacher.lastName}`);
      console.log(`  Email: ${teacher.email}`);
      console.log(`  Role: ${teacher.role}`);
      console.log(`  Verified: ${teacher.verified}`);
      console.log(`  isActive: ${teacher.isActive}`);
      console.log(`  isLocked: ${teacher.isLocked}`);
      console.log(`  Password hash: ${teacher.password ? teacher.password.substring(0, 20) + '...' : 'NO PASSWORD'}`);
      
      // Try to compare the password
      console.log('\n🔍 Testing password comparison...');
      try {
        const isValidPassword = await teacher.comparePassword('12345678');
        console.log(`  Result: ${isValidPassword ? '✅ Password matches' : '❌ Password does not match'}`);
      } catch (pwError) {
        console.log(`  ❌ Error comparing password: ${pwError.message}`);
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
