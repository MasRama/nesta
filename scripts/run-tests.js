/**
 * Test runner for teacher login functionality
 * Usage: node scripts/run-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Teacher Login Test Runner');
console.log('============================\n');

try {
    // Change to project root directory
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);
    
    console.log('📁 Working directory:', process.cwd());
    
    // Compile TypeScript first
    console.log('🔨 Compiling test files...');
    execSync('npx tsc scripts/test-teacher-login.ts --outDir build/scripts --moduleResolution node --esModuleInterop --target es2020', { stdio: 'inherit' });
    
    // Run the tests
    console.log('🏃 Running tests...\n');
    execSync('node build/scripts/test-teacher-login.js', { stdio: 'inherit' });
    
} catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you are in the project root directory');
    console.log('2. Ensure database connection is working');
    console.log('3. Check that TypeScript is installed');
    console.log('4. Verify all dependencies are installed');
    process.exit(1);
}
