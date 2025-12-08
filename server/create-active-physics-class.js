const mongoose = require('mongoose');
const Class = require('./models/Class');
const User = require('./models/User');

async function createActivePhysicsClass() {
    try {
        await mongoose.connect('mongodb://localhost:27017/attendance_system');
        console.log('🔌 Connected to database');

        // Get teacher and students
        const teacher = await User.findOne({ role: 'teacher' });
        const students = await User.find({ role: 'student' });

        if (!teacher) {
            console.log('❌ No teacher found. Creating sample users first...');
            await mongoose.disconnect();
            return;
        }

        console.log(`👨‍🏫 Found teacher: ${teacher.firstName} ${teacher.lastName}`);
        console.log(`👥 Found ${students.length} students`);

        // Check if Physics class already exists
        let physicsClass = await Class.findOne({ subjectCode: 'PHY101' });

        if (physicsClass) {
            console.log('📚 Physics class found, updating to active status...');
            
            // Update to active status with current session
            physicsClass.status = 'active';
            physicsClass.sessionStartTime = new Date();
            physicsClass.teacherLocation = {
                latitude: 22.823101464024948,
                longitude: 88.63942781760827,
                address: 'Physics Lab, Main Building',
                capturedAt: new Date()
            };

            await physicsClass.save();
            console.log('✅ Physics class updated to active status');
        } else {
            console.log('📚 Creating new Physics class...');
            
            // Create new Physics class
            physicsClass = new Class({
                classId: 'PHY101-W25',
                subject: 'Physics 101 - Mechanics & Thermodynamics',
                subjectCode: 'PHY101',
                teacherId: teacher._id,
                teacherName: `${teacher.firstName} ${teacher.lastName}`,
                department: 'Physics',
                semester: 1,
                academicYear: '2024-2025',
                schedule: {
                    dayOfWeek: 'Monday',
                    startTime: '14:00',
                    endTime: '16:00',
                    duration: 120
                },
                teacherLocation: {
                    latitude: 22.823101464024948,
                    longitude: 88.63942781760827,
                    address: 'Physics Lab, Main Building',
                    capturedAt: new Date()
                },
                geofenceRadius: 25,
                status: 'active',
                sessionStartTime: new Date(),
                enrolledStudents: students.map(student => ({
                    studentId: student._id,
                    enrolledAt: new Date()
                })),
                maxCapacity: 50,
                createdBy: teacher._id,
                isActive: true
            });

            await physicsClass.save();
            console.log('✅ New Physics class created and activated');
        }

        // Display class information
        console.log('\n📋 Active Physics Class Information:');
        console.log(`   Class ID: ${physicsClass.classId}`);
        console.log(`   Subject: ${physicsClass.subject}`);
        console.log(`   Subject Code: ${physicsClass.subjectCode}`);
        console.log(`   Teacher: ${physicsClass.teacherName}`);
        console.log(`   Department: ${physicsClass.department}`);
        console.log(`   Status: ${physicsClass.status}`);
        console.log(`   Session Started: ${physicsClass.sessionStartTime}`);
        console.log(`   Location: ${physicsClass.teacherLocation.address}`);
        console.log(`   Enrolled Students: ${physicsClass.enrolledStudents.length}`);
        console.log(`   Schedule: ${physicsClass.schedule.dayOfWeek} ${physicsClass.schedule.startTime}-${physicsClass.schedule.endTime}`);

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database');
        console.log('🎉 Physics class is now active and ready for attendance!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createActivePhysicsClass();
