const mongoose = require('mongoose');
const Class = require('./models/Class');

async function checkClasses() {
  try {
    await mongoose.connect('mongodb://localhost:27017/attendance_system');
    console.log('Connected to MongoDB');
    
    const classes = await Class.find({});
    console.log('\nCurrent classes:');
    classes.forEach(cls => {
      console.log(`- ${cls.subject} (${cls._id})`);
      console.log(`  Day: ${cls.schedule?.dayOfWeek}`);
      console.log(`  Time: ${cls.schedule?.startTime} - ${cls.schedule?.endTime}`);
      console.log(`  Duration: ${cls.schedule?.duration}min`);
      console.log(`  Status: ${cls.status}`);
      console.log(`  Current Session: ${cls.currentSession}`);
      console.log('---');
    });
    
    // Check current day and time
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    console.log(`\nCurrent day: ${currentDay} (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)`);
    console.log(`Current time: ${currentTime}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkClasses();
