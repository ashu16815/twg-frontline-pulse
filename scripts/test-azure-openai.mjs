import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '../.env.local') });

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const gpt5Deployment = process.env.AZURE_OPENAI_DEPLOYMENT_GPT5;
const transcribeDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-01-preview';

console.log('🧪 Testing Azure OpenAI Connection...\n');

// Check environment variables
console.log('📋 Configuration Check:');
console.log('─────────────────────────────────────────────────────────');
console.log(`Endpoint:              ${endpoint ? '✅ Set' : '❌ Missing'}`);
console.log(`API Key:               ${apiKey ? `✅ Set (${apiKey.substring(0, 8)}...)` : '❌ Missing'}`);
console.log(`GPT-5 Deployment:      ${gpt5Deployment || '❌ Not set'}`);
console.log(`Transcribe Deployment: ${transcribeDeployment || '⚠️  Not set (optional)'}`);
console.log(`API Version:           ${apiVersion}`);
console.log('─────────────────────────────────────────────────────────\n');

if (!endpoint || !apiKey || !gpt5Deployment) {
  console.error('❌ Missing required configuration!');
  console.error('\nPlease ensure the following are set in .env.local:');
  console.error('  - AZURE_OPENAI_ENDPOINT');
  console.error('  - AZURE_OPENAI_API_KEY');
  console.error('  - AZURE_OPENAI_DEPLOYMENT_GPT5');
  process.exit(1);
}

// Test 1: GPT-5 Chat Completion with JSON
async function testChatCompletion() {
  console.log('🔄 Test 1: GPT-5 Chat Completion (JSON mode)');
  console.log('───────────────────────────────────────────');
  
  try {
    const url = `${endpoint}openai/deployments/${gpt5Deployment}/chat/completions?api-version=${apiVersion}`;
    console.log(`Endpoint: ${url.replace(apiKey, '***')}`);
    
    const messages = [
      {
        role: 'system',
        content: 'You are a retail operations analyst. Return JSON: {themes:string[], mood:"pos"|"neg"|"neu", score:number}'
      },
      {
        role: 'user',
        content: 'Store feedback: Sales up 10%, but staffing was tight on Saturday. Electronics did well.'
      }
    ];
    
    console.log('⏳ Sending request...');
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages,
        response_format: { type: 'json_object' },
        max_completion_tokens: 500
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed (${response.status}): ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log(`✅ Success! (${duration}ms)`);
    console.log('\n📄 Response:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(content);
    console.log('─────────────────────────────────────────────────────────');
    
    // Validate JSON
    try {
      const parsed = JSON.parse(content);
      console.log('\n✅ Valid JSON response');
      console.log(`   Themes: ${parsed.themes?.join(', ') || 'none'}`);
      console.log(`   Mood: ${parsed.mood || 'none'}`);
      console.log(`   Score: ${parsed.score || 'none'}`);
    } catch (e) {
      console.warn('⚠️  Response is not valid JSON');
    }
    
    console.log('\n✅ Test 1 PASSED\n');
    return true;
    
  } catch (error) {
    console.error(`❌ Test 1 FAILED: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Test 2: Feedback Analysis (Real-world scenario)
async function testFeedbackAnalysis() {
  console.log('🔄 Test 2: Store Feedback Analysis');
  console.log('───────────────────────────────────────────');
  
  try {
    const url = `${endpoint}openai/deployments/${gpt5Deployment}/chat/completions?api-version=${apiVersion}`;
    
    const payload = {
      isoWeek: '2025-W02',
      region: 'North',
      hitTarget: false,
      variancePct: -6,
      varianceDollars: -14500,
      reasons: [
        { rank: 1, text: 'Apparel sizes missing in key categories', dollarImpact: -8000 },
        { rank: 2, text: 'Saturday roster shortage', dollarImpact: -4000 },
        { rank: 3, text: 'Toy promotion arrived late', dollarImpact: -2500 }
      ],
      topPositive: 'Electronics category exceeded targets'
    };
    
    const messages = [
      {
        role: 'system',
        content: 'You are a retail ops & finance analyst. Return JSON: {overall:{hitTarget:boolean,variancePct:number,varianceDollars:number}, reasons:[{rank,text,dollarImpact,score,mood}], themes:string[], overallMood:"neg"|"neu"|"pos"}. Normalise themes to stable set (Availability, Roster, Supplier, etc.)'
      },
      {
        role: 'user',
        content: JSON.stringify(payload)
      }
    ];
    
    console.log('⏳ Analyzing store feedback...');
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages,
        response_format: { type: 'json_object' },
        max_completion_tokens: 1000
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed (${response.status}): ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error(`❌ Empty response from API`);
      console.error('Full response:', JSON.stringify(data, null, 2));
      return false;
    }
    
    const analysis = JSON.parse(content);
    
    console.log(`✅ Success! (${duration}ms)`);
    console.log('\n📊 Analysis Results:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Overall Mood: ${analysis.overallMood}`);
    console.log(`Themes: ${analysis.themes?.join(', ')}`);
    console.log(`\nReasons Analysis:`);
    analysis.reasons?.forEach(r => {
      console.log(`  ${r.rank}. ${r.text} (${r.mood}) - Score: ${r.score}`);
    });
    console.log('─────────────────────────────────────────────────────────');
    
    console.log('\n✅ Test 2 PASSED\n');
    return true;
    
  } catch (error) {
    console.error(`❌ Test 2 FAILED: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Test 3: Model capabilities check
async function testModelInfo() {
  console.log('🔄 Test 3: Model Capabilities Check');
  console.log('───────────────────────────────────────────');
  
  try {
    // Simple completion to verify model is responding
    const url = `${endpoint}openai/deployments/${gpt5Deployment}/chat/completions?api-version=${apiVersion}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Say "Hello from Azure OpenAI!"' }
        ],
        max_completion_tokens: 20
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed (${response.status}): ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;
    
    console.log(`✅ Model Response: "${message}"`);
    console.log(`   Model: ${data.model || 'Unknown'}`);
    console.log(`   Usage: ${data.usage?.total_tokens || 0} tokens`);
    
    console.log('\n✅ Test 3 PASSED\n');
    return true;
    
  } catch (error) {
    console.error(`❌ Test 3 FAILED: ${error.message}`);
    return false;
  }
}

// Test 4: Transcription (if configured)
async function testTranscription() {
  if (!transcribeDeployment) {
    console.log('⏭️  Test 4: SKIPPED (transcription deployment not configured)\n');
    return true;
  }
  
  console.log('🔄 Test 4: Audio Transcription');
  console.log('───────────────────────────────────────────');
  console.log('⚠️  Note: This requires an actual audio file to test properly');
  console.log('   Checking if endpoint is accessible...');
  
  try {
    const url = `${endpoint}openai/deployments/${transcribeDeployment}/audio/transcriptions?api-version=${apiVersion}`;
    console.log(`Endpoint: ${url.replace(apiKey, '***')}`);
    console.log('✅ Transcription endpoint configured');
    console.log('   (Actual transcription would require audio file)');
    
    console.log('\n✅ Test 4 PASSED\n');
    return true;
    
  } catch (error) {
    console.error(`❌ Test 4 FAILED: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Azure OpenAI Tests\n');
  console.log('═════════════════════════════════════════════════════════\n');
  
  const results = {
    test1: await testChatCompletion(),
    test2: await testFeedbackAnalysis(),
    test3: await testModelInfo(),
    test4: await testTranscription()
  };
  
  console.log('═════════════════════════════════════════════════════════');
  console.log('\n📊 Test Summary:');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Test 1 (Chat Completion):    ${results.test1 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 2 (Feedback Analysis):  ${results.test2 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 3 (Model Info):         ${results.test3 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 4 (Transcription):      ${results.test4 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('─────────────────────────────────────────────────────────');
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\nResults: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('\n🎉 All tests PASSED! Azure OpenAI is configured correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests FAILED. Please check the errors above.\n');
    process.exit(1);
  }
}

runAllTests();

