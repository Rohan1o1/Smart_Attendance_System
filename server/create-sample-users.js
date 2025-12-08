const mongoose = require('mongoose');
const User = require('./models/User');
const config = require('./config');

async function createSampleUsers() {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('Connected to database');
    
    // Sample users data
    const sampleUsers = [
      {
        email: 'teacher1@college.edu',
        password: 'teacher123',
        firstName: 'John',
        lastName: 'Smith',
        phoneNumber: '+1234567890',
        role: 'teacher',
        department: 'Computer Science',
        employeeId: 'T001'
      },
      {
        email: 'student1@college.edu',
        password: 'student123',
        firstName: 'Alice',
        lastName: 'Johnson',
        phoneNumber: '+1234567891',
        role: 'student',
        department: 'Computer Science',
        semester: 3,
        studentId: 'CS2021001'
      },
      {
        email: 'student2@college.edu',
        password: 'student123',
        firstName: 'Bob',
        lastName: 'Wilson',
        phoneNumber: '+1234567892',
        role: 'student',
        department: 'Computer Science',
        semester: 3,
        studentId: 'CS2021002'
      }
    ];

    console.log('Creating sample users...');
    
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const user = new User({
          ...userData,
          isActive: true,
          isEmailVerified: true
        });
        
        await user.save();
        console.log(`✅ Created ${userData.role}: ${userData.email}`);
      } else {
        console.log(`⚠️  User already exists: ${userData.email}`);
      }
    }
    
    // List all users
    const users = await User.find({}).select('email role firstName lastName department studentId employeeId');
    console.log('\n📋 All users in database:');
    users.forEach(user => {
      const id = user.studentId || user.employeeId || 'N/A';
      console.log(`- ${user.email} (${user.role}) - ${user.firstName} ${user.lastName} - ID: ${id}`);
    });
    
    console.log('\n🎯 Login Credentials:');
    console.log('='.repeat(50));
    console.log('ADMIN:');
    console.log('  Email: admin@college.edu');
    console.log('  Password: admin123');
    console.log('');
    console.log('TEACHER:');
    console.log('  Email: teacher1@college.edu');
    console.log('  Password: teacher123');
    console.log('');
    console.log('STUDENTS:');
    console.log('  Email: student1@college.edu');
    console.log('  Password: student123');
    console.log('  Email: student2@college.edu');
    console.log('  Password: student123');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createSampleUsers();
}

module.exports = createSampleUsers;
