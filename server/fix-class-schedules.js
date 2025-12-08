const mongoose = require('mongoose');
const Class = require('./models/Class');

async function fixClassSchedules() {
  try {
    await mongoose.connect('mongodb://localhost:27017/attendance_system');
    console.log('Connected to MongoDB');
    
    // Update Computer Science 101 
    await Class.findOneAndUpdate(
      { subject: 'Computer Science 101' },
      {
        'schedule.dayOfWeek': 'Monday',
        'schedule.startTime': '09:00',
        'schedule.endTime': '10:30',
        'schedule.duration': 90,
        currentSession: new Date().toDateString()
      }
    );
    
    // Update Chemistry Lab
    await Class.findOneAndUpdate(
      { subject: 'Chemistry Lab' },
      {
        'schedule.dayOfWeek': 'Monday',
        'schedule.startTime': '09:00',
        'schedule.endTime': '11:00',
        'schedule.duration': 120,
        currentSession: new Date().toDateString()
      }
    );
    
    // Update other classes for different days so they don't conflict
    await Class.findOneAndUpdate(
      { subject: 'Mathematics 201' },
      {
        'schedule.dayOfWeek': 'Tuesday',
        'schedule.startTime': '10:00',
        'schedule.endTime': '11:30', 
        'schedule.duration': 90,
        currentSession: new Date().toDateString()
      }
    );
    
    await Class.findOneAndUpdate(
      { subject: 'Physics 101' },
      {
        'schedule.dayOfWeek': 'Wednesday',
        'schedule.startTime': '14:00',
        'schedule.endTime': '15:30',
        'schedule.duration': 90,
        currentSession: new Date().toDateString()
      }
    );
    
    await Class.findOneAndUpdate(
      { subject: 'English Literature' },
      {
        'schedule.dayOfWeek': 'Thursday',
        'schedule.startTime': '11:00',
        'schedule.endTime': '12:30',
        'schedule.duration': 90,
        currentSession: new Date().toDateString()
      }
    );
    
    console.log('✅ Class schedules updated successfully!');
    
    // Verify the updates
    const classes = await Class.find({});
    console.log('\nUpdated classes:');
    classes.forEach(cls => {
      console.log(`- ${cls.subject}`);
      console.log(`  Day: ${cls.schedule?.dayOfWeek}`);
      console.log(`  Time: ${cls.schedule?.startTime} - ${cls.schedule?.endTime}`);
      console.log(`  Duration: ${cls.schedule?.duration}min`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixClassSchedules();
