const mongoose = require('mongoose');
const Class = require('./models/Class');

async function fixAttendanceWindows() {
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

        // Update attendance window settings
        for (const classDoc of targetClasses) {
            const currentTime = new Date();
            
            // Set session start time to now - 15 minutes (so window is open)
            const sessionStartTime = new Date(currentTime.getTime() - 15 * 60 * 1000);
            
            await Class.updateOne(
                { _id: classDoc._id },
                {
                    status: 'active',
                    sessionStartTime: sessionStartTime,
                    attendanceWindow: {
                        beforeMinutes: 15,
                        afterMinutes: 300 // 5 hours = 300 minutes
                    }
                }
            );

            // Calculate window times for display
            const windowStart = new Date(sessionStartTime.getTime() - 15 * 60 * 1000);
            const windowEnd = new Date(sessionStartTime.getTime() + 300 * 60 * 1000);

            console.log(`✅ Updated ${classDoc.subject}:`);
            console.log(`   - Status: active`);
            console.log(`   - Session started: ${sessionStartTime.toLocaleString()}`);
            console.log(`   - Window opens: ${windowStart.toLocaleString()}`);
            console.log(`   - Window closes: ${windowEnd.toLocaleString()}`);
            console.log(`   - Current time: ${currentTime.toLocaleString()}`);
            console.log(`   - Window is: ${currentTime >= windowStart && currentTime <= windowEnd ? 'OPEN ✅' : 'CLOSED ❌'}`);
        }

        console.log('\n🎉 Attendance windows updated successfully!');
        console.log('📝 Students can now mark attendance with extended windows');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('💾 Disconnected from database');
    }
}

// Check if script is run directly
if (require.main === module) {
    fixAttendanceWindows().then(() => process.exit(0));
}

module.exports = { fixAttendanceWindows };
