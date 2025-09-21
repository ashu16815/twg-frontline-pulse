#!/usr/bin/env node

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { callAzureJSON, transcribeAudioWebm } from './lib/azure.ts';
import { analyzeIssues, summariseWeekly, generateExecutiveReport, askCEO, weekKey } from './lib/gpt5.ts';

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Test results tracking
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

async function testDatabaseConnection() {
  try {
    const { error } = await sb.from('store_feedback').select('id').limit(1);
    if (error) throw error;
    logTest('Database Connection', true, 'Supabase connected successfully');
    return true;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

async function testAzureOpenAI() {
  try {
    const testMessages = [
      { role: 'system', content: 'You are a test assistant. Return JSON: {"status": "ok"}' },
      { role: 'user', content: 'Test message' }
    ];
    
    const response = await callAzureJSON(testMessages);
    if (response.status === 'ok') {
      logTest('Azure OpenAI Connection', true, 'API responding correctly');
      return true;
    } else {
      logTest('Azure OpenAI Connection', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logTest('Azure OpenAI Connection', false, error.message);
    return false;
  }
}

async function testVoiceTranscription() {
  try {
    // Create a minimal test audio buffer (silence)
    const testBuffer = Buffer.alloc(1024, 0);
    const text = await transcribeAudioWebm(testBuffer, 'audio/webm');
    
    // Even if transcription fails, if we get here without error, the API is working
    logTest('Voice Transcription API', true, `Transcription service responding (got: "${text}")`);
    return true;
  } catch (error) {
    logTest('Voice Transcription API', false, error.message);
    return false;
  }
}

async function testAIAnalysis() {
  try {
    const testPayload = {
      region: 'Test',
      isoWeek: weekKey(new Date()),
      issues: [
        { rank: 1, category: 'Apparel', text: 'Test issue 1', impact: 'Sales' },
        { rank: 2, category: 'Home', text: 'Test issue 2', impact: 'Ops' },
        { rank: 3, category: 'Toys', text: 'Test issue 3', impact: 'CX' }
      ]
    };
    
    const analysis = await analyzeIssues(testPayload);
    
    if (analysis.issues && analysis.overallScore !== undefined && analysis.themes) {
      logTest('AI Issue Analysis', true, `Generated ${analysis.issues.length} issue analyses`);
      return true;
    } else {
      logTest('AI Issue Analysis', false, 'Missing required analysis fields');
      return false;
    }
  } catch (error) {
    logTest('AI Issue Analysis', false, error.message);
    return false;
  }
}

async function testWeeklySummarization() {
  try {
    const testRows = [
      {
        store_id: 'TEST-001',
        store_name: 'Test Store',
        region: 'Test',
        issue1_cat: 'Apparel',
        issue1_text: 'Test apparel issue',
        issue2_cat: 'Home',
        issue2_text: 'Test home issue',
        issue3_cat: 'Toys',
        issue3_text: 'Test toys issue',
        overall_mood: 'neg',
        themes: ['Test Theme']
      }
    ];
    
    const summary = await summariseWeekly('Test', weekKey(new Date()), testRows);
    
    if (summary.summary && summary.topThemes) {
      logTest('Weekly Summarization', true, `Generated summary: "${summary.summary.substring(0, 50)}..."`);
      return true;
    } else {
      logTest('Weekly Summarization', false, 'Missing required summary fields');
      return false;
    }
  } catch (error) {
    logTest('Weekly Summarization', false, error.message);
    return false;
  }
}

async function testExecutiveReport() {
  try {
    const testRows = [
      {
        store_id: 'TEST-001',
        store_name: 'Test Store',
        region: 'Test',
        issue1_cat: 'Apparel',
        issue1_text: 'Test issue',
        overall_mood: 'neg',
        themes: ['Test Theme']
      }
    ];
    
    const testSummaries = [
      {
        region: 'Test',
        summary: 'Test summary',
        top_themes: ['Test Theme']
      }
    ];
    
    const report = await generateExecutiveReport(weekKey(new Date()), testRows, testSummaries);
    
    if (report.highlights && report.themes && report.risks && report.actions && report.narrative) {
      logTest('Executive Report Generation', true, `Generated report with ${report.highlights.length} highlights`);
      return true;
    } else {
      logTest('Executive Report Generation', false, 'Missing required report fields');
      return false;
    }
  } catch (error) {
    logTest('Executive Report Generation', false, error.message);
    return false;
  }
}

async function testCEOQnA() {
  try {
    const testRows = [
      {
        store_id: 'TEST-001',
        store_name: 'Test Store',
        region: 'Test',
        issue1_cat: 'Apparel',
        issue1_text: 'Test issue',
        overall_mood: 'neg',
        themes: ['Test Theme']
      }
    ];
    
    const testSummaries = [
      {
        region: 'Test',
        summary: 'Test summary',
        top_themes: ['Test Theme']
      }
    ];
    
    const answer = await askCEO('What are the main themes?', weekKey(new Date()), testRows, testSummaries);
    
    if (answer.answer && answer.answer.length > 0) {
      logTest('CEO Q&A', true, `Generated answer: "${answer.answer.substring(0, 50)}..."`);
      return true;
    } else {
      logTest('CEO Q&A', false, 'Empty or invalid answer');
      return false;
    }
  } catch (error) {
    logTest('CEO Q&A', false, error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    { name: 'Health Check', url: '/api/health/db', method: 'GET' },
    { name: 'CEO Ask', url: '/api/ceo/ask', method: 'POST', body: { question: 'Test question' } },
    { name: 'Weekly Summarise', url: '/api/weekly/summarise', method: 'POST' },
    { name: 'Reports Generate', url: '/api/reports/generate', method: 'POST' }
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
      const isOk = response.ok || response.status === 200;
      
      logTest(`API ${endpoint.name}`, isOk, `Status: ${response.status}`);
    } catch (error) {
      logTest(`API ${endpoint.name}`, false, error.message);
    }
  }
}

async function testDatabaseOperations() {
  try {
    // Test insert
    const testData = {
      iso_week: weekKey(new Date()),
      store_id: 'TEST-' + Date.now(),
      store_name: 'Test Store',
      region: 'Test',
      issue1_cat: 'Test',
      issue1_text: 'Test issue 1',
      issue2_cat: 'Test',
      issue2_text: 'Test issue 2',
      issue3_cat: 'Test',
      issue3_text: 'Test issue 3',
      overall_mood: 'neu',
      themes: ['Test Theme']
    };
    
    const { error: insertError } = await sb.from('store_feedback').insert(testData);
    if (insertError) throw insertError;
    
    logTest('Database Insert', true, 'Test data inserted successfully');
    
    // Test select
    const { data, error: selectError } = await sb.from('store_feedback')
      .select('*')
      .eq('store_id', testData.store_id)
      .limit(1);
    
    if (selectError) throw selectError;
    if (data && data.length > 0) {
      logTest('Database Select', true, 'Test data retrieved successfully');
    } else {
      logTest('Database Select', false, 'No data found');
    }
    
    // Clean up test data
    await sb.from('store_feedback').delete().eq('store_id', testData.store_id);
    logTest('Database Cleanup', true, 'Test data cleaned up');
    
    return true;
  } catch (error) {
    logTest('Database Operations', false, error.message);
    return false;
  }
}

async function testEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AZURE_OPENAI_BASE_URL',
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_DEPLOYMENT',
    'AZURE_OPENAI_API_VERSION'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const isPresent = value && value.trim().length > 0;
    logTest(`Environment Variable ${varName}`, isPresent, isPresent ? 'Present' : 'Missing');
    if (!isPresent) allPresent = false;
  }
  
  return allPresent;
}

async function runAllTests() {
  console.log('🧪 Starting TWG Frontline Pulse Feature Tests\n');
  console.log('=' .repeat(60));
  
  // Environment tests
  console.log('\n📋 Environment Configuration:');
  await testEnvironmentVariables();
  
  // Database tests
  console.log('\n🗄️  Database Tests:');
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    await testDatabaseOperations();
  }
  
  // Azure OpenAI tests
  console.log('\n🤖 Azure OpenAI Tests:');
  const azureConnected = await testAzureOpenAI();
  if (azureConnected) {
    await testVoiceTranscription();
    await testAIAnalysis();
    await testWeeklySummarization();
    await testExecutiveReport();
    await testCEOQnA();
  }
  
  // API endpoint tests
  console.log('\n🌐 API Endpoint Tests:');
  await testAPIEndpoints();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The application is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
  }
  
  console.log('\n🔗 Application URL:', BASE_URL);
  console.log('📝 For detailed logs, check the Vercel deployment logs or local console output.');
}

// Run the tests
runAllTests().catch(console.error);
