/**
 * Test script untuk validasi fitur scan QR murid
 */

import DB from "./app/services/DB";
import AttendanceService from "./app/services/AttendanceService";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

class AttendanceScanTest {
   private testTeacherId: string;
   private testSubjectId: string;
   private testStudents: any[];
   private testTeacherRecordId: string;
   private testScheduleDay: string;

   async run() {
      console.log("🧪 Testing Attendance Scan QR Feature...\n");
      
      try {
         // Setup test data
         await this.setupTestData();
         
         // Test cases
         await this.testValidQRScan();
         await this.testInvalidQRFormat();
         await this.testStudentNotFound();
         await this.testNoActiveSchedule();
         await this.testDuplicateAttendance();
         
         console.log("\n✅ All tests completed!");
         
      } catch (error) {
         console.error("❌ Test failed:", error);
      } finally {
         // Cleanup
         await this.cleanup();
         process.exit(0);
      }
   }

   async setupTestData() {
      console.log("📋 Setting up test data...");
      
      // Create test teacher user
      const teacherUserId = randomUUID();
      await DB.table("users").insert({
         id: teacherUserId,
         name: "Test Teacher",
         email: `test.teacher.${Date.now()}@netsa.school`,
         password: "hashed_password",
         role: "teacher",
         teacher_id: `TCH${Date.now()}`,
         is_verified: true,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      });

      // Create teacher record
      const teacherId = randomUUID();
      await DB.table("teachers").insert({
         id: teacherId,
         user_id: teacherUserId,
         nip: `NIP${Date.now()}`,
         nama: "Test Teacher",
         email: `test.teacher.${Date.now()}@netsa.school`,
         password: "hashed_password",
         is_active: true,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      });

      // Create test subject
      const subjectId = randomUUID();
      await DB.table("subjects").insert({
         id: subjectId,
         kode: `TEST${Date.now()}`,
         nama: "Test Subject",
         deskripsi: "Subject for testing",
         is_active: true,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      });

      // Create teacher-subject relationship
      await DB.table("teacher_subjects").insert({
         id: randomUUID(),
         teacher_id: teacherId,
         subject_id: subjectId,
         is_active: true,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      });

      // Create test students
      const timestamp = Date.now();
      const students = [
         {
            id: randomUUID(),
            nipd: `NSID${timestamp}1`,
            nama: "Ahmad Budi Santoso",
            kelas: "10A",
            tempat_lahir: "Jakarta",
            tanggal_lahir: "2008-01-15",
            jenis_kelamin: "Laki - Laki",
            agama: "Islam",
            is_active: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            nipd: `NSID${timestamp}2`,
            nama: "Siti Nurhaliza",
            kelas: "10A",
            tempat_lahir: "Bandung",
            tanggal_lahir: "2008-03-20",
            jenis_kelamin: "Perempuan",
            agama: "Islam",
            is_active: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         }
      ];

      await DB.table("students").insert(students);

      // Create test schedule for current time
      const now = new Date();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const currentDay = dayNames[now.getDay()];

      // Database only allows weekdays, so use Monday if weekend
      const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      const scheduleDay = validDays.includes(currentDay) ? currentDay : 'Senin';

      // Create schedule that includes current time
      const startTime = dayjs().subtract(30, 'minutes').format('HH:mm');
      const endTime = dayjs().add(30, 'minutes').format('HH:mm');

      await DB.table("subject_schedules").insert({
         id: randomUUID(),
         subject_id: subjectId,
         kelas: "10A",
         start_time: startTime,
         end_time: endTime,
         day: scheduleDay,
         is_active: true,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      });

      console.log(`   ✓ Test data created for ${currentDay} ${startTime}-${endTime}`);
      if (currentDay !== scheduleDay) {
         console.log(`   ⚠️  Note: Today is ${currentDay}, but schedule created for ${scheduleDay} (weekdays only)`);
      }
      
      // Store for cleanup
      this.testTeacherId = teacherUserId; // Use user ID for scanStudentQR
      this.testSubjectId = subjectId;
      this.testStudents = students;
      this.testTeacherRecordId = teacherId; // Store teacher record ID for cleanup
      this.testScheduleDay = scheduleDay; // Store the day we created schedule for
   }

   async testValidQRScan() {
      console.log("\n🔍 Test 1: Valid QR Scan");
      console.log(`   📅 Testing with schedule day: ${this.testScheduleDay}`);

      const now = new Date();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const currentDay = dayNames[now.getDay()];

      if (currentDay !== this.testScheduleDay) {
         console.log(`   ⚠️  Skipping test: Today is ${currentDay}, but schedule is for ${this.testScheduleDay}`);
         console.log("   ℹ️  This test only works when run on the scheduled day");
         return;
      }

      const qrData = `${this.testStudents[0].nipd}_Ahmad Budi Santoso`;
      const result = await AttendanceService.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);

      if (result.success) {
         console.log("   ✅ Valid QR scan successful");
         console.log(`   📝 Message: ${result.message}`);
         console.log(`   👤 Student: ${result.student?.nama} (${result.student?.nipd})`);
      } else {
         console.log("   ❌ Valid QR scan failed");
         console.log(`   📝 Error: ${result.message}`);
      }
   }

   async testInvalidQRFormat() {
      console.log("\n🔍 Test 2: Invalid QR Format");
      
      const qrData = "InvalidFormat";
      const result = await AttendanceService.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);
      
      if (!result.success && result.message.includes("Format QR code tidak valid")) {
         console.log("   ✅ Invalid format correctly rejected");
      } else {
         console.log("   ❌ Invalid format should be rejected");
         console.log(`   📝 Result: ${result.message}`);
      }
   }

   async testStudentNotFound() {
      console.log("\n🔍 Test 3: Student Not Found");
      
      const qrData = "NSID999_Nonexistent Student";
      const result = await AttendanceService.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);
      
      if (!result.success && result.message.includes("tidak ditemukan")) {
         console.log("   ✅ Nonexistent student correctly rejected");
      } else {
         console.log("   ❌ Nonexistent student should be rejected");
         console.log(`   📝 Result: ${result.message}`);
      }
   }

   async testNoActiveSchedule() {
      console.log("\n🔍 Test 4: No Active Schedule");
      
      // Create teacher without schedule
      const noScheduleTeacherId = randomUUID();
      await DB.table("users").insert({
         id: noScheduleTeacherId,
         name: "No Schedule Teacher",
         email: `no.schedule.${Date.now()}@netsa.school`,
         password: "hashed_password",
         role: "teacher",
         teacher_id: `TCH${Date.now() + 1}`,
         is_verified: true,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      });

      const qrData = `${this.testStudents[0].nipd}_Ahmad Budi Santoso`;
      const result = await AttendanceService.scanStudentQR(qrData, noScheduleTeacherId, this.testSubjectId);
      
      if (!result.success && result.message.includes("jadwal mengajar")) {
         console.log("   ✅ No schedule correctly rejected");
      } else {
         console.log("   ❌ No schedule should be rejected");
         console.log(`   📝 Result: ${result.message}`);
      }
   }

   async testDuplicateAttendance() {
      console.log("\n🔍 Test 5: Duplicate Attendance");

      const now = new Date();
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const currentDay = dayNames[now.getDay()];

      if (currentDay !== this.testScheduleDay) {
         console.log(`   ⚠️  Skipping test: Today is ${currentDay}, but schedule is for ${this.testScheduleDay}`);
         return;
      }

      const qrData = `${this.testStudents[1].nipd}_Siti Nurhaliza`;

      // First scan should succeed
      const result1 = await AttendanceService.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);

      // Second scan should fail
      const result2 = await AttendanceService.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);

      if (result1.success && !result2.success && result2.message.includes("sudah melakukan absensi")) {
         console.log("   ✅ Duplicate attendance correctly rejected");
      } else {
         console.log("   ❌ Duplicate attendance should be rejected");
         console.log(`   📝 First: ${result1.message}`);
         console.log(`   📝 Second: ${result2.message}`);
      }
   }

   async cleanup() {
      console.log("\n🧹 Cleaning up test data...");
      
      try {
         // Delete in reverse order due to foreign keys
         if (this.testStudents) {
            await DB.table("attendance_records").where("student_id", "in", this.testStudents.map(s => s.id)).del();
            await DB.table("students").where("id", "in", this.testStudents.map(s => s.id)).del();
         }
         if (this.testTeacherId) {
            await DB.table("attendance_sessions").where("teacher_id", this.testTeacherId).del();
            await DB.table("users").where("id", this.testTeacherId).del();
         }
         if (this.testTeacherRecordId) {
            await DB.table("teachers").where("id", this.testTeacherRecordId).del();
         }
         if (this.testSubjectId) {
            await DB.table("subject_schedules").where("subject_id", this.testSubjectId).del();
            await DB.table("teacher_subjects").where("subject_id", this.testSubjectId).del();
            await DB.table("subjects").where("id", this.testSubjectId).del();
         }

         console.log("   ✓ Test data cleaned up");
      } catch (error) {
         console.error("   ❌ Cleanup failed:", error);
      }
   }
}

// Run the test
const test = new AttendanceScanTest();
test.run();
