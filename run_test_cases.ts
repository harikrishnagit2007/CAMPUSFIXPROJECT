import { analyzeCampusImage } from './test_vision_cases';

// Helper to create simple valid PNG base64 buffers
// 1. Exam Screenshot Simulation (encoded image containing text 'Online Final Exam - CS301')
// Let's create simple PNG with text or simple valid PNGs

async function runTests() {
  console.log('--- Starting Multimodal Vision Tests ---');

  // Test Case 1: Plain Green Square (not maintenance)
  const plainGreen = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  try {
    const res1 = await analyzeCampusImage(plainGreen, 'image/png');
    console.log('\n[Test 1: Plain Color Image]');
    console.log('isMaintenanceIssue:', res1.isMaintenanceIssue);
    console.log('detectedIssue:', res1.detectedIssue);
    console.log('category:', res1.category);
    console.log('reason:', res1.reason);
  } catch (err: any) {
    console.error('Test 1 failed:', err.message);
  }
}

runTests();
