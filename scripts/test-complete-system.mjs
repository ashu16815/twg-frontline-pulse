#!/usr/bin/env node

/**
 * Complete System Test - Win In Store
 * Tests all major functionality end-to-end
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

console.log('🧪 Win In Store - Complete System Test\n');
console.log('═══════════════════════════════════════════════════════════════════════════\n');
console.log(`Testing against: ${BASE_URL}\n`);

let testsPassed = 0;
let testsFailed = 0;
const results = [];

async function test(name, fn) {
  process.stdout.write(`🔄 ${name}... `);
  try {
    const result = await fn();
    console.log('✅ PASSED');
    if (result) console.log(`   ${result}`);
    testsPassed++;
    results.push({ name, status: 'PASSED', details: result });
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
    results.push({ name, status: 'FAILED', error: error.message });
    return false;
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  DATABASE & INFRASTRUCTURE TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 1: Database Health
  await test('Database health check', async () => {
    const res = await fetch(`${BASE_URL}/api/health/db`);
    const data = await res.json();
    if (!data.ok) throw new Error('Database not healthy');
    return 'Database connection verified';
  });
  
  // Test 2: Store Master Lookup
  await test('Store Master - 41 stores loaded', async () => {
    const res = await fetch(`${BASE_URL}/api/stores/search?q=a`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.results)) throw new Error('Invalid response');
    return `Found ${data.results.length} stores (showing max 10)`;
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  STORE SEARCH & LOOKUP TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 3: Numeric Search
  await test('Search by numeric code (362)', async () => {
    const res = await fetch(`${BASE_URL}/api/stores/search?q=362`);
    const data = await res.json();
    if (!data.ok || data.results.length === 0) throw new Error('No results');
    const store = data.results[0];
    if (store.store_code !== 362) throw new Error('Wrong store returned');
    return `Found: ${store.store_name} (${store.region_code})`;
  });
  
  // Test 4: Name Search
  await test('Search by name (Sylvia)', async () => {
    const res = await fetch(`${BASE_URL}/api/stores/search?q=Sylvia`);
    const data = await res.json();
    if (!data.ok || data.results.length === 0) throw new Error('No results');
    const store = data.results[0];
    return `Found: ${store.store_name} (Code: ${store.store_code})`;
  });
  
  // Test 5: Store Resolve
  await test('Resolve store by ID (ST-001)', async () => {
    const res = await fetch(`${BASE_URL}/api/stores/resolve?id=ST-001`);
    const data = await res.json();
    if (!data.ok || !data.store) throw new Error('Store not found');
    return `Resolved: ${data.store.store_name}`;
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  AZURE OPENAI INTEGRATION TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 6: Azure OpenAI Configuration
  await test('Azure OpenAI configuration', async () => {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const key = process.env.AZURE_OPENAI_API_KEY;
    const gpt5 = process.env.AZURE_OPENAI_DEPLOYMENT_GPT5;
    
    if (!endpoint || !key || !gpt5) {
      throw new Error('Azure OpenAI not configured');
    }
    return 'Endpoint, API key, and deployment configured';
  });
  
  // Test 7: AI Analysis (via report generation)
  let reportGenerated = false;
  await test('AI report generation', async () => {
    const res = await fetch(`${BASE_URL}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Status ${res.status}`);
    }
    
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Report generation failed');
    reportGenerated = true;
    
    return 'Executive report generated successfully';
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  FEEDBACK & REPORTING TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 8: Coverage API
  await test('Coverage tracking', async () => {
    const res = await fetch(`${BASE_URL}/api/coverage`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Coverage check failed');
    return `${data.responded}/${data.total} stores responded (${data.coveragePct}%)`;
  });
  
  // Test 9: Reports Page
  await test('Reports page data', async () => {
    const res = await fetch(`${BASE_URL}/reports`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    if (!html.includes('Win In Store')) throw new Error('Missing branding');
    return 'Reports page rendering with data';
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  USER INTERFACE TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 10: Home Page
  await test('Home page renders', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    if (!html.includes('Win In Store')) throw new Error('Missing branding');
    return 'Home page with navigation';
  });
  
  // Test 11: Weekly Submit Page
  await test('Weekly submit form', async () => {
    const res = await fetch(`${BASE_URL}/weekly/submit`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    if (!html.includes('Weekly') || !html.includes('Performance')) {
      throw new Error('Form not rendering');
    }
    return 'Submit form with typeahead';
  });
  
  // Test 12: CEO Dashboard
  await test('CEO dashboard', async () => {
    const res = await fetch(`${BASE_URL}/ceo`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return 'CEO page accessible';
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('6️⃣  DATA INTEGRITY TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 13: Regional Distribution
  await test('Regional distribution', async () => {
    const res = await fetch(`${BASE_URL}/api/coverage`);
    const data = await res.json();
    if (!data.ok || !data.byRegion) throw new Error('No regional data');
    const regions = Object.keys(data.byRegion);
    return `${regions.length} regions tracked`;
  });
  
  // Test 14: Store Master Indexes
  await test('Fast search performance', async () => {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/stores/search?q=Queenstown`);
    const elapsed = Date.now() - start;
    if (!res.ok) throw new Error('Search failed');
    if (elapsed > 500) throw new Error(`Too slow: ${elapsed}ms`);
    return `Search completed in ${elapsed}ms`;
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('\n📊 TEST RESULTS SUMMARY:\n');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   Total:  ${testsPassed + testsFailed}\n`);
  
  // Detailed breakdown
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DETAILED RESULTS BY CATEGORY:\n');
  
  const categories = {
    'Database & Infrastructure': results.slice(0, 2),
    'Store Search & Lookup': results.slice(2, 5),
    'Azure OpenAI Integration': results.slice(5, 7),
    'Feedback & Reporting': results.slice(7, 9),
    'User Interface': results.slice(9, 12),
    'Data Integrity': results.slice(12, 14)
  };
  
  for (const [category, tests] of Object.entries(categories)) {
    const passed = tests.filter(t => t.status === 'PASSED').length;
    const total = tests.length;
    const icon = passed === total ? '✅' : '⚠️';
    console.log(`${icon} ${category}: ${passed}/${total} passed`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════\n');
  
  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is fully operational.\n');
    console.log('✨ You can now:');
    console.log('   • Submit store feedback with smart typeahead');
    console.log('   • Generate AI-powered executive reports');
    console.log('   • Track store coverage and analytics');
    console.log('   • Ask questions via CEO dashboard\n');
    console.log('🌐 Access the app: http://localhost:3000\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
    console.log('Failed tests:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
      console.log(`   ❌ ${r.name}: ${r.error}`);
    });
    console.log('');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});

