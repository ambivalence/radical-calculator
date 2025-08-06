import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function testFractionBugs() {
  console.log('🐛 Testing Fraction Bug Fixes');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Start the dev server in the background
    const devServer = spawn('npm', ['run', 'dev'], { 
      cwd: '/Users/yushan/Development/radical-calculator',
      detached: true,
      stdio: 'pipe'
    });

    // Wait for server to start
    console.log('⏳ Starting development server...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Navigate to the app
    console.log('🌐 Navigating to http://localhost:5173');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Wait for the calculator to load
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    console.log('✅ Calculator loaded successfully');

    // Test the problematic expressions
    console.log('\n🧪 Testing problematic expressions...');
    
    const problemExpressions = [
      { input: '8/(3+6)', expected: '0.888...', description: 'Division with parentheses' },
      { input: '3/4', expected: '0.75', description: 'Simple fraction' },
      { input: '1/2 + 1/4', expected: '0.75', description: 'Fraction addition' },
      { input: '(1/2)', expected: '0.5', description: 'Parenthesized fraction' },
      { input: 'sqrt(8)/2', expected: '1.414...', description: 'Radical division' },
      { input: '8/2', expected: '4', description: 'Simple division' },
      { input: '3+6', expected: '9', description: 'Simple addition (control)' }
    ];
    
    for (const test of problemExpressions) {
      console.log(`\n📝 Testing: ${test.input} (${test.description})`);
      
      await page.fill('input[type="text"]', '');
      await page.fill('input[type="text"]', test.input);
      await page.press('input[type="text"]', 'Enter');
      await page.waitForTimeout(1000);
      
      // Check for error message
      const errorElement = await page.locator('.text-red-600').first();
      const hasError = await errorElement.count() > 0;
      
      if (hasError) {
        const errorText = await errorElement.textContent();
        console.log(`❌ ERROR: "${errorText}"`);
      } else {
        const result = await page.locator('[class*="text-3xl"]').first().textContent();
        console.log(`✅ Result: "${result}"`);
        
        // Check if there's a toggle for radical mode
        const toggleButton = await page.locator('button[title*="Toggle"]').first();
        const hasToggle = await toggleButton.count() > 0;
        
        if (hasToggle) {
          await toggleButton.click();
          await page.waitForTimeout(500);
          const radicalResult = await page.locator('[class*="text-3xl"]').first().textContent();
          console.log(`📊 Radical form: "${radicalResult}"`);
          
          // Toggle back
          await toggleButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Test fraction mode toggle
    console.log('\n🔍 Testing fraction mode toggle...');
    const fractionToggle = await page.locator('button[title*="fraction"]').first();
    const hasToggle = await fractionToggle.count() > 0;
    
    if (hasToggle) {
      await fractionToggle.click();
      await page.waitForTimeout(500);
      
      const modeText = await page.locator('text*="Coming Soon"').count();
      console.log(`📊 Fraction mode shows "Coming Soon": ${modeText > 0 ? '✅ YES' : '❌ NO'}`);
      
      // Toggle back
      await fractionToggle.click();
      await page.waitForTimeout(500);
    }

    // Test "a/b" button
    console.log('\n🔍 Testing "a/b" button...');
    const abButton = await page.locator('button:has-text("a/b")').first();
    const hasAbButton = await abButton.count() > 0;
    
    if (hasAbButton) {
      await page.fill('input[type="text"]', '');
      await abButton.click();
      await page.waitForTimeout(500);
      
      const inputValue = await page.inputValue('input[type="text"]');
      console.log(`📊 "a/b" button result: "${inputValue}"`);
    }

    // Clean up
    devServer.kill('SIGTERM');
    
    console.log('\n✅ All bug tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testFractionBugs().catch(console.error);
