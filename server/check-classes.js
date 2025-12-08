const mongoose = require('mongoose');
const { Class, Attendance } = require('./models');

const checkClasses = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect('mongodb://localhost:27017/attendance_system', {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    console.log('✅ Connected to MongoDB');

    // Find all classes
    const classes = await Class.find({}).maxTimeMS(5000);
    
    console.log(`📋 Found ${classes.length} total classes:`);
    
    classes.forEach(cls => {
      console.log(`  - Subject: "${cls.subject}" (ID: ${cls._id})`);
      console.log(`    Subject Code: ${cls.subjectCode}`);
      console.log(`    Status: ${cls.status}`);
      if (cls.currentSession) {
        console.log(`    Current Session Active: ${cls.currentSession.isActive}`);
      }
      console.log('');
    });

    // Check attendance records
    const attendanceCount = await Attendance.countDocuments({});
    console.log(`📝 Total attendance records: ${attendanceCount}`);

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

checkClasses();
