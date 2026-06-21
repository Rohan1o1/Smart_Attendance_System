/**
 * Quick diagnostic script to check student and class data
 */

const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models').User;
const Class = require('./models').Class;

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to database');

    // Check all students
    const students = await User.find({ role: 'student' }).select('_id firstName lastName email studentId department');
    console.log('\n📚 Total students in database:', students.length);
    if (students.length > 0) {
      console.log('Students:');
      students.forEach(s => {
        console.log(`  - ${s.firstName} ${s.lastName} (${s.studentId}) - ${s.department}`);
      });
    }

    // Check all classes
    const classes = await Class.find({ isActive: true }).select('_id subject subjectCode teacherId enrolledStudents');
    console.log('\n📖 Total active classes:', classes.length);
    if (classes.length > 0) {
      console.log('Classes and enrolled students:');
      for (const cls of classes) {
        console.log(`  - ${cls.subject} (${cls.subjectCode})`);
        console.log(`    Teacher ID: ${cls.teacherId}`);
        console.log(`    Enrolled students: ${cls.enrolledStudents?.length || 0}`);
        if (cls.enrolledStudents && cls.enrolledStudents.length > 0) {
          cls.enrolledStudents.forEach(enroll => {
            console.log(`      • ${enroll.studentId} (${enroll.status})`);
          });
        }
      }
    } else {
      console.log('❌ No active classes found!');
    }

    // Get teacher info
    const teachers = await User.find({ role: 'teacher' }).select('_id firstName lastName email employeeId');
    console.log('\n👨‍🏫 Total teachers:', teachers.length);
    if (teachers.length > 0) {
      console.log('Teachers:');
      teachers.forEach(t => {
        console.log(`  - ${t.firstName} ${t.lastName} (${t.employeeId})`);
      });
    }

    console.log('\n💡 Diagnostic Summary:');
    console.log(`   Students available: ${students.length}`);
    console.log(`   Classes available: ${classes.length}`);
    console.log(`   Total enrollments: ${classes.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0)}`);
    
    if (classes.length === 0) {
      console.log('\n⚠️  ACTION: Create a class first and enroll students in it');
    } else if (classes.length > 0 && classes[0].enrolledStudents?.length === 0) {
      console.log('\n⚠️  ACTION: Classes exist but students are not enrolled. Enroll students in classes.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
