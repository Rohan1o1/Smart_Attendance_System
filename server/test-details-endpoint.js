const mongoose = require('mongoose');
const config = require('./config');
const { User, Class } = require('./models');

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected');

    const classObj = await Class.findOne({ subject: 'E-COMMERCE AND ERP' });
    const clsObj = classObj.toObject();

    if (!clsObj.enrolledStudents || clsObj.enrolledStudents.length === 0) {
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
      const matchingStudents = await User.find(studentQuery).select('firstName lastName studentId email phoneNumber department semester section');
      clsObj.enrolledStudents = matchingStudents.map(student => ({
        studentId: student.toObject ? student.toObject() : student,
        enrolledAt: classObj.createdAt,
        status: 'enrolled'
      }));
    }

    console.log('Returned Class enrolledStudents sample element:', JSON.stringify(clsObj.enrolledStudents[0], null, 2));

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
})();
