import DB from '../app/services/DB';
import Authenticate from '../app/services/Authenticate';
import { pbkdf2Sync } from 'crypto';

/**
 * Script to fix parent passwords that were hashed with the old method
 * This converts passwords from ParentService's old hashing to Authenticate's proper hashing
 */

interface ParentRecord {
    id: string;
    nama: string;
    email: string;
    password: string;
}

async function fixParentPasswords() {
    console.log('🔧 Fixing parent passwords...');
    
    try {
        // Get all parents from parents table
        const parentsInParentsTable: ParentRecord[] = await DB.from('parents')
            .select('id', 'nama', 'email', 'password')
            .where('is_active', true);

        console.log(`📊 Found ${parentsInParentsTable.length} parent(s) in parents table`);

        if (parentsInParentsTable.length === 0) {
            console.log('✅ No parents to fix');
            return;
        }

        let fixedCount = 0;
        let errorCount = 0;

        for (const parent of parentsInParentsTable) {
            try {
                console.log(`🔄 Processing parent: ${parent.nama} (${parent.email})`);

                // Find corresponding user in users table
                const userRecord = await DB.from('users')
                    .where('email', parent.email)
                    .where('role', 'parent')
                    .first();

                if (!userRecord) {
                    console.log(`⚠️  No corresponding user found for ${parent.email}`);
                    continue;
                }

                // Check if password is already in new format (contains ':')
                if (userRecord.password.includes(':')) {
                    console.log(`✅ Password already in correct format for ${parent.email}`);
                    continue;
                }

                // The password in users table might be the old format
                // We need to set a default password or ask admin to reset
                console.log(`🔐 Setting default password for ${parent.email}`);

                // Set default password as 'parent123' - admin should change this
                const defaultPassword = 'parent123';
                const newHashedPassword = await Authenticate.hash(defaultPassword);

                await DB.transaction(async (trx) => {
                    // Update password in users table
                    await trx.from('users')
                        .where('id', userRecord.id)
                        .update({
                            password: newHashedPassword,
                            updated_at: Date.now()
                        });

                    // Update password in parents table too for consistency
                    await trx.from('parents')
                        .where('id', parent.id)
                        .update({
                            password: newHashedPassword,
                            updated_at: Date.now()
                        });
                });

                console.log(`✅ Fixed password for ${parent.nama} - default password: ${defaultPassword}`);
                fixedCount++;

            } catch (error) {
                console.error(`❌ Error fixing password for ${parent.nama}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📊 Password Fix Summary:');
        console.log(`✅ Successfully fixed: ${fixedCount} passwords`);
        console.log(`❌ Errors: ${errorCount} passwords`);

        if (fixedCount > 0) {
            console.log('\n🔑 Default Password Information:');
            console.log('📝 All parent passwords have been set to: parent123');
            console.log('⚠️  IMPORTANT: Ask parents to change their passwords after first login!');
            console.log('🔒 Parents can change passwords through the dashboard or admin can reset them');
        }

    } catch (error) {
        console.error('❌ Password fix failed:', error);
        throw error;
    }
}

// Function to test login with new passwords
async function testFixedPasswords() {
    console.log('\n🧪 Testing fixed passwords...');
    
    try {
        const parents = await DB.from('users')
            .where('role', 'parent')
            .select('id', 'name', 'email', 'password');

        const testPassword = 'parent123';

        for (const parent of parents) {
            try {
                const passwordMatch = await Authenticate.compare(testPassword, parent.password);
                console.log(`🔐 ${parent.name} (${parent.email}): ${passwordMatch ? '✅ Login OK' : '❌ Login Failed'}`);
            } catch (error) {
                console.log(`🔐 ${parent.name} (${parent.email}): ❌ Test Error - ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Password test failed:', error);
    }
}

// Function to create password reset instructions
async function createPasswordResetInstructions() {
    console.log('\n📋 Creating password reset instructions...');
    
    try {
        const parents = await DB.from('users')
            .where('role', 'parent')
            .select('id', 'name', 'email');

        console.log('\n📧 Parent Login Credentials:');
        console.log('=' .repeat(60));
        
        for (const parent of parents) {
            console.log(`👤 Name: ${parent.name}`);
            console.log(`📧 Email: ${parent.email}`);
            console.log(`🔑 Temporary Password: parent123`);
            console.log(`🌐 Login URL: http://localhost:3000/login`);
            console.log('-'.repeat(40));
        }

        console.log('\n📝 Instructions for Parents:');
        console.log('1. Go to the school website login page');
        console.log('2. Enter your email and temporary password: parent123');
        console.log('3. After login, go to profile settings to change your password');
        console.log('4. Choose a strong password for security');

        console.log('\n📝 Instructions for Admin:');
        console.log('1. Share login credentials with parents securely');
        console.log('2. Instruct parents to change passwords immediately');
        console.log('3. Monitor login attempts and assist with password resets if needed');

    } catch (error) {
        console.error('❌ Failed to create instructions:', error);
    }
}

// Run fix if this script is executed directly
if (require.main === module) {
    Promise.resolve()
        .then(() => fixParentPasswords())
        .then(() => testFixedPasswords())
        .then(() => createPasswordResetInstructions())
        .then(() => {
            console.log('\n🎉 Password fix completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Password fix failed:', error);
            process.exit(1);
        });
}

export default fixParentPasswords;
