/**
 * Quick script to enroll a student in a class
 */

const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models').User;
const Class = require('./models').Class;

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to database');

    // Find Rohan (student)
    const rohan = await User.findOne({ firstName: 'Rohan', lastName: 'Routh', role: 'student' });
    if (!rohan) {
      console.log('❌ Student Rohan not found');
      process.exit(1);
    }
    console.log(`✅ Found student: ${rohan.firstName} ${rohan.lastName} (ID: ${rohan._id})`);

    // Find a class to enroll in (DBMS taught by olivia smith)
    const dbmsClass = await Class.findOne({ subject: 'DBMS', isActive: true });
    if (!dbmsClass) {
      console.log('❌ DBMS class not found');
      process.exit(1);
    }
    console.log(`✅ Found class: ${dbmsClass.subject} (${dbmsClass.subjectCode})`);

    // Check if already enrolled
    const alreadyEnrolled = dbmsClass.enrolledStudents.some(e => 
      (e.studentId?.toString() === rohan._id.toString() || e.studentId === rohan._id)
    );
    
    if (alreadyEnrolled) {
      console.log('⚠️  Student is already enrolled in this class');
    } else {
      // Enroll the student
      dbmsClass.enrolledStudents.push({
        studentId: rohan._id,
        status: 'enrolled',
        enrollmentDate: new Date(),
        attendanceStats: {
          totalSessions: 0,
          attendedSessions: 0,
          attendanceRate: 0
        }
      });

      await dbmsClass.save();
      console.log(`✅ Enrolled ${rohan.firstName} in ${dbmsClass.subject}`);
    }

    // Verify enrollment
    const updatedClass = await Class.findById(dbmsClass._id).populate('enrolledStudents.studentId', 'firstName lastName');
    console.log(`\n📋 Class ${updatedClass.subject} now has ${updatedClass.enrolledStudents.length} enrolled student(s):`);
    updatedClass.enrolledStudents.forEach(e => {
      const student = e.studentId;
      console.log(`   - ${student.firstName} ${student.lastName} (Status: ${e.status})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! Rohan should now appear in the Manage Students page.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
