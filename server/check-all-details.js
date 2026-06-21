const mongoose = require('mongoose');
const config = require('./config');
const { User, Class } = require('./models');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected');

    const students = await User.find({ role: 'student' });
    console.log('\n--- STUDENTS ---');
    students.forEach(s => {
      console.log(`Name: ${s.firstName} ${s.lastName}`);
      console.log(`  ID: ${s._id}`);
      console.log(`  Dept: ${s.department}`);
      console.log(`  Sem: ${s.semester}`);
      console.log(`  Sec: ${s.section}`);
      console.log(`  Verified: ${s.verified}`);
      console.log(`  IsActive: ${s.isActive}`);
    });

    const classes = await Class.find();
    console.log('\n--- CLASSES ---');
    classes.forEach(c => {
      console.log(`Subject: ${c.subject} (${c.subjectCode})`);
      console.log(`  ID: ${c._id}`);
      console.log(`  Dept: ${c.department}`);
      console.log(`  Sem: ${c.semester}`);
      console.log(`  Sec: ${c.section}`);
      console.log(`  Active: ${c.isActive}`);
      console.log(`  Enrolled Count in DB: ${c.enrolledStudents?.length || 0}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
})();
