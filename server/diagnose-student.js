const mongoose = require('mongoose');
const config = require('./config');
const { User } = require('./models');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected');

    const student = await User.findById('6a37c1dbc61ad7fa23552d00');
    if (student) {
      console.log('Student details:', {
        email: student.email,
        rollNumber: student.rollNumber,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName
      });
      student.password = 'student123';
      await student.save();
      console.log('✅ Password set to student123');
    } else {
      console.log('❌ Student not found');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
})();
