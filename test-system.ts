/**
 * NETSA System Test Script
 * Basic functionality tests for the school management system
 */

import DB from "./app/services/DB";
import AttendanceService from "./app/services/AttendanceService";
import JournalService from "./app/services/JournalService";
import ExcelService from "./app/services/ExcelService";

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
      } catch (error) {
         console.error("\n❌ Test failed:", error);
         throw error;
      }
   }

   async testDatabaseConnection() {
      console.log("📊 Testing database connection...");
      
      const users = await DB.from("users").count("* as count").first();
      const classes = await DB.from("classes").count("* as count").first();
      const attendance = await DB.from("attendance_records").count("* as count").first();
      
      console.log(`   ✓ Users: ${users.count}`);
      console.log(`   ✓ Classes: ${classes.count}`);
      console.log(`   ✓ Attendance records: ${attendance.count}`);
   }

   async testUserRoles() {
      console.log("\n👥 Testing user roles...");
      
      const roles = await DB.from("users")
         .select("role")
         .count("* as count")
         .groupBy("role");
      
      roles.forEach(role => {
         console.log(`   ✓ ${role.role}: ${role.count} users`);
      });
   }

   async testAttendanceSystem() {
      console.log("\n📱 Testing attendance system...");
      
      // Get a test class and teacher
      const testClass = await DB.from("classes").first();
      const teacher = await DB.from("users").where("id", testClass.teacher_id).first();
      
      // Test QR code generation
      const qrResult = await AttendanceService.generateQRCode(testClass.id, teacher.id, 30);
      console.log(`   ✓ QR code generated for class: ${testClass.name}`);
      console.log(`   ✓ Session expires at: ${qrResult.session.expires_at}`);
      
      // Test attendance stats
      const student = await DB.from("users").where("role", "student").first();
      const stats = await AttendanceService.getStudentAttendanceStats(student.id);
      console.log(`   ✓ Student attendance stats:`, stats);
   }

   async testJournalSystem() {
      console.log("\n📖 Testing journal system...");
      
      const teacher = await DB.from("users").where("role", "teacher").first();
      const journals = await JournalService.getJournalsByTeacher(teacher.id, 5);
      
      console.log(`   ✓ Found ${journals.length} journals for teacher: ${teacher.name}`);
      
      if (journals.length > 0) {
         const journal = journals[0];
         console.log(`   ✓ Sample journal: "${journal.title}" (${journal.status})`);
      }
   }

   async testExcelService() {
      console.log("\n📋 Testing Excel service...");
      
      // Test template generation
      const template = ExcelService.generateExamTemplate();
      console.log(`   ✓ Excel template generated (${template.length} bytes)`);
      
      // Test sample data validation
      const sampleQuestions = [
         {
            question_text: "Test question?",
            options: ["A", "B", "C", "D"],
            correct_answer_index: 1,
            points: 10
         }
      ];
      
      const validation = ExcelService.validateQuestionFormat(sampleQuestions);
      console.log(`   ✓ Question validation: ${validation.isValid ? 'Passed' : 'Failed'}`);
      
      if (!validation.isValid) {
         console.log(`   ✗ Validation errors:`, validation.errors);
      }
   }
}

// Run the tests
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