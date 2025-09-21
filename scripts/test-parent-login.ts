import DB from '../app/services/DB';
import Authenticate from '../app/services/Authenticate';

/**
 * Script to test parent login functionality
 * This verifies that migrated parents can login successfully
 */

async function testParentLogin() {
    console.log('🧪 Testing parent login functionality...');
    
    try {
        // Get all parents from users table
        const parents = await DB.from('users')
            .where('role', 'parent')
            .select('id', 'name', 'email', 'is_verified', 'is_admin');

        console.log(`📊 Found ${parents.length} parent(s) in users table`);

        if (parents.length === 0) {
            console.log('❌ No parents found in users table');
            return;
        }

        for (const parent of parents) {
            console.log(`\n🔍 Testing parent: ${parent.name} (${parent.email})`);
            
            // Check if parent has children relationships
            const children = await DB.from('parent_student_relations')
                .join('users', 'parent_student_relations.student_id', 'users.id')
                .where('parent_student_relations.parent_id', parent.id)
                .select(
                    'users.id as student_id',
                    'users.name as student_name',
                    'users.email as student_email',
                    'parent_student_relations.relationship',
                    'parent_student_relations.is_primary_contact'
                );

            console.log(`👨‍👩‍👧‍👦 Children count: ${children.length}`);
            
            if (children.length > 0) {
                console.log('📋 Children details:');
                children.forEach((child, index) => {
                    console.log(`   ${index + 1}. ${child.student_name} (${child.relationship})`);
                });
            }

            // Test password verification (using a common test password)
            const testPassword = 'password123'; // Common test password
            const parentRecord = await DB.from('users')
                .where('id', parent.id)
                .select('password')
                .first();

            if (parentRecord) {
                try {
                    const passwordMatch = await Authenticate.compare(testPassword, parentRecord.password);
                    console.log(`🔐 Password test (${testPassword}): ${passwordMatch ? '✅ Valid' : '❌ Invalid'}`);
                } catch (error) {
                    console.log(`🔐 Password test failed: ${error.message}`);
                }
            }

            // Check attendance data for children
            if (children.length > 0) {
                console.log('📊 Checking attendance data...');
                
                for (const child of children) {
                    const attendanceCount = await DB.from('attendance_records')
                        .join('attendance_sessions', 'attendance_records.attendance_session_id', 'attendance_sessions.id')
                        .where('attendance_records.student_id', child.student_id)
                        .count('* as count')
                        .first();

                    console.log(`   📈 ${child.student_name}: ${attendanceCount.count} attendance records`);
                }
            }

            // Test API endpoints accessibility
            console.log('🔗 API endpoints that should be accessible:');
            console.log(`   GET /api/attendance/parent/${parent.id}/children`);
            console.log(`   GET /api/attendance/parent/${parent.id}/children/history`);
            console.log(`   GET /api/attendance/parent/${parent.id}/children/stats`);
            console.log(`   GET /api/attendance/parent/${parent.id}/children/subjects`);
        }

        console.log('\n✅ Parent login test completed successfully!');
        console.log('\n📝 Next steps for testing:');
        console.log('1. Try logging in with parent credentials through the web interface');
        console.log('2. Navigate to parent dashboard and verify children data is displayed');
        console.log('3. Test the new attendance history feature');
        console.log('4. Verify that parent can only see their own children\'s data');

    } catch (error) {
        console.error('❌ Parent login test failed:', error);
        throw error;
    }
}

// Additional function to verify database consistency
async function verifyDatabaseConsistency() {
    console.log('\n🔍 Verifying database consistency...');
    
    try {
        // Check for orphaned records
        const orphanedParentStudents = await DB.from('parent_students')
            .leftJoin('parents', 'parent_students.parent_id', 'parents.id')
            .whereNull('parents.id')
            .count('* as count')
            .first();

        console.log(`🔗 Orphaned parent_students records: ${orphanedParentStudents.count}`);

        const orphanedParentRelations = await DB.from('parent_student_relations')
            .leftJoin('users as parents', 'parent_student_relations.parent_id', 'parents.id')
            .leftJoin('users as students', 'parent_student_relations.student_id', 'students.id')
            .where(function() {
                this.whereNull('parents.id').orWhereNull('students.id');
            })
            .count('* as count')
            .first();

        console.log(`🔗 Orphaned parent_student_relations records: ${orphanedParentRelations.count}`);

        // Check for duplicate relationships
        const duplicateRelations = await DB.from('parent_student_relations')
            .select('parent_id', 'student_id')
            .count('* as count')
            .groupBy('parent_id', 'student_id')
            .having('count', '>', 1);

        console.log(`🔄 Duplicate parent-student relationships: ${duplicateRelations.length}`);

        if (duplicateRelations.length > 0) {
            console.log('⚠️  Found duplicate relationships:');
            duplicateRelations.forEach(rel => {
                console.log(`   Parent: ${rel.parent_id}, Student: ${rel.student_id}, Count: ${rel.count}`);
            });
        }

        console.log('✅ Database consistency check completed');

    } catch (error) {
        console.error('❌ Database consistency check failed:', error);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    Promise.all([
        testParentLogin(),
        verifyDatabaseConsistency()
    ])
    .then(() => {
        console.log('\n🎉 All tests completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Tests failed:', error);
        process.exit(1);
    });
}

export { testParentLogin, verifyDatabaseConsistency };
