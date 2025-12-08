const mongoose = require('mongoose');
const Class = require('./models/Class');
const User = require('./models/User'); // Import User model to avoid validation error

async function updateAttendanceWindow() {
  try {
    await mongoose.connect('mongodb://localhost:27017/attendance_system');
    console.log('Connected to MongoDB');
    
    // Update all classes to have longer attendance windows
    const result = await Class.updateMany({}, {
      'attendanceWindow.beforeMinutes': 15, // 15 minutes before
      'attendanceWindow.afterMinutes': 45   // 45 minutes after (instead of 15)
    });
    
    console.log(`✅ Updated ${result.modifiedCount} classes with extended attendance window`);
    
    // Also reset the session start time to current time for today's classes so window opens now
    const now = new Date();
    const today = now.getDay();
    
    const todaysClasses = await Class.find({
      'schedule.dayOfWeek': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today],
      status: 'active'
    });
    
    for (const classItem of todaysClasses) {
      // Set session start time to current time minus 10 minutes 
      // This makes the attendance window: (now-25min) to (now+35min)
      const sessionStart = new Date();
      sessionStart.setMinutes(sessionStart.getMinutes() - 10);
      
      classItem.sessionStartTime = sessionStart;
      await classItem.save();
      
      console.log(`📚 ${classItem.subject}:`);
      const windowTimes = classItem.attendanceWindowTimes;
      console.log(`   📅 New window: ${windowTimes.start.toLocaleTimeString()} - ${windowTimes.end.toLocaleTimeString()}`);
      console.log(`   🟢 Window open: ${windowTimes.isOpen}`);
    }
    
    console.log('\n🎉 Attendance windows updated!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAttendanceWindow();
