const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/v1';

async function testEndpoints() {
  console.log('🧪 Testing TekBot Backend Endpoints...\n');

  // Test 1: Health Check
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', response.data.data.status);
  } catch (error) {
    console.log('❌ Health Check failed:', error.message);
  }

  // Test 2: Version Info
  try {
    const response = await axios.get(`${BASE_URL}/version`);
    console.log('✅ Version Info:', response.data.data.version);
  } catch (error) {
    console.log('❌ Version Info failed:', error.message);
  }

  // Test 3: AI Chat (without API key - should handle gracefully)
  try {
    const response = await axios.post(`${BASE_URL}/openai/chat`, {
      message: 'Hello, test message'
    });
    console.log('✅ AI Chat endpoint responding:', response.data.success);
  } catch (error) {
    console.log('❌ AI Chat failed:', error.message);
  }

  // Test 4: Widget Config (public endpoint with mock tenant)
  try {
    // Generate a mock UUID for testing
    const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';
    const response = await axios.get(`${BASE_URL}/widget-config/public/${mockTenantId}`);
    console.log('✅ Widget Config endpoint responding');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Widget Config endpoint working (tenant not found as expected)');
    } else {
      console.log('❌ Widget Config failed:', error.message);
    }
  }

  // Test 5: Auth endpoints (should require authentication)
  try {
    const response = await axios.get(`${BASE_URL}/auth/profile`);
    console.log('❌ Auth endpoint should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Auth endpoint properly protected');
    } else {
      console.log('❌ Auth endpoint error:', error.message);
    }
  }

  console.log('\n🎉 Backend testing complete!');
}

testEndpoints().catch(console.error);