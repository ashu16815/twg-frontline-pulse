#!/usr/bin/env node

/**
 * End-to-End Testing Script for Win In Store
 * Tests all major functionality after database setup
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

console.log('🧪 Win In Store - End-to-End Testing\n');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Testing against: ${BASE_URL}\n`);

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  process.stdout.write(`🔄 ${name}... `);
  try {
    await fn();
    console.log('✅ PASSED');
    testsPassed++;
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
    return false;
  }
}

async function main() {
  console.log('Testing API Endpoints:\n');
  
  // Test 1: Health Check - Database
  await test('Database health check', async () => {
    const res = await fetch(`${BASE_URL}/api/health/db`);
    const data = await res.json();
    if (!data.ok) throw new Error('Database not healthy');
  });
  
  // Test 2: Get Stores
  await test('GET /api/stores', async () => {
    const res = await fetch(`${BASE_URL}/api/stores`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No stores returned');
    console.log(`      → ${data.length} stores found`);
  });
  
  // Test 3: Reports Page
  await test('GET /reports (with data)', async () => {
    const res = await fetch(`${BASE_URL}/reports`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    if (!html.includes('Win In Store')) throw new Error('Invalid page content');
  });
  
  // Test 4: Frontline Submit Page
  await test('GET /frontline/submit', async () => {
    const res = await fetch(`${BASE_URL}/frontline/submit`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    // Page may be behind passcode gate, so check for either content or passcode prompt
    if (!html.includes('Frontline') && !html.includes('passcode')) {
      throw new Error('Invalid page content');
    }
  });
  
  // Test 5: Weekly Submit Page
  await test('GET /weekly/submit', async () => {
    const res = await fetch(`${BASE_URL}/weekly/submit`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  
  // Test 6: Generate Report
  await test('POST /api/reports/generate', async () => {
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
    if (!data.report) throw new Error('No report returned');
    console.log(`      → Report generated with ${data.report.highlights?.length || 0} highlights`);
  });
  
  console.log('\n───────────────────────────────────────────────────────────\n');
  
  // Test 7: Coverage API
  await test('GET /api/coverage', async () => {
    const res = await fetch(`${BASE_URL}/api/coverage`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Coverage check failed');
    console.log(`      → ${data.responded}/${data.total} stores responded (${data.coveragePct}%)`);
  });
  
  console.log('\n───────────────────────────────────────────────────────────\n');
  console.log('Testing Page Renders:\n');
  
  // Test 8: Home Page
  await test('Home page renders', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    if (!html.includes('Win In Store')) throw new Error('Missing branding');
    if (!html.includes('Frontline Feedback')) throw new Error('Missing content');
  });
  
  // Test 9: CEO Page
  await test('CEO page renders', async () => {
    const res = await fetch(`${BASE_URL}/ceo`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n📊 Test Results:\n');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   Total:  ${testsPassed + testsFailed}\n`);
  
  if (testsFailed === 0) {
    console.log('🎉 All tests PASSED! System is fully operational.\n');
    console.log('✨ You can now:');
    console.log('   • Visit http://localhost:3000');
    console.log('   • Submit store feedback');
    console.log('   • Generate executive reports');
    console.log('   • View analytics and coverage\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});

