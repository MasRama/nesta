/**
 * Migration script to create user accounts for existing teachers
 * This script will create corresponding user records for teachers who don't have them yet
 */

import DB from "../app/services/DB";
import Authenticate from "../app/services/Authenticate";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

interface ExistingTeacher {
    id: string;
    nip: string;
    nama: string;
    email: string;
    password: string;
    phone?: string;
    user_id?: string;
    is_active: boolean;
}

class TeacherMigration {
    /**
     * Migrate existing teachers to have user accounts
     */
    async migrateExistingTeachers() {
        console.log('🚀 Starting migration of existing teachers...');
        
        try {
            // Get all active teachers who don't have user_id set
            const teachersWithoutUsers = await DB.from('teachers')
                .where('is_active', true)
                .whereNull('user_id');

            console.log(`📊 Found ${teachersWithoutUsers.length} teachers without user accounts`);

            if (teachersWithoutUsers.length === 0) {
                console.log('✅ All teachers already have user accounts');
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (const teacher of teachersWithoutUsers) {
                try {
                    await this.createUserForTeacher(teacher);
                    successCount++;
                    console.log(`✅ Created user account for teacher: ${teacher.nama} (${teacher.email})`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Failed to create user for teacher ${teacher.nama}: ${error.message}`);
                }
            }

            console.log('\n📈 Migration Summary:');
            console.log(`✅ Successfully migrated: ${successCount} teachers`);
            console.log(`❌ Failed migrations: ${errorCount} teachers`);
            console.log(`📊 Total processed: ${teachersWithoutUsers.length} teachers`);

        } catch (error) {
            console.error('💥 Migration failed:', error);
            throw error;
        }
    }

    /**
     * Create user account for a specific teacher
     */
    private async createUserForTeacher(teacher: ExistingTeacher) {
        return await DB.transaction(async (trx) => {
            // Check if user with this email already exists
            const existingUser = await trx.from('users')
                .where('email', teacher.email)
                .first();

            if (existingUser) {
                // If user exists, just link them
                if (existingUser.role === 'teacher') {
                    await trx.from('teachers')
                        .where('id', teacher.id)
                        .update({
                            user_id: existingUser.id,
                            updated_at: Date.now()
                        });
                    
                    // Update user's teacher_id if not set
                    if (!existingUser.teacher_id) {
                        await trx.from('users')
                            .where('id', existingUser.id)
                            .update({
                                teacher_id: teacher.id,
                                updated_at: dayjs().valueOf()
                            });
                    }
                    
                    console.log(`🔗 Linked existing user to teacher: ${teacher.nama}`);
                    return;
                } else {
                    throw new Error(`Email ${teacher.email} sudah digunakan oleh user dengan role ${existingUser.role}`);
                }
            }

            // Create new user account
            const userId = randomUUID();
            
            // Use the same password but hash it for user table
            // We'll use a default password that teachers can change later
            const defaultPassword = 'guru123'; // Teachers should change this on first login
            const hashedPasswordForUser = await Authenticate.hash(defaultPassword);

            const userData = {
                id: userId,
                name: teacher.nama,
                email: teacher.email,
                phone: teacher.phone || null,
                password: hashedPasswordForUser,
                role: 'teacher',
                teacher_id: teacher.id,
                is_verified: true,
                is_admin: false,
                created_at: dayjs().valueOf(),
                updated_at: dayjs().valueOf()
            };

            // Insert new user
            await trx.from('users').insert(userData);

            // Update teacher with user_id
            await trx.from('teachers')
                .where('id', teacher.id)
                .update({
                    user_id: userId,
                    updated_at: Date.now()
                });

            console.log(`👤 Created new user account for teacher: ${teacher.nama} (default password: guru123)`);
        });
    }

    /**
     * Rollback migration - remove user accounts created for teachers
     */
    async rollbackMigration() {
        console.log('🔄 Rolling back teacher migration...');
        
        try {
            // Get all teachers with user_id set
            const teachersWithUsers = await DB.from('teachers')
                .whereNotNull('user_id');

            console.log(`📊 Found ${teachersWithUsers.length} teachers with user accounts`);

            for (const teacher of teachersWithUsers) {
                await DB.transaction(async (trx) => {
                    // Remove user account if it was created for this teacher
                    const user = await trx.from('users')
                        .where('id', teacher.user_id)
                        .where('role', 'teacher')
                        .where('teacher_id', teacher.id)
                        .first();

                    if (user) {
                        await trx.from('users').where('id', user.id).delete();
                        console.log(`🗑️ Deleted user account for teacher: ${teacher.nama}`);
                    }

                    // Clear user_id from teacher
                    await trx.from('teachers')
                        .where('id', teacher.id)
                        .update({
                            user_id: null,
                            updated_at: Date.now()
                        });
                });
            }

            console.log('✅ Rollback completed successfully');

        } catch (error) {
            console.error('💥 Rollback failed:', error);
            throw error;
        }
    }
}

// Export for use in other scripts
export default new TeacherMigration();

// If run directly
if (require.main === module) {
    const migration = new TeacherMigration();
    
    const command = process.argv[2];
    
    if (command === 'rollback') {
        migration.rollbackMigration()
            .then(() => {
                console.log('🎉 Rollback completed');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Rollback failed:', error);
                process.exit(1);
            });
    } else {
        migration.migrateExistingTeachers()
            .then(() => {
                console.log('🎉 Migration completed');
                process.exit(0);
            })
            .catch((error) => {
                console.error('💥 Migration failed:', error);
                process.exit(1);
            });
    }
}
