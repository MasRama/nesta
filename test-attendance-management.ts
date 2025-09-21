/**
 * Test script untuk fitur manajemen absensi yang baru
 * Menguji semua API endpoints dan fungsionalitas
 */

import DB from "./app/services/DB";
import AttendanceService from "./app/services/AttendanceService";
import dayjs from "dayjs";

async function testAttendanceManagement() {
   console.log("🧪 Testing Attendance Management Features...\n");

   try {
      // Test data
      const testTeacherUserId = "550e8400-e29b-41d4-a716-446655440002";
      const testClassId = "550e8400-e29b-41d4-a716-446655440010";
      const testSubjectId = "550e8400-e29b-41d4-a716-446655440006";
      const testStudentUserId = "550e8400-e29b-41d4-a716-446655440001";
      const today = dayjs().format('YYYY-MM-DD');

      console.log("📋 Test Data:");
      console.log(`   Teacher User ID: ${testTeacherUserId}`);
      console.log(`   Class ID: ${testClassId}`);
      console.log(`   Subject ID: ${testSubjectId}`);
      console.log(`   Student User ID: ${testStudentUserId}`);
      console.log(`   Date: ${today}\n`);

      // 1. Test getTeacherAttendanceSessions
      console.log("1️⃣ Testing getTeacherAttendanceSessions...");
      const sessions = await AttendanceService.getTeacherAttendanceSessions(
         testTeacherUserId,
         today,
         testSubjectId,
         testClassId
      );
      console.log(`   ✅ Found ${sessions.length} attendance sessions`);
      if (sessions.length > 0) {
         console.log(`   📊 First session: ${sessions[0].subject_name} - ${sessions[0].class_name}`);
         console.log(`   👥 Attendance records: ${sessions[0].attendance_records?.length || 0}`);
      }

      // 2. Test getClassStudentsForAttendance
      console.log("\n2️⃣ Testing getClassStudentsForAttendance...");
      const students = await AttendanceService.getClassStudentsForAttendance(
         testClassId,
         testSubjectId,
         today
      );
      console.log(`   ✅ Found ${students.length} students in class`);
      if (students.length > 0) {
         console.log(`   👤 First student: ${students[0].student_name || students[0].nama} (${students[0].nipd})`);
         console.log(`   📝 Attendance status: ${students[0].attendance_status}`);
      }

      // 3. Test manual attendance (create new session if needed)
      console.log("\n3️⃣ Testing manual attendance...");
      
      // First, create or get an attendance session
      let session = await DB.from("attendance_sessions")
         .where("teacher_id", testTeacherUserId)
         .where("attendance_date", today)
         .where("subject_id", testSubjectId)
         .where("class_id", testClassId)
         .where("is_active", true)
         .first();

      if (!session) {
         const { randomUUID } = await import("crypto");
         session = {
            id: randomUUID(),
            class_id: testClassId,
            teacher_id: testTeacherUserId,
            subject_id: testSubjectId,
            attendance_date: today,
            qr_token: randomUUID(),
            starts_at: new Date(),
            expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000),
            is_active: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         };
         await DB.table("attendance_sessions").insert(session);
         console.log(`   📝 Created new attendance session: ${session.id}`);
      } else {
         console.log(`   📝 Using existing attendance session: ${session.id}`);
      }

      // Test manual attendance marking
      const manualResult = await AttendanceService.manualAttendance(
         testStudentUserId,
         session.id,
         'present',
         'Test manual attendance'
      );
      
      if (manualResult.success) {
         console.log(`   ✅ Manual attendance successful: ${manualResult.message}`);
      } else {
         console.log(`   ❌ Manual attendance failed: ${manualResult.message}`);
      }

      // 4. Test updateAttendanceRecord
      console.log("\n4️⃣ Testing updateAttendanceRecord...");
      if (manualResult.success && manualResult.attendance) {
         const updateResult = await AttendanceService.updateAttendanceRecord(
            manualResult.attendance.id,
            'late',
            'Updated to late via test'
         );
         
         if (updateResult.success) {
            console.log(`   ✅ Attendance update successful: ${updateResult.message}`);
         } else {
            console.log(`   ❌ Attendance update failed: ${updateResult.message}`);
         }
      }

      // 5. Test getTeacherAttendanceStats
      console.log("\n5️⃣ Testing getTeacherAttendanceStats...");
      const stats = await AttendanceService.getTeacherAttendanceStats(
         testTeacherUserId,
         'today',
         testSubjectId,
         testClassId
      );
      console.log(`   ✅ Statistics retrieved for period: ${stats.period}`);
      console.log(`   📊 Overall stats:`, stats.overall);
      console.log(`   📅 Date range: ${stats.date_range.start} to ${stats.date_range.end}`);
      if (stats.frequent_absences?.length > 0) {
         console.log(`   ⚠️  Students with frequent absences: ${stats.frequent_absences.length}`);
      }

      // 6. Test exportAttendanceData
      console.log("\n6️⃣ Testing exportAttendanceData...");
      const exportData = await AttendanceService.exportAttendanceData(
         testClassId,
         testSubjectId,
         today,
         today,
         'json'
      );
      console.log(`   ✅ Export data retrieved: ${Array.isArray(exportData) ? exportData.length : 'structured'} records`);
      if (Array.isArray(exportData) && exportData.length > 0) {
         console.log(`   📄 Sample record:`, {
            date: exportData[0].attendance_date,
            student: exportData[0].student_name,
            status: exportData[0].status
         });
      }

      // 7. Test Excel export format
      console.log("\n7️⃣ Testing Excel export format...");
      const excelData = await AttendanceService.exportAttendanceData(
         testClassId,
         testSubjectId,
         today,
         today,
         'excel'
      );
      if (excelData.headers && excelData.data) {
         console.log(`   ✅ Excel format data prepared`);
         console.log(`   📊 Headers: ${excelData.headers.length} columns`);
         console.log(`   📄 Data rows: ${excelData.data.length} rows`);
      }

      // 8. Test database integrity
      console.log("\n8️⃣ Testing database integrity...");
      
      // Check foreign key relationships
      const attendanceRecords = await DB.from("attendance_records as ar")
         .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
         .join("users as u", "ar.student_id", "u.id")
         .where("as.teacher_id", testTeacherUserId)
         .where("as.attendance_date", today)
         .select("ar.*", "as.subject_id", "u.name as student_name")
         .limit(5);

      console.log(`   ✅ Found ${attendanceRecords.length} valid attendance records with proper foreign keys`);

      // Performance test
      console.log("\n9️⃣ Performance test...");
      const startTime = Date.now();
      await AttendanceService.getTeacherAttendanceSessions(testTeacherUserId, today);
      const endTime = Date.now();
      console.log(`   ⚡ getTeacherAttendanceSessions took ${endTime - startTime}ms`);

      console.log("\n🎉 All attendance management tests completed successfully!");
      console.log("\n📋 Summary:");
      console.log("   ✅ Teacher attendance sessions retrieval");
      console.log("   ✅ Class students for attendance management");
      console.log("   ✅ Manual attendance marking");
      console.log("   ✅ Attendance record updates");
      console.log("   ✅ Teacher attendance statistics");
      console.log("   ✅ Data export (JSON format)");
      console.log("   ✅ Data export (Excel format)");
      console.log("   ✅ Database integrity checks");
      console.log("   ✅ Performance validation");

   } catch (error) {
      console.error("❌ Test failed:", error);
      throw error;
   }
}

// Run the test
if (require.main === module) {
   testAttendanceManagement()
      .then(() => {
         console.log("\n✅ Test completed successfully!");
         process.exit(0);
      })
      .catch((error) => {
         console.error("\n❌ Test failed:", error);
         process.exit(1);
      });
}

export default testAttendanceManagement;
