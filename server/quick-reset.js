const mongoose = require('mongoose');
const { Class, Attendance } = require('./models');

const quickReset = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Use direct connection string with shorter timeout
    await mongoose.connect('mongodb://localhost:27017/attendance_system', {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    console.log('✅ Connected to MongoDB');

    // Reset specific classes by subject name
    const classesToReset = [
      'Computer Science 101',
      'Chemistry Lab'
    ];

    console.log('🔍 Finding classes to reset...');
    
    // Find classes by subject with shorter timeout
    const classes = await Class.find({ 
      subject: { $in: classesToReset } 
    }).maxTimeMS(5000);

    console.log(`📋 Found ${classes.length} classes to reset`);

    for (const classItem of classes) {
      console.log(`🧹 Resetting attendance for: ${classItem.subject}`);
      
      // Delete attendance records for this class
      const deleteResult = await Attendance.deleteMany({ 
        classId: classItem._id 
      }).maxTimeMS(5000);
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} attendance records`);
      
      // Update class status to active with current session
      await Class.findByIdAndUpdate(classItem._id, {
        status: 'active',
        currentSession: {
          startTime: new Date(),
          isActive: true
        }
      }).maxTimeMS(5000);
      
      console.log(`✅ Updated ${classItem.subject} to active status`);
    }

    console.log('🎉 Attendance reset completed successfully!');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
      process.exit(0);
    } catch (closeError) {
      console.error('❌ Error closing connection:', closeError.message);
      process.exit(1);
    }
  }
};

quickReset();
