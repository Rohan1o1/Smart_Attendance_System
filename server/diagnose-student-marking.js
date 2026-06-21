const mongoose = require('mongoose');
const config = require('./config');
const { User, Class } = require('./models');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected');

    const student = await User.findById('6a37c1dbc61ad7fa23552d00');
    console.log('Student Info:', {
      _id: student?._id,
      firstName: student?.firstName,
      lastName: student?.lastName,
      department: student?.department,
      semester: student?.semester,
      section: student?.section,
      year: student?.year
    });

    const activeClasses = await Class.find({ isActive: true });
    console.log('\nActive Classes in DB:', activeClasses.map(c => ({
      _id: c._id,
      subject: c.subject,
      subjectCode: c.subjectCode,
      department: c.department,
      semester: c.semester,
      section: c.section,
      status: c.status
    })));

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
})();
