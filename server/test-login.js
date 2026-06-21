/**
 * Test login endpoint to diagnose 500 error
 */

const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

async function testLogin() {
  try {
    console.log('Testing login with teacher credentials...');
    console.log('Email: oliviacse@gmail.com');
    console.log('Password: 12345678');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'oliviacse@gmail.com',
      password: '12345678'
    }, {
      validateStatus: () => true // Don't throw on any status code
    });

    console.log('\n✅ Response received');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers['content-type']);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testLogin();
