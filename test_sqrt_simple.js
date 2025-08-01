import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function testAnsFeature() {
  console.log('🧪 Testing "ans" Feature with Headless Browser');
  
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

    // Test "ans" functionality
    console.log('\n🧮 Testing "ans" functionality...');
    
    const testSequence = [
      { 
        input: 'sqrt(3) + sqrt(2)', 
        description: 'First calculation to establish ans',
        expectToggle: true
      },
      { 
        input: 'ans', 
        description: 'Using ans directly',
        expectToggle: true
      },
      { 
        input: 'ans^2', 
        description: 'Using ans in expression',
        expectToggle: true
      },
      { 
        input: '+5', 
        description: 'Auto-prepend ans for operator-first input',
        expectToggle: false
      },
      { 
        input: '*2', 
        description: 'Auto-prepend ans for multiplication',
        expectToggle: false
      },
      { 
        input: '/3', 
        description: 'Auto-prepend ans for division',
        expectToggle: false
      },
      { 
        input: '^2', 
        description: 'Auto-prepend ans for power',
        expectToggle: false
      }
    ];
    
    for (let i = 0; i < testSequence.length; i++) {
      const testCase = testSequence[i];
      console.log(`\n📝 Step ${i + 1}: ${testCase.description}`);
      console.log(`📋 Input: "${testCase.input}"`);
      
      await page.fill('input[type="text"]', '');
      await page.fill('input[type="text"]', testCase.input);
      await page.press('input[type="text"]', 'Enter');
      await page.waitForTimeout(1000);
      
      // Get decimal result
      const resultElement = await page.locator('[class*="text-3xl"]').first();
      const decimalResult = await resultElement.textContent();
      console.log(`📊 Decimal result: "${decimalResult}"`);
      
      // Check if there's a toggle button and try radical mode
      const toggleButton = await page.locator('button[title*="Toggle"]').first();
      const hasToggle = await toggleButton.count() > 0;
      
      if (hasToggle) {
        await toggleButton.click();
        await page.waitForTimeout(500);
        const radicalResult = await resultElement.textContent();
        console.log(`📊 Radical result: "${radicalResult}"`);
        
        // Toggle back for next test
        await toggleButton.click();
        await page.waitForTimeout(500);
      } else {
        console.log(`📊 No radical form available`);
      }
    }
    
    // Test edge cases
    console.log('\n🔍 Testing edge cases...');
    
    const edgeCases = [
      { input: '-5', description: 'Unary minus (should NOT prepend ans)' },
      { input: '(-5)', description: 'Parenthesized negative (should NOT prepend ans)' },
      { input: 'sqrt(ans)', description: 'ans inside function' },
    ];
    
    for (const testCase of edgeCases) {
      console.log(`\n📝 Edge case: ${testCase.description}`);
      console.log(`📋 Input: "${testCase.input}"`);
      
      await page.fill('input[type="text"]', '');
      await page.fill('input[type="text"]', testCase.input);
      await page.press('input[type="text"]', 'Enter');
      await page.waitForTimeout(1000);
      
      const resultElement = await page.locator('[class*="text-3xl"]').first();
      const decimalResult = await resultElement.textContent();
      console.log(`📊 Result: "${decimalResult}"`);
    }
    
    // Clean up
    devServer.kill('SIGTERM');
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAnsFeature().catch(console.error);
