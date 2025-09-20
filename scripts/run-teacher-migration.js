/**
 * Simple script to run teacher migration
 * This can be executed with: node scripts/run-teacher-migration.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Teacher Migration Script...');
console.log('=====================================');

try {
    // Change to project root directory
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);
    
    console.log('📁 Working directory:', process.cwd());
    
    // Compile TypeScript first
    console.log('🔨 Compiling TypeScript...');
    execSync('npx tsc scripts/migrate-existing-teachers.ts --outDir build/scripts --moduleResolution node --esModuleInterop --target es2020', { stdio: 'inherit' });
    
    // Run the migration
    console.log('🏃 Running migration...');
    execSync('node build/scripts/migrate-existing-teachers.js', { stdio: 'inherit' });
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Test login with existing teacher credentials');
    console.log('2. Teachers with default password "guru123" should change their password');
    console.log('3. Verify that new teachers created through admin can login immediately');
    
} catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure you are in the project root directory');
    console.log('2. Ensure database connection is working');
    console.log('3. Check that TypeScript is installed (npm install -g typescript)');
    process.exit(1);
}
