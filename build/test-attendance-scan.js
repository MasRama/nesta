"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./app/services/DB"));
const AttendanceService_1 = __importDefault(require("./app/services/AttendanceService"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
class AttendanceScanTest {
    async run() {
        console.log("🧪 Testing Attendance Scan QR Feature...\n");
        try {
            await this.setupTestData();
            await this.testValidQRScan();
            await this.testInvalidQRFormat();
            await this.testStudentNotFound();
            await this.testNoActiveSchedule();
            await this.testDuplicateAttendance();
            console.log("\n✅ All tests completed!");
        }
        catch (error) {
            console.error("❌ Test failed:", error);
        }
        finally {
            await this.cleanup();
            process.exit(0);
        }
    }
    async setupTestData() {
        console.log("📋 Setting up test data...");
        const teacherUserId = (0, crypto_1.randomUUID)();
        await DB_1.default.table("users").insert({
            id: teacherUserId,
            name: "Test Teacher",
            email: `test.teacher.${Date.now()}@netsa.school`,
            password: "hashed_password",
            role: "teacher",
            teacher_id: `TCH${Date.now()}`,
            is_verified: true,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        const teacherId = (0, crypto_1.randomUUID)();
        await DB_1.default.table("teachers").insert({
            id: teacherId,
            user_id: teacherUserId,
            nip: `NIP${Date.now()}`,
            nama: "Test Teacher",
            email: `test.teacher.${Date.now()}@netsa.school`,
            password: "hashed_password",
            is_active: true,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        const subjectId = (0, crypto_1.randomUUID)();
        await DB_1.default.table("subjects").insert({
            id: subjectId,
            kode: `TEST${Date.now()}`,
            nama: "Test Subject",
            deskripsi: "Subject for testing",
            is_active: true,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        await DB_1.default.table("teacher_subjects").insert({
            id: (0, crypto_1.randomUUID)(),
            teacher_id: teacherId,
            subject_id: subjectId,
            is_active: true,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        const timestamp = Date.now();
        const students = [
            {
                id: (0, crypto_1.randomUUID)(),
                nipd: `NSID${timestamp}1`,
                nama: "Ahmad Budi Santoso",
                kelas: "10A",
                tempat_lahir: "Jakarta",
                tanggal_lahir: "2008-01-15",
                jenis_kelamin: "Laki - Laki",
                agama: "Islam",
                is_active: true,
                created_at: (0, dayjs_1.default)().valueOf(),
                updated_at: (0, dayjs_1.default)().valueOf()
            },
            {
                id: (0, crypto_1.randomUUID)(),
                nipd: `NSID${timestamp}2`,
                nama: "Siti Nurhaliza",
                kelas: "10A",
                tempat_lahir: "Bandung",
                tanggal_lahir: "2008-03-20",
                jenis_kelamin: "Perempuan",
                agama: "Islam",
                is_active: true,
                created_at: (0, dayjs_1.default)().valueOf(),
                updated_at: (0, dayjs_1.default)().valueOf()
            }
        ];
        await DB_1.default.table("students").insert(students);
        const now = new Date();
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const currentDay = dayNames[now.getDay()];
        const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        const scheduleDay = validDays.includes(currentDay) ? currentDay : 'Senin';
        const startTime = (0, dayjs_1.default)().subtract(30, 'minutes').format('HH:mm');
        const endTime = (0, dayjs_1.default)().add(30, 'minutes').format('HH:mm');
        await DB_1.default.table("subject_schedules").insert({
            id: (0, crypto_1.randomUUID)(),
            subject_id: subjectId,
            kelas: "10A",
            start_time: startTime,
            end_time: endTime,
            day: scheduleDay,
            is_active: true,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        console.log(`   ✓ Test data created for ${currentDay} ${startTime}-${endTime}`);
        if (currentDay !== scheduleDay) {
            console.log(`   ⚠️  Note: Today is ${currentDay}, but schedule created for ${scheduleDay} (weekdays only)`);
        }
        this.testTeacherId = teacherUserId;
        this.testSubjectId = subjectId;
        this.testStudents = students;
        this.testTeacherRecordId = teacherId;
        this.testScheduleDay = scheduleDay;
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
        const result = await AttendanceService_1.default.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);
        if (result.success) {
            console.log("   ✅ Valid QR scan successful");
            console.log(`   📝 Message: ${result.message}`);
            console.log(`   👤 Student: ${result.student?.nama} (${result.student?.nipd})`);
        }
        else {
            console.log("   ❌ Valid QR scan failed");
            console.log(`   📝 Error: ${result.message}`);
        }
    }
    async testInvalidQRFormat() {
        console.log("\n🔍 Test 2: Invalid QR Format");
        const qrData = "InvalidFormat";
        const result = await AttendanceService_1.default.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);
        if (!result.success && result.message.includes("Format QR code tidak valid")) {
            console.log("   ✅ Invalid format correctly rejected");
        }
        else {
            console.log("   ❌ Invalid format should be rejected");
            console.log(`   📝 Result: ${result.message}`);
        }
    }
    async testStudentNotFound() {
        console.log("\n🔍 Test 3: Student Not Found");
        const qrData = "NSID999_Nonexistent Student";
        const result = await AttendanceService_1.default.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);
        if (!result.success && result.message.includes("tidak ditemukan")) {
            console.log("   ✅ Nonexistent student correctly rejected");
        }
        else {
            console.log("   ❌ Nonexistent student should be rejected");
            console.log(`   📝 Result: ${result.message}`);
        }
    }
    async testNoActiveSchedule() {
        console.log("\n🔍 Test 4: No Active Schedule");
        const noScheduleTeacherId = (0, crypto_1.randomUUID)();
        await DB_1.default.table("users").insert({
            id: noScheduleTeacherId,
            name: "No Schedule Teacher",
            email: `no.schedule.${Date.now()}@netsa.school`,
            password: "hashed_password",
            role: "teacher",
            teacher_id: `TCH${Date.now() + 1}`,
            is_verified: true,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        const qrData = `${this.testStudents[0].nipd}_Ahmad Budi Santoso`;
        const result = await AttendanceService_1.default.scanStudentQR(qrData, noScheduleTeacherId, this.testSubjectId);
        if (!result.success && result.message.includes("jadwal mengajar")) {
            console.log("   ✅ No schedule correctly rejected");
        }
        else {
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
        const result1 = await AttendanceService_1.default.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);
        const result2 = await AttendanceService_1.default.scanStudentQR(qrData, this.testTeacherId, this.testSubjectId);
        if (result1.success && !result2.success && result2.message.includes("sudah melakukan absensi")) {
            console.log("   ✅ Duplicate attendance correctly rejected");
        }
        else {
            console.log("   ❌ Duplicate attendance should be rejected");
            console.log(`   📝 First: ${result1.message}`);
            console.log(`   📝 Second: ${result2.message}`);
        }
    }
    async cleanup() {
        console.log("\n🧹 Cleaning up test data...");
        try {
            if (this.testStudents) {
                await DB_1.default.table("attendance_records").where("student_id", "in", this.testStudents.map(s => s.id)).del();
                await DB_1.default.table("students").where("id", "in", this.testStudents.map(s => s.id)).del();
            }
            if (this.testTeacherId) {
                await DB_1.default.table("attendance_sessions").where("teacher_id", this.testTeacherId).del();
                await DB_1.default.table("users").where("id", this.testTeacherId).del();
            }
            if (this.testTeacherRecordId) {
                await DB_1.default.table("teachers").where("id", this.testTeacherRecordId).del();
            }
            if (this.testSubjectId) {
                await DB_1.default.table("subject_schedules").where("subject_id", this.testSubjectId).del();
                await DB_1.default.table("teacher_subjects").where("subject_id", this.testSubjectId).del();
                await DB_1.default.table("subjects").where("id", this.testSubjectId).del();
            }
            console.log("   ✓ Test data cleaned up");
        }
        catch (error) {
            console.error("   ❌ Cleanup failed:", error);
        }
    }
}
const test = new AttendanceScanTest();
test.run();
//# sourceMappingURL=test-attendance-scan.js.map