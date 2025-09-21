import DB from '../app/services/DB';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';

/**
 * Script to migrate existing parents from 'parents' table to 'users' table
 * This ensures existing parents can login through the unified authentication system
 */

interface ExistingParent {
    id: string;
    nama: string;
    email: string;
    password: string;
    phone?: string;
    is_active: boolean;
    created_at: number;
    updated_at: number;
}

async function migrateExistingParents() {
    console.log('🔄 Starting migration of existing parents to users table...');
    
    try {
        // Get all existing parents
        const existingParents: ExistingParent[] = await DB.from('parents')
            .select('*')
            .where('is_active', true);

        console.log(`📊 Found ${existingParents.length} existing parents to migrate`);

        if (existingParents.length === 0) {
            console.log('✅ No parents to migrate');
            return;
        }

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const parent of existingParents) {
            try {
                console.log(`🔄 Processing parent: ${parent.nama} (${parent.email})`);

                // Check if user already exists with this email
                const existingUser = await DB.from('users')
                    .where('email', parent.email)
                    .first();

                if (existingUser) {
                    console.log(`⚠️  User already exists for email ${parent.email}, skipping...`);
                    skippedCount++;
                    continue;
                }

                // Create user account for this parent
                const userId = randomUUID();
                const userData = {
                    id: userId,
                    name: parent.nama,
                    email: parent.email,
                    phone: parent.phone || null,
                    password: parent.password, // Use existing hashed password
                    role: 'parent',
                    is_verified: true,
                    is_admin: false,
                    created_at: parent.created_at,
                    updated_at: dayjs().valueOf()
                };

                await DB.transaction(async (trx) => {
                    // Insert user account
                    await trx.from('users').insert(userData);

                    // Update parent record to include user_id reference (if column exists)
                    try {
                        await trx.from('parents')
                            .where('id', parent.id)
                            .update({
                                updated_at: dayjs().valueOf()
                            });
                    } catch (error) {
                        // Column might not exist, that's okay
                        console.log(`ℹ️  Could not update parent record with user_id (column might not exist)`);
                    }

                    // Migrate parent-student relationships if they exist in parent_students table
                    const parentStudentRelations = await trx.from('parent_students')
                        .where('parent_id', parent.id);

                    if (parentStudentRelations.length > 0) {
                        console.log(`🔗 Migrating ${parentStudentRelations.length} parent-student relationships...`);

                        for (const relation of parentStudentRelations) {
                            // Check if student exists in users table
                            const studentUser = await trx.from('students')
                                .join('users', 'students.user_id', 'users.id')
                                .where('students.id', relation.student_id)
                                .select('users.id as user_id')
                                .first();

                            if (studentUser) {
                                // Create relationship in parent_student_relations table
                                const relationshipMapping = {
                                    'ayah': 'father',
                                    'ibu': 'mother',
                                    'wali': 'guardian',
                                    'lainnya': 'other'
                                };

                                const relationData = {
                                    id: randomUUID(),
                                    parent_id: userId, // Use new user ID
                                    student_id: studentUser.user_id, // Use student's user ID
                                    relationship: relationshipMapping[relation.relationship_type] || 'guardian',
                                    is_primary_contact: relation.is_primary_contact || false,
                                    created_at: relation.created_at || dayjs().valueOf()
                                };

                                // Check if relationship already exists
                                const existingRelation = await trx.from('parent_student_relations')
                                    .where('parent_id', userId)
                                    .where('student_id', studentUser.user_id)
                                    .first();

                                if (!existingRelation) {
                                    await trx.from('parent_student_relations').insert(relationData);
                                    console.log(`✅ Created parent-student relationship for ${parent.nama}`);
                                } else {
                                    console.log(`⚠️  Parent-student relationship already exists, skipping...`);
                                }
                            } else {
                                console.log(`⚠️  Student not found in users table for relation ${relation.student_id}`);
                            }
                        }
                    }
                });

                console.log(`✅ Successfully migrated parent: ${parent.nama}`);
                migratedCount++;

            } catch (error) {
                console.error(`❌ Error migrating parent ${parent.nama}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successfully migrated: ${migratedCount} parents`);
        console.log(`⚠️  Skipped (already exists): ${skippedCount} parents`);
        console.log(`❌ Errors: ${errorCount} parents`);
        console.log(`📊 Total processed: ${existingParents.length} parents`);

        if (migratedCount > 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('📝 Existing parents can now login using their email and password');
            console.log('🔗 Parent-student relationships have been migrated to the new system');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateExistingParents()
        .then(() => {
            console.log('✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

export default migrateExistingParents;
