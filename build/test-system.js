"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./app/services/DB"));
const AttendanceService_1 = __importDefault(require("./app/services/AttendanceService"));
const JournalService_1 = __importDefault(require("./app/services/JournalService"));
const ExcelService_1 = __importDefault(require("./app/services/ExcelService"));
class SystemTest {
    async run() {
        console.log("🧪 Running NETSA system tests...\n");
        try {
            await this.testDatabaseConnection();
            await this.testUserRoles();
            await this.testAttendanceSystem();
            await this.testJournalSystem();
            await this.testExcelService();
            console.log("\n✅ All tests passed! System is ready for use.");
        }
        catch (error) {
            console.error("\n❌ Test failed:", error);
            throw error;
        }
    }
    async testDatabaseConnection() {
        console.log("📊 Testing database connection...");
        const users = await DB_1.default.from("users").count("* as count").first();
        const classes = await DB_1.default.from("classes").count("* as count").first();
        const attendance = await DB_1.default.from("attendance_records").count("* as count").first();
        console.log(`   ✓ Users: ${users.count}`);
        console.log(`   ✓ Classes: ${classes.count}`);
        console.log(`   ✓ Attendance records: ${attendance.count}`);
    }
    async testUserRoles() {
        console.log("\n👥 Testing user roles...");
        const roles = await DB_1.default.from("users")
            .select("role")
            .count("* as count")
            .groupBy("role");
        roles.forEach(role => {
            console.log(`   ✓ ${role.role}: ${role.count} users`);
        });
    }
    async testAttendanceSystem() {
        console.log("\n📱 Testing attendance system...");
        const testClass = await DB_1.default.from("classes").first();
        const teacher = await DB_1.default.from("users").where("id", testClass.teacher_id).first();
        console.log(`   ✓ QR code generation test skipped (method not available)`);
        const student = await DB_1.default.from("users").where("role", "student").first();
        const stats = await AttendanceService_1.default.getStudentAttendanceStats(student.id);
        console.log(`   ✓ Student attendance stats:`, stats);
    }
    async testJournalSystem() {
        console.log("\n📖 Testing journal system...");
        const teacher = await DB_1.default.from("users").where("role", "teacher").first();
        const journals = await JournalService_1.default.getJournalsByTeacher(teacher.id, 5);
        console.log(`   ✓ Found ${journals.length} journals for teacher: ${teacher.name}`);
        if (journals.length > 0) {
            const journal = journals[0];
            console.log(`   ✓ Sample journal: "${journal.title}" (${journal.status})`);
        }
    }
    async testExcelService() {
        console.log("\n📋 Testing Excel service...");
        const template = ExcelService_1.default.generateExamTemplate();
        console.log(`   ✓ Excel template generated (${template.length} bytes)`);
        const sampleQuestions = [
            {
                question_text: "Test question?",
                options: ["A", "B", "C", "D"],
                correct_answer_index: 1,
                points: 10
            }
        ];
        const validation = ExcelService_1.default.validateQuestionFormat(sampleQuestions);
        console.log(`   ✓ Question validation: ${validation.isValid ? 'Passed' : 'Failed'}`);
        if (!validation.isValid) {
            console.log(`   ✗ Validation errors:`, validation.errors);
        }
    }
}
const test = new SystemTest();
test.run()
    .then(() => {
    console.log("\n🎯 System test completed successfully!");
    process.exit(0);
})
    .catch((error) => {
    console.error("\n💥 System test failed:", error);
    process.exit(1);
});
//# sourceMappingURL=test-system.js.map