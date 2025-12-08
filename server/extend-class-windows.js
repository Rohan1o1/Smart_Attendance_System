const mongoose = require('mongoose');
const Class = require('./models/Class');

async function extendAttendanceWindows() {
    try {
        await mongoose.connect('mongodb://localhost:27017/attendance_system');
        console.log('🔗 Connected to database');

        // Find Computer Science 101 and Chemistry Lab classes
        const targetClasses = await Class.find({
            $or: [
                { subject: 'Computer Science 101' },
                { subject: 'Chemistry Lab' }
            ]
        });

        if (targetClasses.length === 0) {
            console.log('❌ No target classes found');
            return;
        }

        console.log(`📚 Found ${targetClasses.length} classes to update`);

        // Update session times and status
        const currentTime = new Date();
        const sessionStartTime = new Date(currentTime.getTime() - 15 * 60 * 1000); // Started 15 mins ago
        
        for (const classDoc of targetClasses) {
            await Class.updateOne(
                { _id: classDoc._id },
                {
                    status: 'active',
                    sessionStartTime: sessionStartTime,
                    // Extend attendance window until 17:00 (5 PM)
                    schedule: {
                        ...classDoc.schedule,
                        endTime: '13:00'
                    }
                }
            );

            console.log(`✅ Updated ${classDoc.subject}:`);
            console.log(`   - Status: active`);
            console.log(`   - Session started: ${sessionStartTime.toLocaleTimeString()}`);
            console.log(`   - New end time: 13:00`);
            console.log(`   - Attendance window: ${sessionStartTime.toLocaleTimeString()} - ${new Date(sessionStartTime.getTime() + 4.75 * 60 * 60 * 1000).toLocaleTimeString()}`);
        }

        console.log('\n🎉 Classes updated successfully!');
        console.log('📝 Students can now mark attendance for these classes until approximately 5:00 PM');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('💾 Disconnected from database');
    }
}

// Check if script is run directly
if (require.main === module) {
    extendAttendanceWindows().then(() => process.exit(0));
}

module.exports = { extendAttendanceWindows };
