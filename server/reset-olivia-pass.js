const mongoose = require('mongoose');
const config = require('./config');
const { User } = require('./models');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected');

    const teacher = await User.findOne({ email: 'oliviacse@gmail.com' });
    if (teacher) {
      teacher.password = 'teacher123';
      await teacher.save();
      console.log('✅ Olivia Smith password reset to teacher123');
    } else {
      console.log('❌ Olivia Smith not found');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
})();
