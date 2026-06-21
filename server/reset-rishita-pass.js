const mongoose = require('mongoose');
const config = require('./config');
const { User } = require('./models');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected');

    const student = await User.findOne({ rollNumber: '24400122023' });
    if (student) {
      student.password = 'student123';
      await student.save();
      console.log('✅ Rishita password reset to student123');
    } else {
      console.log('❌ Rishita not found');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
})();
