const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function checkCredentials() {
    try {
        await mongoose.connect('mongodb://localhost:27017/attendance_system');
        console.log('=== CHECKING USER CREDENTIALS ===\n');
        
        // Get all users
        const users = await User.find({}).select('email role firstName lastName password');
        
        const testPasswords = ['password123', 'admin123', 'teacher123', 'student123', '123456', 'password'];
        
        for (const user of users) {
            console.log(`${user.role.toUpperCase()}: ${user.firstName} ${user.lastName}`);
            console.log(`Email: ${user.email}`);
            
            // Try common passwords
            let foundPassword = null;
            for (const testPass of testPasswords) {
                try {
                    const isMatch = await bcrypt.compare(testPass, user.password);
                    if (isMatch) {
                        foundPassword = testPass;
                        break;
                    }
                } catch (err) {
                    // Continue checking
                }
            }
            
            if (foundPassword) {
                console.log(`Password: ${foundPassword} ✅`);
            } else {
                console.log('Password: Unknown (not in common list) ❌');
            }
            console.log('---\n');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

checkCredentials();
