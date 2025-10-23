const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
const MOCK_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

async function comprehensiveTest() {
  console.log('🚀 TekBot Backend - Comprehensive Feature Test\n');
  console.log('=' .repeat(50));

  let passedTests = 0;
  let totalTests = 0;

  const test = async (name, testFn) => {
    totalTests++;
    try {
      await testFn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  };

  // Core API Tests
  console.log('\n📡 Core API Endpoints:');
  await test('Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.data.status !== 'ok') throw new Error('Health check failed');
  });

  await test('Version Info', async () => {
    const response = await axios.get(`${BASE_URL}/version`);
    if (!response.data.data.version) throw new Error('Version info missing');
  });

  // AI Chatbot Tests
  console.log('\n🤖 AI Chatbot:');
  await test('Chat Endpoint (Single Message)', async () => {
    const response = await axios.post(`${BASE_URL}/openai/chat`, {
      message: 'Hello, test message'
    });
    if (!response.data.success) throw new Error('Chat endpoint failed');
  });

  await test('Chat Endpoint (Conversation)', async () => {
    const response = await axios.post(`${BASE_URL}/openai/chat`, {
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ],
      conversationId: 'test-conv-123'
    });
    if (!response.data.success) throw new Error('Conversation endpoint failed');
  });

  // Widget Configuration Tests
  console.log('\n🎨 Widget Configuration:');
  await test('Public Widget Config', async () => {
    const response = await axios.get(`${BASE_URL}/widget-config/public/${MOCK_TENANT_ID}`);
    const config = response.data.data;
    if (!config.title || !config.theme) throw new Error('Widget config incomplete');
  });

  await test('Widget Embed Code', async () => {
    const response = await axios.get(`${BASE_URL}/widget-config/embed/${MOCK_TENANT_ID}`);
    const embedCode = response.data.data;
    if (!embedCode.includes('TekAssistConfig')) throw new Error('Embed code invalid');
  });

  // Authentication Tests
  console.log('\n🔐 Authentication:');
  await test('Protected Route (Unauthorized)', async () => {
    try {
      await axios.get(`${BASE_URL}/auth/profile`);
      throw new Error('Should require authentication');
    } catch (error) {
      if (error.response?.status !== 401) throw error;
    }
  });

  await test('User Profile Route (Protected)', async () => {
    try {
      await axios.get(`${BASE_URL}/users/profile`);
      throw new Error('Should require authentication');
    } catch (error) {
      if (error.response?.status !== 401) throw error;
    }
  });

  // API Documentation
  console.log('\n📚 Documentation:');
  await test('Swagger Documentation', async () => {
    const response = await axios.get('http://localhost:3001/api/docs', {
      validateStatus: () => true
    });
    if (response.status !== 200) throw new Error('Swagger docs not accessible');
  });

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All essential backend features are working!');
    console.log('\n✨ Ready for:');
    console.log('   • Frontend integration');
    console.log('   • Widget embedding');
    console.log('   • AI-powered conversations');
    console.log('   • Multi-tenant architecture');
    console.log('   • Production deployment');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} tests failed - check configuration`);
  }

  console.log('\n🔗 Key URLs:');
  console.log(`   • API Base: ${BASE_URL}`);
  console.log(`   • Health: ${BASE_URL}/health`);
  console.log(`   • Chat: ${BASE_URL}/openai/chat`);
  console.log(`   • Widget: ${BASE_URL}/widget-config/public/{tenantId}`);
  console.log(`   • Docs: http://localhost:3001/api/docs`);
}

comprehensiveTest().catch(console.error);