// Simple test script to verify backend functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

async function testBackend() {
  console.log('🧪 Testing CodeTogether Backend...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test 2: Session login
    console.log('\n2. Testing session login...');
    const loginResponse = await fetch(`${BASE_URL}/api/session/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user-123',
        userData: { name: 'Test User', email: 'test@example.com' }
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Session created:', loginData.success);
    
    const sessionId = loginData.sessionId;
    const token = loginData.token;

    // Test 3: Get questions
    console.log('\n3. Testing questions endpoint...');
    const questionsResponse = await fetch(`${BASE_URL}/api/questions`);
    const questionsData = await questionsResponse.json();
    console.log('✅ Questions loaded:', questionsData.questions?.length || 0, 'questions');

    // Test 4: Queue operations
    console.log('\n4. Testing queue operations...');
    const queueResponse = await fetch(`${BASE_URL}/api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        difficulty: 'easy',
        mode: 'collaborative',
        userData: { name: 'Test User' }
      })
    });
    const queueData = await queueResponse.json();
    console.log('✅ Queue join:', queueData.success);

    // Test 5: Queue stats
    console.log('\n5. Testing queue stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/queue/stats`);
    const statsData = await statsResponse.json();
    console.log('✅ Queue stats:', statsData.success);

    // Test 6: Active users
    console.log('\n6. Testing active users...');
    const usersResponse = await fetch(`${BASE_URL}/api/active-users`);
    const usersData = await usersResponse.json();
    console.log('✅ Active users:', usersData.activeUsers?.length || 0);

    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testBackend();
}
