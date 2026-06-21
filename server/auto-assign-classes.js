/**
 * Auto-Assign Classes to Students
 * Automatically assigns classes to students based on:
 * - Department match
 * - Semester match
 * - Academic year match
 */

const mongoose = require('mongoose');
const config = require('./config');
const { User, Class } = require('./models');

async function autoAssignClasses() {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Get all students
    const students = await User.find({ role: 'student', verified: true }).select(
      '_id firstName lastName email department semester year'
    );
    console.log(`\n📚 Found ${students.length} verified students\n`);

    if (students.length === 0) {
      console.log('⚠️  No verified students found');
      process.exit(0);
    }

    // Get the current academic year (assuming classes are for current year)
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    console.log(`📅 Academic Year: ${academicYear}\n`);

    let totalAssignments = 0;
    let assignmentResults = [];

    // For each student, find matching classes
    for (const student of students) {
      console.log(
        `\n👤 Processing: ${student.firstName} ${student.lastName} (${student.email})`
      );
      console.log(`   Department: ${student.department}, Semester: ${student.semester}`);

      // Find classes matching student's department and semester
      const matchingClasses = await Class.find({
        department: student.department,
        semester: student.semester,
        academicYear: academicYear
      }).select('_id subject subjectCode');

      console.log(`   📖 Found ${matchingClasses.length} matching classes`);

      // Assign student to each matching class
      let studentAssignments = 0;
      for (const cls of matchingClasses) {
        // Check if student is already enrolled
        const alreadyEnrolled = await Class.findOne({
          _id: cls._id,
          enrolledStudents: student._id
        });

        if (!alreadyEnrolled) {
          // Add student to the class
          await Class.findByIdAndUpdate(
            cls._id,
            { $addToSet: { enrolledStudents: student._id } }, // $addToSet prevents duplicates
            { new: true }
          );

          console.log(`      ✅ Assigned to: ${cls.subject} (${cls.subjectCode})`);
          studentAssignments++;
          totalAssignments++;
        } else {
          console.log(`      ⏭️  Already enrolled in: ${cls.subject} (${cls.subjectCode})`);
        }
      }

      if (studentAssignments === 0 && matchingClasses.length > 0) {
        console.log(`      ℹ️  No new assignments (already enrolled in all)`);
      }

      assignmentResults.push({
        student: `${student.firstName} ${student.lastName}`,
        email: student.email,
        department: student.department,
        semester: student.semester,
        classesAssigned: studentAssignments,
        totalMatching: matchingClasses.length
      });
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ASSIGNMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nTotal assignments made: ${totalAssignments}`);
    console.log(`\nDetailed Results:\n`);

    assignmentResults.forEach((result) => {
      console.log(`${result.student} (${result.email})`);
      console.log(
        `  Department: ${result.department}, Semester: ${result.semester}`
      );
      console.log(`  Newly assigned: ${result.classesAssigned} classes`);
      console.log(`  Total matching: ${result.totalMatching} classes\n`);
    });

    // Verify by showing final enrollment numbers
    console.log('\n' + '='.repeat(60));
    console.log('📈 FINAL CLASS ENROLLMENTS');
    console.log('='.repeat(60) + '\n');

    const allClasses = await Class.find({ academicYear }).select(
      'subject subjectCode department semester enrolledStudents'
    );

    for (const cls of allClasses) {
      console.log(`${cls.subject} (${cls.subjectCode})`);
      console.log(`  Department: ${cls.department}, Semester: ${cls.semester}`);
      console.log(`  👥 Enrolled students: ${cls.enrolledStudents.length}`);
    }

    console.log('\n✅ Auto-assignment process completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during auto-assignment:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the auto-assignment
autoAssignClasses();
