/**
 * Reset Attendance Script
 * This script resets attendance records for specific classes so students can mark attendance again
 */

const mongoose = require('mongoose');
require('./database');

const Attendance = require('./models/Attendance');
const Class = require('./models/Class');

async function resetAttendance() {
  try {
    console.log('🔄 Resetting attendance for specified classes...');
    
    // Find Computer Science 101 and Chemistry Lab classes
    const classes = await Class.find({
      $or: [
        { subject: 'Computer Science 101' },
        { subject: 'Chemistry Lab' }
      ]
    });
    
    console.log(`📚 Found ${classes.length} classes to reset attendance for:`);
    classes.forEach(cls => {
      console.log(`   - ${cls.subject} (${cls.subjectCode})`);
    });
    
    const classIds = classes.map(cls => cls._id);
    
    // Delete existing attendance records for these classes
    const deleteResult = await Attendance.deleteMany({
      classId: { $in: classIds }
    });
    
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing attendance records`);
    
    // Reset class status to 'active' so attendance can be marked
    const updateResult = await Class.updateMany(
      { _id: { $in: classIds } },
      { 
        $set: { 
          status: 'active',
          sessionStartTime: new Date() // Set current time as session start
        }
      }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} classes to active status`);
    console.log('🎯 Students can now mark attendance for:');
    console.log('   - Computer Science 101');
    console.log('   - Chemistry Lab');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting attendance:', error.message);
    process.exit(1);
  }
}

// Connect to database and run
setTimeout(resetAttendance, 2000);
