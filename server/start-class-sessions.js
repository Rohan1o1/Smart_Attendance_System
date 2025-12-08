const mongoose = require('mongoose');
const Class = require('./models/Class');

async function startTodaysClasses() {
  try {
    await mongoose.connect('mongodb://localhost:27017/attendance_system');
    console.log('Connected to MongoDB');
    
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    
    console.log(`Current day: ${today}, Current time: ${currentTime}`);
    
    // Find today's classes
    const todaysClasses = await Class.find({
      'schedule.dayOfWeek': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today],
      status: 'active'
    });
    
    console.log(`Found ${todaysClasses.length} classes scheduled for today`);
    
    for (const classItem of todaysClasses) {
      console.log(`\n📚 Processing: ${classItem.subject}`);
      console.log(`   Scheduled: ${classItem.schedule.startTime} - ${classItem.schedule.endTime}`);
      
      // Check if class should be active now
      const [scheduleHour, scheduleMinute] = classItem.schedule.startTime.split(':').map(Number);
      const scheduleTime = scheduleHour * 60 + scheduleMinute;
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Start session if we're within 15 minutes of start time and session not already started
      if (!classItem.sessionStartTime && 
          currentTimeMinutes >= (scheduleTime - 15) && 
          currentTimeMinutes <= (scheduleTime + classItem.schedule.duration + 15)) {
        
        console.log('   ⏰ Starting class session...');
        
        // Set session start time to the scheduled time (not current time)
        const sessionStartTime = new Date();
        sessionStartTime.setHours(scheduleHour, scheduleMinute, 0, 0);
        
        classItem.sessionStartTime = sessionStartTime;
        classItem.status = 'active';
        classItem.currentSession = new Date().toDateString();
        
        // Add default teacher location (can be updated when teacher actually starts)
        if (!classItem.teacherLocation.latitude) {
          classItem.teacherLocation = {
            latitude: 40.7128,  // Default NYC coordinates
            longitude: -74.0060,
            address: 'Default Classroom Location',
            capturedAt: new Date()
          };
        }
        
        await classItem.save();
        console.log('   ✅ Session started successfully');
        
        // Check attendance window
        const windowTimes = classItem.attendanceWindowTimes;
        if (windowTimes) {
          console.log(`   📅 Attendance window: ${windowTimes.start.toLocaleTimeString()} - ${windowTimes.end.toLocaleTimeString()}`);
          console.log(`   🟢 Window open: ${windowTimes.isOpen}`);
        }
        
      } else if (classItem.sessionStartTime) {
        console.log('   ✅ Session already started');
        const windowTimes = classItem.attendanceWindowTimes;
        if (windowTimes) {
          console.log(`   📅 Attendance window: ${windowTimes.start.toLocaleTimeString()} - ${windowTimes.end.toLocaleTimeString()}`);
          console.log(`   🟢 Window open: ${windowTimes.isOpen}`);
        }
      } else {
        console.log('   ⏸️ Not time to start this class yet');
      }
    }
    
    console.log('\n🎉 Class session management completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

startTodaysClasses();
