import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function testCalculatorImprovements() {
  console.log('🧪 Testing Calculator UI Improvements');
  
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

    // Test 1: Check if "ans" button exists
    console.log('\n🔍 Test 1: Checking for "ans" button...');
    const ansButton = await page.locator('button:has-text("ans")').first();
    const hasAnsButton = await ansButton.count() > 0;
    console.log(`📊 "ans" button found: ${hasAnsButton ? '✅ YES' : '❌ NO'}`);

    // Test 2: Input clearing after equals
    console.log('\n🔍 Test 2: Testing input clearing after equals...');
    
    // Enter a calculation
    await page.fill('input[type="text"]', 'sqrt(3) + sqrt(2)');
    console.log('📝 Entered: sqrt(3) + sqrt(2)');
    
    // Press equals
    await page.press('input[type="text"]', 'Enter');
    await page.waitForTimeout(1000);
    
    // Check if input is cleared
    const inputValue = await page.inputValue('input[type="text"]');
    console.log(`📊 Input after equals: "${inputValue}" ${inputValue === '' ? '✅ CLEARED' : '❌ NOT CLEARED'}`);

    // Test 3: "ans" button functionality
    console.log('\n🔍 Test 3: Testing "ans" button click...');
    if (hasAnsButton) {
      await ansButton.click();
      await page.waitForTimeout(500);
      
      const inputAfterAns = await page.inputValue('input[type="text"]');
      console.log(`📊 Input after "ans" button: "${inputAfterAns}" ${inputAfterAns === 'ans' ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      // Clear input for next test
      await page.fill('input[type="text"]', '');
    }

    // Test 4: Auto-prefix with operator buttons
    console.log('\n🔍 Test 4: Testing auto-prefix with operator buttons...');
    
    const operatorTests = [
      { button: '+', expected: 'ans+' },
      { button: '*', expected: 'ans*' },
      { button: '/', expected: 'ans/' },
      { button: '^', expected: 'ans^' }
    ];
    
    for (const test of operatorTests) {
      // Clear input
      await page.fill('input[type="text"]', '');
      
      // Click operator button
      const operatorButton = await page.locator(`button:has-text("${test.button}")`).first();
      await operatorButton.click();
      await page.waitForTimeout(500);
      
      const result = await page.inputValue('input[type="text"]');
      console.log(`📊 "${test.button}" button: "${result}" ${result === test.expected ? '✅ CORRECT' : '❌ INCORRECT'}`);
    }

    // Test 5: Typing operators into empty input
    console.log('\n🔍 Test 5: Testing typing operators into empty input...');
    
    // Clear input
    await page.fill('input[type="text"]', '');
    
    // Type a plus sign
    await page.type('input[type="text"]', '+');
    await page.waitForTimeout(500);
    
    const typedResult = await page.inputValue('input[type="text"]');
    console.log(`📊 Typed "+": "${typedResult}" ${typedResult === 'ans+' ? '✅ AUTO-PREFIXED' : '❌ NOT PREFIXED'}`);

    // Test 6: Full workflow test
    console.log('\n🔍 Test 6: Testing full workflow...');
    
    // Clear and start fresh
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="text"]', '5');
    await page.press('input[type="text"]', 'Enter');
    await page.waitForTimeout(1000);
    
    console.log('📝 Step 1: Calculated 5');
    
    // Click + button (should auto-prefix with ans)
    const plusButton = await page.locator('button:has-text("+")').first();
    await plusButton.click();
    await page.waitForTimeout(500);
    
    const afterPlus = await page.inputValue('input[type="text"]');
    console.log(`📊 After + button: "${afterPlus}"`);
    
    // Add 3
    await page.type('input[type="text"]', '3');
    await page.press('input[type="text"]', 'Enter');
    await page.waitForTimeout(1000);
    
    const finalResult = await page.locator('[class*="text-3xl"]').first().textContent();
    console.log(`📊 Final result: "${finalResult}" ${finalResult === '8' ? '✅ CORRECT (5+3=8)' : '❌ INCORRECT'}`);

    // Clean up
    devServer.kill('SIGTERM');
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCalculatorImprovements().catch(console.error);
