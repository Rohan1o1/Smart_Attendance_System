const mongoose = require('mongoose');
const config = require('./config');
const { User, Class } = require('./models');

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected');

    const classObj = await Class.findOne({ subject: 'E-COMMERCE AND ERP' });
    console.log('Class Info:', {
      department: classObj.department,
      semester: classObj.semester,
      section: classObj.section
    });

    const studentQuery = {
      role: 'student',
      isActive: true,
      verified: true,
      department: classObj.department,
      semester: classObj.semester
    };
    if (classObj.section && classObj.section !== 'All sections' && classObj.section !== '') {
      studentQuery.section = { $regex: new RegExp('^' + escapeRegExp(classObj.section) + '$', 'i') };
    }

    console.log('Student Query:', studentQuery);

    const matchingStudents = await User.find(studentQuery);
    console.log('Matching Students count:', matchingStudents.length);
    matchingStudents.forEach(s => {
      console.log(`- ${s.firstName} ${s.lastName} (Sec: ${s.section})`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
})();
