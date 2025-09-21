#!/usr/bin/env node

// Test script for Vercel deployment
const BASE_URL = 'https://twg-frontline-pulse.vercel.app';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${message ? ` - ${message}` : ''}`);
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function testPageLoads() {
  const pages = [
    { name: 'Home Page', url: '/' },
    { name: 'Weekly Submit', url: '/weekly/submit' },
    { name: 'Reports Page', url: '/reports' },
    { name: 'CEO Office', url: '/ceo' },
    { name: 'CEO Demo', url: '/ceo-demo' }
  ];
  
  for (const page of pages) {
    try {
      const response = await fetch(`${BASE_URL}${page.url}`);
      const isOk = response.ok;
      const status = response.status;
      
      if (isOk) {
        const html = await response.text();
        const hasContent = html.includes('TWG Frontline Pulse') || html.includes('Weekly Report') || html.includes('CEO Office');
        logTest(`Page Load: ${page.name}`, hasContent, `Status: ${status}, Content: ${hasContent ? 'Yes' : 'No'}`);
      } else {
        logTest(`Page Load: ${page.name}`, false, `Status: ${status}`);
      }
    } catch (error) {
      logTest(`Page Load: ${page.name}`, false, error.message);
    }
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    { 
      name: 'Health Check', 
      url: '/api/health/db', 
      method: 'GET',
      expectedStatus: [200]
    },
    { 
      name: 'CEO Ask', 
      url: '/api/ceo/ask', 
      method: 'POST', 
      body: { question: 'What are the main themes this week?' },
      expectedStatus: [200]
    },
    { 
      name: 'Weekly Summarise', 
      url: '/api/weekly/summarise', 
      method: 'POST',
      expectedStatus: [200]
    },
    { 
      name: 'Reports Generate', 
      url: '/api/reports/generate', 
      method: 'POST',
      expectedStatus: [200]
    },
    { 
      name: 'Auth Check', 
      url: '/api/auth', 
      method: 'POST',
      body: { code: 'test' },
      expectedStatus: [401, 200]
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`${BASE_URL}${endpoint.url}`, options);
      const isExpectedStatus = endpoint.expectedStatus.includes(response.status);
      
      let responseData = null;
      try {
        responseData = await response.json();
      } catch (e) {
        // Some endpoints might not return JSON
      }
      
      logTest(`API ${endpoint.name}`, isExpectedStatus, 
        `Status: ${response.status}${responseData ? `, Response: ${JSON.stringify(responseData).substring(0, 100)}...` : ''}`);
    } catch (error) {
      logTest(`API ${endpoint.name}`, false, error.message);
    }
  }
}

async function testVoiceTranscription() {
  try {
    // Create a minimal test audio file (silence)
    const testBuffer = new ArrayBuffer(1024);
    const testBlob = new Blob([testBuffer], { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('file', testBlob, 'test.webm');
    formData.append('mime', 'audio/webm');
    
    const response = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData
    });
    
    const isOk = response.ok;
    let responseData = null;
    
    try {
      responseData = await response.json();
    } catch (e) {
      // Might not be JSON
    }
    
    logTest('Voice Transcription API', isOk, 
      `Status: ${response.status}${responseData ? `, Response: ${JSON.stringify(responseData).substring(0, 100)}...` : ''}`);
  } catch (error) {
    logTest('Voice Transcription API', false, error.message);
  }
}

async function testAzureAIIntegration() {
  try {
    // Test CEO Q&A with a specific question
    const response = await fetch(`${BASE_URL}/api/ceo/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What are the biggest risks this week?' })
    });
    
    const data = await response.json();
    const hasAnswer = data.answer && data.answer.length > 0;
    const isAzureResponse = hasAnswer && !data.answer.includes('No data available');
    
    logTest('Azure AI Integration', isAzureResponse, 
      `Response: ${data.answer ? data.answer.substring(0, 100) + '...' : 'No answer'}`);
  } catch (error) {
    logTest('Azure AI Integration', false, error.message);
  }
}

async function testDatabaseIntegration() {
  try {
    // Test health check
    const healthResponse = await fetch(`${BASE_URL}/api/health/db`);
    const healthData = await healthResponse.json();
    
    const isDbConnected = healthData.ok === true;
    logTest('Database Integration', isDbConnected, 
      `Health: ${healthData.ok ? 'Connected' : 'Disconnected'}${healthData.error ? ` (${healthData.error})` : ''}`);
  } catch (error) {
    logTest('Database Integration', false, error.message);
  }
}

async function testFormSubmission() {
  try {
    // Test form submission (this will redirect, so we check for redirect response)
    const formData = new FormData();
    formData.append('storeId', 'TEST-001');
    formData.append('storeName', 'Test Store');
    formData.append('region', 'Test');
    formData.append('issue1Cat', 'Test');
    formData.append('issue1Text', 'Test issue 1');
    formData.append('issue2Cat', 'Test');
    formData.append('issue2Text', 'Test issue 2');
    formData.append('issue3Cat', 'Test');
    formData.append('issue3Text', 'Test issue 3');
    
    const response = await fetch(`${BASE_URL}/api/weekly/submit`, {
      method: 'POST',
      body: formData
    });
    
    // Form submission should redirect (status 302) or return success
    const isSuccess = response.ok || response.status === 302;
    logTest('Form Submission', isSuccess, `Status: ${response.status}`);
  } catch (error) {
    logTest('Form Submission', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Testing TWG Frontline Pulse Vercel Deployment\n');
  console.log('=' .repeat(60));
  console.log(`🌐 Testing URL: ${BASE_URL}\n`);
  
  // Page load tests
  console.log('📄 Page Load Tests:');
  await testPageLoads();
  
  // API endpoint tests
  console.log('\n🌐 API Endpoint Tests:');
  await testAPIEndpoints();
  
  // Voice transcription test
  console.log('\n🎙️  Voice Features:');
  await testVoiceTranscription();
  
  // Azure AI integration test
  console.log('\n🤖 AI Integration:');
  await testAzureAIIntegration();
  
  // Database integration test
  console.log('\n🗄️  Database Integration:');
  await testDatabaseIntegration();
  
  // Form submission test
  console.log('\n📝 Form Submission:');
  await testFormSubmission();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The Vercel deployment is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above for issues.');
  }
  
  console.log('\n🔗 Application URL:', BASE_URL);
  console.log('📝 For detailed logs, check the Vercel deployment logs.');
}

// Run the tests
runAllTests().catch(console.error);
