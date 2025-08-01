import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function testRadicalArithmetic() {
  console.log('🧪 Testing Radical Arithmetic with Headless Browser');
  
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

    // Test radical arithmetic cases
    console.log('\n🧮 Testing radical arithmetic...');
    
    const testCases = [
      { input: 'sqrt(3) + sqrt(3)', expected: '2√3' },
      { input: 'sqrt(2) + sqrt(2)', expected: '2√2' },
      { input: 'sqrt(5) + sqrt(5) + sqrt(5)', expected: '3√5' },
      { input: '2*sqrt(3) + sqrt(3)', expected: '3√3' },
      { input: 'sqrt(8) + sqrt(2)', expected: '3√2' },
      { input: 'sqrt(12) + sqrt(3)', expected: '3√3' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testing: ${testCase.input}`);
      
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
        console.log(`📊 Radical result: "${radicalResult}" (expected: ${testCase.expected})`);
        
        // Toggle back for next test
        await toggleButton.click();
        await page.waitForTimeout(500);
      } else {
        console.log(`❌ No toggle button - only decimal result available`);
      }
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
testRadicalArithmetic().catch(console.error);
