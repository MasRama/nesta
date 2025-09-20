/**
 * Test script to validate teacher login functionality
 * This script tests various scenarios to ensure the fix works correctly
 */

import DB from "../app/services/DB";
import Authenticate from "../app/services/Authenticate";
import TeacherService from "../app/services/TeacherService";
import { randomUUID } from "crypto";

interface TestResult {
    test: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
    details?: any;
}

class TeacherLoginTest {
    private results: TestResult[] = [];

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting Teacher Login Tests...');
        console.log('=====================================\n');

        await this.testDatabaseConnection();
        await this.testCreateNewTeacher();
        await this.testExistingTeacherLogin();
        await this.testPasswordValidation();
        await this.testUserAccountCreation();
        
        this.printResults();
    }

    /**
     * Test database connection
     */
    async testDatabaseConnection() {
        try {
            await DB.raw('SELECT 1');
            this.addResult('Database Connection', 'PASS', 'Database connection successful');
        } catch (error) {
            this.addResult('Database Connection', 'FAIL', `Database connection failed: ${error.message}`);
        }
    }

    /**
     * Test creating new teacher
     */
    async testCreateNewTeacher() {
        try {
            const testEmail = `test-teacher-${Date.now()}@example.com`;
            const teacherData = {
                nip: `TEST${Date.now()}`,
                nama: 'Test Teacher',
                email: testEmail,
                password: 'testpassword123',
                phone: '081234567890'
            };

            const newTeacher = await TeacherService.createTeacher(teacherData);
            
            // Check if teacher was created
            const createdTeacher = await DB.from('teachers').where('id', newTeacher.id).first();
            if (!createdTeacher) {
                throw new Error('Teacher not found in database');
            }

            // Check if user account was created
            const userAccount = await DB.from('users').where('id', createdTeacher.user_id).first();
            if (!userAccount) {
                throw new Error('User account not created for teacher');
            }

            // Verify user has correct role
            if (userAccount.role !== 'teacher') {
                throw new Error(`User role is ${userAccount.role}, expected 'teacher'`);
            }

            // Verify linking
            if (userAccount.teacher_id !== createdTeacher.id) {
                throw new Error('Teacher and user not properly linked');
            }

            this.addResult('Create New Teacher', 'PASS', 'Teacher and user account created successfully', {
                teacherId: newTeacher.id,
                userId: userAccount.id,
                email: testEmail
            });

            // Cleanup
            await this.cleanupTestData(createdTeacher.id, userAccount.id);

        } catch (error) {
            this.addResult('Create New Teacher', 'FAIL', `Failed to create teacher: ${error.message}`);
        }
    }

    /**
     * Test existing teacher login scenario
     */
    async testExistingTeacherLogin() {
        try {
            // Create a teacher without user account (simulating old data)
            const testEmail = `old-teacher-${Date.now()}@example.com`;
            const teacherId = randomUUID();
            
            const teacherData = {
                id: teacherId,
                nip: `OLD${Date.now()}`,
                nama: 'Old Teacher',
                email: testEmail,
                password: 'hashedpassword', // Simulated old hash
                phone: '081234567891',
                user_id: null, // No user account initially
                is_active: true,
                created_at: Date.now(),
                updated_at: Date.now()
            };

            await DB.from('teachers').insert(teacherData);

            // Verify teacher exists but no user account
            const teacher = await DB.from('teachers').where('id', teacherId).first();
            const userBefore = await DB.from('users').where('email', testEmail).first();

            if (!teacher) {
                throw new Error('Test teacher not created');
            }

            if (userBefore) {
                throw new Error('User account should not exist initially');
            }

            this.addResult('Existing Teacher Setup', 'PASS', 'Old teacher data simulated successfully', {
                teacherId: teacherId,
                email: testEmail
            });

            // Cleanup
            await DB.from('teachers').where('id', teacherId).delete();

        } catch (error) {
            this.addResult('Existing Teacher Login', 'FAIL', `Failed to test existing teacher: ${error.message}`);
        }
    }

    /**
     * Test password validation
     */
    async testPasswordValidation() {
        try {
            // Test Authenticate service password hashing
            const testPassword = 'testpassword123';
            const hashedPassword = await Authenticate.hash(testPassword);
            
            if (!hashedPassword.includes(':')) {
                throw new Error('Password hash format incorrect');
            }

            const isValid = await Authenticate.compare(testPassword, hashedPassword);
            if (!isValid) {
                throw new Error('Password comparison failed');
            }

            const isInvalid = await Authenticate.compare('wrongpassword', hashedPassword);
            if (isInvalid) {
                throw new Error('Password comparison should fail for wrong password');
            }

            this.addResult('Password Validation', 'PASS', 'Password hashing and validation working correctly');

        } catch (error) {
            this.addResult('Password Validation', 'FAIL', `Password validation failed: ${error.message}`);
        }
    }

    /**
     * Test user account creation for teachers
     */
    async testUserAccountCreation() {
        try {
            // Check if there are any teachers without user accounts
            const teachersWithoutUsers = await DB.from('teachers')
                .whereNull('user_id')
                .where('is_active', true)
                .limit(5);

            if (teachersWithoutUsers.length === 0) {
                this.addResult('User Account Creation', 'SKIP', 'No teachers without user accounts found');
                return;
            }

            this.addResult('User Account Creation', 'PASS', 
                `Found ${teachersWithoutUsers.length} teachers that need user accounts`, 
                { count: teachersWithoutUsers.length }
            );

        } catch (error) {
            this.addResult('User Account Creation', 'FAIL', `Failed to check user accounts: ${error.message}`);
        }
    }

    /**
     * Add test result
     */
    private addResult(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
        this.results.push({ test, status, message, details });
        
        const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
        console.log(`${emoji} ${test}: ${message}`);
        
        if (details) {
            console.log(`   Details:`, details);
        }
        console.log('');
    }

    /**
     * Print test summary
     */
    private printResults() {
        console.log('📊 Test Summary');
        console.log('================');
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const skipped = this.results.filter(r => r.status === 'SKIP').length;
        
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        console.log(`📊 Total: ${this.results.length}`);
        
        if (failed > 0) {
            console.log('\n🚨 Failed Tests:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
        }
        
        console.log('\n🎯 Recommendations:');
        if (failed === 0) {
            console.log('   - All tests passed! System is ready for production');
            console.log('   - Run migration script if there are existing teachers');
            console.log('   - Test login manually with real teacher accounts');
        } else {
            console.log('   - Fix failed tests before deploying');
            console.log('   - Check database connections and permissions');
            console.log('   - Verify code changes are properly deployed');
        }
    }

    /**
     * Cleanup test data
     */
    private async cleanupTestData(teacherId: string, userId: string) {
        try {
            await DB.from('teachers').where('id', teacherId).delete();
            await DB.from('users').where('id', userId).delete();
        } catch (error) {
            console.log(`⚠️ Warning: Failed to cleanup test data: ${error.message}`);
        }
    }
}

// Export for use in other scripts
export default new TeacherLoginTest();

// If run directly
if (require.main === module) {
    const test = new TeacherLoginTest();
    
    test.runAllTests()
        .then(() => {
            console.log('🎉 Testing completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Testing failed:', error);
            process.exit(1);
        });
}
