import dotenv from 'dotenv';
import { callAzureJSON } from '../lib/azure.ts';

dotenv.config({ path: '.env.local' });

async function testAzureOpenAI() {
  try {
    console.log('🧪 Testing Azure OpenAI...');
    
    const testMessages = [
      { role: 'system', content: 'You are a helpful assistant. Return a JSON object with a "message" field.' },
      { role: 'user', content: 'Say hello and return JSON with a message field.' }
    ];
    
    const result = await callAzureJSON(testMessages);
    console.log('✅ Azure OpenAI Response:', result);
    
    if (result.message && result.message.includes('Mock')) {
      console.log('🚨 WARNING: Azure OpenAI is returning mock data!');
    } else {
      console.log('✅ Azure OpenAI is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Azure OpenAI test failed:', error.message);
  }
}

testAzureOpenAI();
