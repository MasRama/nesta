"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AttendanceService_1 = __importDefault(require("./app/services/AttendanceService"));
const DB_1 = __importDefault(require("./app/services/DB"));
class AttendanceForeignKeyTest {
    async testForeignKeyFix() {
        console.log("🧪 Testing Foreign Key Constraint Fix...\n");
        try {
            const testData = {
                qrData: "2024070001_Ahmad Rizki Pratama",
                teacherUserId: "550e8400-e29b-41d4-a716-446655440002",
                subjectId: "550e8400-e29b-41d4-a716-446655440006",
                classId: "550e8400-e29b-41d4-a716-446655440010"
            };
            console.log("📋 Test Data:");
            console.log(`   QR Data: ${testData.qrData}`);
            console.log(`   Teacher User ID: ${testData.teacherUserId}`);
            console.log(`   Subject ID: ${testData.subjectId}`);
            console.log(`   Class ID: ${testData.classId}\n`);
            await this.verifyReferenceData(testData);
            console.log("🔍 Testing scanStudentQR method...");
            const result = await AttendanceService_1.default.scanStudentQR(testData.qrData, testData.teacherUserId, testData.subjectId, undefined, testData.classId);
            if (result.success) {
                console.log("✅ SUCCESS: QR scan berhasil tanpa foreign key error!");
                console.log(`   Message: ${result.message}`);
                if (result.attendance) {
                    console.log(`   Attendance ID: ${result.attendance.id}`);
                    console.log(`   Session ID: ${result.attendance.attendance_session_id}`);
                }
                if (result.student) {
                    console.log(`   Student: ${result.student.nama} (${result.student.nipd})`);
                }
            }
            else {
                console.log("❌ FAILED: QR scan gagal");
                console.log(`   Error: ${result.message}`);
            }
        }
        catch (error) {
            console.error("❌ CRITICAL ERROR:", error);
            if (error.message && error.message.includes("FOREIGN KEY constraint failed")) {
                console.log("\n🚨 FOREIGN KEY CONSTRAINT MASIH BERMASALAH!");
                console.log("   Perbaikan belum berhasil mengatasi masalah ini.");
            }
        }
    }
    async verifyReferenceData(testData) {
        console.log("🔍 Verifying reference data exists...");
        const user = await DB_1.default.from("users").where("id", testData.teacherUserId).first();
        console.log(`   User (${testData.teacherUserId}): ${user ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        const teacher = await DB_1.default.from("teachers").where("user_id", testData.teacherUserId).first();
        console.log(`   Teacher linked to user: ${teacher ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        const subject = await DB_1.default.from("subjects").where("id", testData.subjectId).first();
        console.log(`   Subject (${testData.subjectId}): ${subject ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        const classRecord = await DB_1.default.from("classes").where("id", testData.classId).first();
        console.log(`   Class (${testData.classId}): ${classRecord ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        console.log("");
    }
    async cleanupTestData() {
        console.log("\n🧹 Cleaning up test data...");
        try {
            const deletedRecords = await DB_1.default.from("attendance_records")
                .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
                .where("attendance_sessions.teacher_id", "550e8400-e29b-41d4-a716-446655440002")
                .where("attendance_sessions.subject_id", "550e8400-e29b-41d4-a716-446655440006")
                .del();
            const deletedSessions = await DB_1.default.from("attendance_sessions")
                .where("teacher_id", "550e8400-e29b-41d4-a716-446655440002")
                .where("subject_id", "550e8400-e29b-41d4-a716-446655440006")
                .del();
            console.log(`   Deleted ${deletedRecords} attendance records`);
            console.log(`   Deleted ${deletedSessions} attendance sessions`);
        }
        catch (error) {
            console.log("   Cleanup failed (this is normal if no test data exists)");
        }
    }
}
async function runTest() {
    const test = new AttendanceForeignKeyTest();
    await test.cleanupTestData();
    await test.testForeignKeyFix();
    await test.cleanupTestData();
    console.log("\n✅ Test completed!");
    process.exit(0);
}
if (require.main === module) {
    runTest().catch(console.error);
}
exports.default = AttendanceForeignKeyTest;
//# sourceMappingURL=test-attendance-fix.js.map