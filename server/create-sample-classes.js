const mongoose = require('mongoose');
const Class = require('./models/Class');
const User = require('./models/User');

async function createSampleData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/attendance_system');
        console.log('Connected to database');

        // Get existing users
        const teacher = await User.findOne({ role: 'teacher' });
        const students = await User.find({ role: 'student' });

        if (!teacher) {
            console.log('No teacher found. Run create-sample-users.js first');
            return;
        }

        // Clear existing classes
        await Class.deleteMany({});
        console.log('Cleared existing classes');

        // Create sample classes
        const classes = [
            {
                classId: 'CS101-F24',
                subject: 'Computer Science 101',
                subjectCode: 'CS101',
                teacherId: teacher._id,
                teacherName: teacher.firstName + ' ' + teacher.lastName,
                department: 'Computer Science',
                semester: 1,
                academicYear: '2024-2025',
                schedule: {
                    dayOfWeek: 'Monday',
                    startTime: '09:00',
                    endTime: '13:00',
                    duration: 240
                },
                teacherLocation: {
                    latitude: 22.823101464024948,
                    longitude: 88.63942781760827,
                    address: 'Lab A, Engineering Building, Habra'
                },
                status: 'active', // Make class active for attendance
                sessionStartTime: new Date(), // Required when status is active
                enrolledStudents: students.map(s => ({ studentId: s._id })),
                createdBy: teacher._id
            },
            {
                classId: 'MATH201-F24',
                subject: 'Mathematics 201',
                subjectCode: 'MATH201',
                teacherId: teacher._id,
                teacherName: teacher.firstName + ' ' + teacher.lastName,
                department: 'Mathematics',
                semester: 3,
                academicYear: '2024-2025',
                schedule: {
                    dayOfWeek: 'Tuesday',
                    startTime: '11:00',
                    endTime: '12:30',
                    duration: 90
                },
                teacherLocation: {
                    latitude: 22.823101464024948,
                    longitude: 88.63942781760827,
                    address: 'Lab A, Engineering Building, Habra'
                },
                status: 'active', // Make class active for attendance
                sessionStartTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 mins ago
                enrolledStudents: students.map(s => ({ studentId: s._id })),
                createdBy: teacher._id
            },
            {
                classId: 'PHY101-F24',
                subject: 'Physics 101',
                subjectCode: 'PHY101',
                teacherId: teacher._id,
                teacherName: teacher.firstName + ' ' + teacher.lastName,
                department: 'Physics',
                semester: 1,
                academicYear: '2024-2025',
                schedule: {
                    dayOfWeek: 'Wednesday',
                    startTime: '19:00',
                    endTime: '21:00',
                    duration: 120
                },
                teacherLocation: {
                    latitude: 22.823101464024948,
                    longitude: 88.63942781760827,
                    address: 'Lab A, Engineering Building, Habra'
                },
                status: 'active', // Make class active for attendance
                sessionStartTime: new Date(), // Required when status is active
                enrolledStudents: students.map(s => ({ studentId: s._id })),
                createdBy: teacher._id
            },
            {
                classId: 'CHEM301-F24',
                subject: 'Chemistry Lab',
                subjectCode: 'CHEM301',
                teacherId: teacher._id,
                teacherName: teacher.firstName + ' ' + teacher.lastName,
                department: 'Chemistry',
                semester: 5,
                academicYear: '2024-2025',
                schedule: {
                    dayOfWeek: 'Friday',
                    startTime: '09:00',
                    endTime: '13:00',
                    duration: 240
                },
                teacherLocation: {
                    latitude: 22.823101464024948,
                    longitude: 88.63942781760827,
                    address: 'Lab A, Engineering Building, Habra'
                },
                status: 'active', // Make class active for attendance
                sessionStartTime: new Date(), // Required when status is active
                enrolledStudents: students.map(s => ({ studentId: s._id })),
                createdBy: teacher._id
            },
            {
                classId: 'ENG202-F24',
                subject: 'English Literature',
                subjectCode: 'ENG202',
                teacherId: teacher._id,
                teacherName: teacher.firstName + ' ' + teacher.lastName,
                department: 'English',
                semester: 3,
                academicYear: '2024-2025',
                schedule: {
                    dayOfWeek: 'Thursday',
                    startTime: '14:00',
                    endTime: '15:30',
                    duration: 90
                },
                teacherLocation: {
                    latitude: 22.823101464024948,
                    longitude: 88.63942781760827,
                    address: 'Lab A, Engineering Building, Habra'
                },
                status: 'active', // Make class active for attendance
                sessionStartTime: new Date(), // Required when status is active
                enrolledStudents: students.map(s => ({ studentId: s._id })),
                createdBy: teacher._id
            }
        ];

        const createdClasses = await Class.insertMany(classes);
        console.log(`Created ${createdClasses.length} sample classes:`);
        
        createdClasses.forEach(cls => {
            console.log(`- ${cls.subject} (${cls.subjectCode})`);
        });

        console.log('\n✅ Sample classes created successfully!');
        console.log('Students can now:');
        console.log('- View their enrolled classes');
        console.log('- Mark attendance for active sessions');

    } catch (error) {
        console.error('Error creating sample data:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createSampleData();
