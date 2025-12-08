const axios = require('axios');

async function checkActiveClasses() {
    try {
        console.log('🔍 Checking active classes via API...');
        
        // First, login as admin to get access token
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'admin@college.edu',
            password: 'admin123'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.data.accessToken;
        console.log('✅ Login successful, got access token');

        // Get active classes specifically
        const activeClassesResponse = await axios.get('http://localhost:5001/api/class/active', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('� Active Classes:');
        const activeClasses = activeClassesResponse.data.data || [];
        if (activeClasses.length === 0) {
            console.log('   No active classes found');
        } else {
            activeClasses.forEach((cls, index) => {
                console.log(`   ${index + 1}. ${cls.subject} (${cls.subjectCode})`);
                console.log(`      Teacher: ${cls.teacherName}`);
                console.log(`      Started: ${new Date(cls.sessionStartTime).toLocaleString()}`);
                console.log(`      Location: ${cls.teacherLocation?.address || 'Not set'}`);
                console.log(`      Enrolled Students: ${cls.enrolledStudents?.length || 0}`);
                console.log('');
            });
        }

        // Get teacher classes to see all classes
        try {
            const teacherClassesResponse = await axios.get('http://localhost:5001/api/class/my-classes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('\n� Teacher\'s Classes:');
            const teacherClasses = teacherClassesResponse.data.data || [];
            teacherClasses.forEach((cls, index) => {
                console.log(`   ${index + 1}. ${cls.subject} (${cls.subjectCode})`);
                console.log(`      Status: ${cls.status}`);
                console.log(`      Teacher: ${cls.teacherName}`);
                console.log(`      Schedule: ${cls.schedule.dayOfWeek} ${cls.schedule.startTime}-${cls.schedule.endTime}`);
                if (cls.status === 'active') {
                    console.log(`      🟢 Session Started: ${cls.sessionStartTime}`);
                    console.log(`      📍 Location: ${cls.teacherLocation?.address || 'Not set'}`);
                }
                console.log('');
            });
        } catch (error) {
            console.log('📚 Could not fetch teacher classes (user might not be a teacher)');
        }

        // Find Physics class specifically from active classes
        const physicsClass = activeClasses.find(cls => cls.subjectCode === 'PHY101');
        if (physicsClass) {
            console.log('⚛️ Physics Class Details:');
            console.log(`   Class ID: ${physicsClass.classId}`);
            console.log(`   Subject: ${physicsClass.subject}`);
            console.log(`   Status: ${physicsClass.status} ${physicsClass.status === 'active' ? '🟢' : '🔴'}`);
            console.log(`   Teacher: ${physicsClass.teacherName}`);
            console.log(`   Department: ${physicsClass.department}`);
            if (physicsClass.status === 'active') {
                console.log(`   Session Active Since: ${new Date(physicsClass.sessionStartTime).toLocaleString()}`);
                console.log(`   Location: ${physicsClass.teacherLocation?.address}`);
                console.log(`   Coordinates: (${physicsClass.teacherLocation?.latitude}, ${physicsClass.teacherLocation?.longitude})`);
                console.log(`   Geofence Radius: ${physicsClass.geofenceRadius} meters`);
            }
            console.log(`   Enrolled Students: ${physicsClass.enrolledStudents?.length || 0}`);
        } else {
            console.log('❌ Physics class not found in active classes');
        }

    } catch (error) {
        console.error('❌ Error checking classes:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
}

checkActiveClasses();
