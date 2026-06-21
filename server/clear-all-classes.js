const mongoose = require('mongoose');
const config = require('./config');
const { Class, Attendance } = require('./models');

const clearAllClasses = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ Connected to MongoDB');

    // 1. Delete all classes
    console.log('🧹 Deleting all classes from the database...');
    const classDeleteResult = await Class.deleteMany({});
    console.log(`✅ Successfully deleted ${classDeleteResult.deletedCount} classes.`);

    // 2. Delete all attendance records (to keep DB state clean and avoid orphaned references)
    console.log('🧹 Deleting all attendance records...');
    const attendanceDeleteResult = await Attendance.deleteMany({});
    console.log(`✅ Successfully deleted ${attendanceDeleteResult.deletedCount} attendance records.`);

    console.log('🎉 Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
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

clearAllClasses();
