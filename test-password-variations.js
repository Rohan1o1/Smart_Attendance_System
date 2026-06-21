const axios = require('axios');

// Test both with and without trailing space
const testLogin = async () => {
  const apiClient = axios.create({
    baseURL: 'http://localhost:5002/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Test 1: With trailing space (failing)
  console.log('🧪 Test 1: With trailing space...');
  try {
    const credentialsWithSpace = {
      email: "admin@college.edu",
      password: "admin123 "
    };
    const response = await apiClient.post('/auth/login', credentialsWithSpace);
    console.log('✅ Test 1 SUCCESS:', response.data);
  } catch (error) {
    console.log('❌ Test 1 FAILED:', error.response?.data);
  }

  // Test 2: Without trailing space (should work)
  console.log('\n🧪 Test 2: Without trailing space...');
  try {
    const credentialsNoSpace = {
      email: "admin@college.edu",
      password: "admin123"
    };
    const response = await apiClient.post('/auth/login', credentialsNoSpace);
    console.log('✅ Test 2 SUCCESS:', response.data);
  } catch (error) {
    console.log('❌ Test 2 FAILED:', error.response?.data);
  }

  // Test 3: Trimmed password
  console.log('\n🧪 Test 3: Trimmed password...');
  try {
    const credentialsTrimmed = {
      email: "admin@college.edu",
      password: "admin123 ".trim() // Explicitly trim
    };
    const response = await apiClient.post('/auth/login', credentialsTrimmed);
    console.log('✅ Test 3 SUCCESS:', response.data);
  } catch (error) {
    console.log('❌ Test 3 FAILED:', error.response?.data);
  }
};

testLogin();
