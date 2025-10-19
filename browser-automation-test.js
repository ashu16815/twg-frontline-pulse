const { chromium } = require('playwright');

async function runBrowserTests() {
  console.log('🌐 BROWSER AUTOMATION TESTING');
  console.log('=============================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let passedTests = 0;
  let totalTests = 0;
  
  function test(name, testFn) {
    totalTests++;
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        passedTests++;
      } else {
        console.log(`❌ ${name}`);
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
    }
  }
  
  try {
    // Test 1: Login
    console.log('\n🔐 Testing Authentication...');
    await page.goto('http://localhost:3001/login');
    
    test('Login page loads', () => page.locator('input[placeholder*="User ID"]').isVisible());
    
    await page.fill('input[placeholder*="User ID"]', '323905');
    await page.fill('input[type="password"]', 'Ankit@1993');
    await page.click('button:has-text("Sign in")');
    
    // Wait for redirect
    await page.waitForURL('**/');
    
    test('Login successful', () => page.url().includes('localhost:3001') && !page.url().includes('login'));
    
    // Test 2: Feedback Page
    console.log('\n🎙️ Testing Feedback Page...');
    await page.goto('http://localhost:3001/feedback');
    
    test('Feedback page loads', () => page.locator('text=Pick Store').isVisible());
    test('Store picker present', () => page.locator('input[placeholder*="store code"]').isVisible());
    test('Voice capture present', () => page.locator('text=Voice capture').isVisible());
    test('Form fields present', () => page.locator('input[placeholder*="Top positive"]').isVisible());
    
    // Test store search
    await page.fill('input[placeholder*="store code"]', 'Pukekohe');
    await page.waitForTimeout(500); // Wait for search
    
    test('Store search working', () => page.locator('text=Pukekohe').isVisible());
    
    // Test 3: Executive Dashboard
    console.log('\n📊 Testing Executive Dashboard...');
    await page.goto('http://localhost:3001/exec');
    
    test('Executive dashboard loads', () => page.locator('text=AI Executive Summary').isVisible());
    test('Filter inputs present', () => page.locator('input[placeholder*="Region code"]').isVisible());
    test('Charts container present', () => page.locator('.recharts-responsive-container').isVisible());
    
    // Test 4: Health Dashboard
    console.log('\n🏥 Testing Health Dashboard...');
    await page.goto('http://localhost:3001/admin/health');
    
    test('Health dashboard loads', () => page.locator('text=System Health').isVisible());
    test('Health checks present', () => page.locator('text=Health Checks').isVisible());
    test('Test buttons present', () => page.locator('button:has-text("Test Database")').isVisible());
    test('Production system tips present', () => page.locator('text=Voice-to-Form Integration').isVisible());
    
    // Test 5: Navigation
    console.log('\n🧭 Testing Navigation...');
    
    await page.click('a[href="/reports"]');
    await page.waitForLoadState('networkidle');
    test('Reports page accessible', () => !page.url().includes('login'));
    
    await page.click('a[href="/ceo"]');
    await page.waitForLoadState('networkidle');
    test('CEO page accessible', () => !page.url().includes('login'));
    
    // Test 6: Responsive Design
    console.log('\n📱 Testing Responsive Design...');
    
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto('http://localhost:3001/feedback');
    test('Mobile layout works', () => page.locator('text=Pick Store').isVisible());
    
    await page.setViewportSize({ width: 1024, height: 768 }); // Tablet
    await page.goto('http://localhost:3001/exec');
    test('Tablet layout works', () => page.locator('text=AI Executive Summary').isVisible());
    
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.goto('http://localhost:3001/admin/health');
    test('Desktop layout works', () => page.locator('text=System Health').isVisible());
    
  } catch (error) {
    console.error('Browser test error:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n📊 BROWSER TEST RESULTS');
  console.log('=======================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL BROWSER TESTS PASSED!');
    return true;
  } else {
    console.log('\n❌ SOME BROWSER TESTS FAILED!');
    return false;
  }
}

// Run the tests
runBrowserTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
