const axios = require('axios');

// Simulate exactly what the frontend does
const testLogin = async () => {
  try {
    console.log('🧪 Testing frontend-style login...');
    
    // Create axios instance with same config as frontend
    const apiClient = axios.create({
      baseURL: 'http://localhost:5001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Test credentials exactly as frontend would send
    const credentials = {
      email: "admin@college.edu",
      password: "admin123 " // Including the trailing space from your credentials
    };

    console.log('🔑 Testing with credentials:', credentials);
    console.log('🔑 Password details:', {
      length: credentials.password.length,
      chars: credentials.password.split('').map((c, i) => `${i}:'${c}'(${c.charCodeAt(0)})`)
    });

    const response = await apiClient.post('/auth/login', credentials);
    
    console.log('✅ Login successful!');
    console.log('📊 Status:', response.status);
    console.log('📊 Data:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('📊 Status:', error.response?.status);
    console.log('📊 Data:', error.response?.data);
    console.log('📊 Error message:', error.message);
  }
};

testLogin();
