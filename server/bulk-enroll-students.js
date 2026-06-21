/**
 * Assignment Summary Script
 * Students are no longer manually enrolled in classes.
 * Classes are assigned automatically when department and semester match.
 */

const mongoose = require('mongoose');
const config = require('./config');
const { User, Class } = require('./models');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('Connected to database\n');

    const classes = await Class.find({ isActive: true })
      .select('subject subjectCode department semester')
      .sort({ department: 1, semester: 1, subject: 1 });

    if (classes.length === 0) {
      console.log('No active classes found.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('Automatic class assignments by department and semester');
    console.log('='.repeat(60));

    for (const classItem of classes) {
      const assignedStudents = await User.find({
        role: 'student',
        isActive: true,
        verified: true,
        department: classItem.department,
        semester: Number(classItem.semester)
      }).select('firstName lastName studentId rollNumber department semester');

      console.log(`\n${classItem.subject} (${classItem.subjectCode})`);
      console.log(`Department: ${classItem.department}`);
      console.log(`Semester: ${classItem.semester}`);
      console.log(`Assigned students: ${assignedStudents.length}`);

      assignedStudents.forEach((student) => {
        const identifier = student.rollNumber || student.studentId || student._id;
        console.log(`  - ${student.firstName} ${student.lastName} (${identifier})`);
      });
    }

    console.log('\nNo enrollment records were created or modified.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
