const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');

async function clearTodayAttendance() {
  try {
    await mongoose.connect('mongodb://localhost:27017/attendance_system');
    console.log('Connected to MongoDB');
    
    const today = new Date().toDateString();
    
    // Clear today's attendance for both classes
    const result = await Attendance.deleteMany({
      date: { $gte: new Date(today), $lt: new Date(new Date(today).getTime() + 24*60*60*1000) }
    });
    
    console.log(`✅ Cleared ${result.deletedCount} attendance records for today`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearTodayAttendance();
