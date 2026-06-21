const axios = require('axios');

async function checkPhysicsClass() {
    try {
        console.log('🔍 Checking Physics class status...');
        
        // Login as admin
        const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'admin@college.edu',
            password: 'admin123'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.data.accessToken;
        console.log('✅ Login successful');

        // Get active classes
        console.log('\n🔍 Fetching active classes...');
        const activeResponse = await axios.get('http://localhost:5002/api/class/active', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📊 Active classes API response:');
        console.log('   Status:', activeResponse.status);
        console.log('   Success:', activeResponse.data.success);
        console.log('   Data type:', typeof activeResponse.data.data);
        
        if (activeResponse.data.data) {
            console.log('   Data content:', JSON.stringify(activeResponse.data.data, null, 2));
        }

        // Check if Physics is active
        const activeClasses = activeResponse.data.data.classes || [];
        let physicsFound = false;

        if (Array.isArray(activeClasses)) {
            console.log(`\n📚 Found ${activeClasses.length} active classes:`);
            activeClasses.forEach((cls, index) => {
                console.log(`   ${index + 1}. ${cls.subject} (${cls.subjectCode})`);
                if (cls.subjectCode === 'PHY101') {
                    physicsFound = true;
                    console.log('   ⚛️ ✅ PHYSICS CLASS FOUND AND ACTIVE!');
                    console.log(`      Class ID: ${cls.classId}`);
                    console.log(`      Teacher: ${cls.teacherName}`);
                    console.log(`      Location: ${cls.teacherLocation?.address}`);
                    console.log(`      Session started: ${new Date(cls.sessionStartTime).toLocaleString()}`);
                    console.log(`      Coordinates: (${cls.teacherLocation?.latitude}, ${cls.teacherLocation?.longitude})`);
                    console.log(`      Geofence radius: ${cls.geofenceRadius} meters`);
                    console.log(`      Enrolled students: ${cls.enrolledStudents?.length || 0}`);
                }
            });
        }

        if (!physicsFound) {
            console.log('\n❌ Physics class not found in active classes');
            console.log('🔧 Let me try to activate it...');
            
            // Try to find and activate physics class via direct database query
            const activateResponse = await axios.post('http://localhost:5002/api/direct-activate-physics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(() => {
                console.log('🔧 Direct activation not available, class may need manual activation');
            });
        } else {
            console.log('\n🎉 SUCCESS: Physics class is active and ready for attendance!');
            console.log('📱 Students can now mark attendance using the mobile app');
            console.log('🌐 Teachers can view real-time attendance on the dashboard');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

checkPhysicsClass();
