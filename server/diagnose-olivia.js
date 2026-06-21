const mongoose = require('mongoose');
const config = require('./config');
const { User, Class } = require('./models');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected');

    const teacher = await User.findOne({ email: 'oliviacse@gmail.com' });
    console.log('Teacher Olivia:', {
      _id: teacher?._id,
      firstName: teacher?.firstName,
      lastName: teacher?.lastName,
      email: teacher?.email,
      role: teacher?.role
    });

    const classes = await Class.find({ teacherId: teacher?._id });
    console.log('Classes owned by Olivia:', classes.map(c => ({
      _id: c._id,
      subject: c.subject,
      department: c.department,
      semester: c.semester,
      section: c.section
    })));

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
})();
