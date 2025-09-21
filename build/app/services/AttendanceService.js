"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
class AttendanceService {
    async validateTeacherSchedule(teacherId, classId, subjectId) {
        try {
            const now = new Date();
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentDay = dayNames[now.getDay()];
            const currentTime = now.toTimeString().slice(0, 5);
            let query = DB_1.default.from('subject_classes as sc')
                .join('classes as c', 'sc.class_id', 'c.id')
                .join('subjects as s', 'sc.subject_id', 's.id')
                .select('sc.*', 'c.name as class_name', 's.nama as subject_name', 's.kode as subject_code')
                .where('sc.teacher_id', teacherId)
                .where('sc.class_id', classId)
                .where('sc.day', currentDay)
                .where('sc.is_active', true);
            if (subjectId) {
                query = query.where('sc.subject_id', subjectId);
            }
            const schedules = await query;
            if (schedules.length === 0) {
                return {
                    valid: false,
                    message: subjectId
                        ? 'Anda tidak memiliki jadwal mengajar mata pelajaran ini di kelas ini hari ini'
                        : 'Anda tidak memiliki jadwal mengajar di kelas ini hari ini'
                };
            }
            const activeSchedule = schedules.find(schedule => {
                return currentTime >= schedule.start_time && currentTime <= schedule.end_time;
            });
            if (!activeSchedule) {
                const nextSchedule = schedules.find(schedule => currentTime < schedule.start_time);
                if (nextSchedule) {
                    return {
                        valid: false,
                        message: `Jadwal mengajar ${nextSchedule.subject_name} dimulai pada ${nextSchedule.start_time}. Saat ini belum waktunya.`
                    };
                }
                else {
                    return {
                        valid: false,
                        message: 'Tidak ada jadwal mengajar yang aktif saat ini untuk kelas ini.'
                    };
                }
            }
            return {
                valid: true,
                message: 'Validasi berhasil',
                schedule: activeSchedule
            };
        }
        catch (error) {
            console.error('Error validating teacher schedule:', error);
            return {
                valid: false,
                message: 'Terjadi kesalahan saat memvalidasi jadwal'
            };
        }
    }
    async validateTeacherSubject(teacherId, subjectId, studentClass) {
        try {
            const schedule = await DB_1.default.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacherId)
                .where("s.id", subjectId)
                .where("c.name", studentClass)
                .where("s.is_active", true)
                .select("sc.*", "s.id as subject_id", "s.nama as subject_name", "s.kode as subject_code", "c.name as class_name")
                .first();
            if (!schedule) {
                return {
                    valid: false,
                    message: `Anda tidak mengampu mata pelajaran ini untuk kelas ${studentClass}.`
                };
            }
            return {
                valid: true,
                message: "Validasi berhasil",
                schedule
            };
        }
        catch (error) {
            console.error("Error validating teacher-subject relationship:", error);
            return {
                valid: false,
                message: "Terjadi kesalahan saat memvalidasi mata pelajaran"
            };
        }
    }
    async scanStudentQR(qrData, teacherUserId, subjectId, scheduleId, classId) {
        try {
            const qrParts = qrData.split('_');
            if (qrParts.length < 2) {
                return {
                    success: false,
                    message: "Format QR code tidak valid. Format yang benar: NSID_Nama Lengkap"
                };
            }
            const nsid = qrParts[0].trim();
            const namaLengkap = qrParts.slice(1).join('_').trim();
            const student = await DB_1.default.from("students")
                .where("nipd", nsid)
                .where("nama", namaLengkap)
                .where("is_active", true)
                .first();
            if (!student) {
                return {
                    success: false,
                    message: `Siswa dengan NSID ${nsid} dan nama ${namaLengkap} tidak ditemukan atau tidak aktif`
                };
            }
            const teacher = await DB_1.default.from("teachers")
                .where("user_id", teacherUserId)
                .where("is_active", true)
                .first();
            if (!teacher) {
                return {
                    success: false,
                    message: "Data guru tidak ditemukan atau tidak aktif"
                };
            }
            let scheduleValidation;
            if (scheduleId && classId) {
                scheduleValidation = await this.validateSpecificTeacherSchedule(teacher.id, subjectId, scheduleId, classId);
            }
            else {
                scheduleValidation = await this.validateTeacherSubject(teacher.id, subjectId, student.kelas);
            }
            if (!scheduleValidation.valid) {
                return {
                    success: false,
                    message: scheduleValidation.message
                };
            }
            const today = (0, dayjs_1.default)().format('YYYY-MM-DD');
            const existingAttendance = await DB_1.default.from("attendance_records")
                .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
                .where("attendance_records.student_id", student.user_id)
                .where("attendance_sessions.attendance_date", today)
                .where("attendance_sessions.subject_id", subjectId)
                .first();
            if (existingAttendance) {
                return {
                    success: false,
                    message: `${student.nama} sudah melakukan absensi untuk mata pelajaran ini hari ini`
                };
            }
            let classRecord = await DB_1.default.from("classes")
                .where("name", student.kelas)
                .first();
            if (!classRecord) {
                const gradeLevel = student.kelas.match(/\d+/)?.[0] || "0";
                const academicYear = new Date().getFullYear() + "/" + (new Date().getFullYear() + 1);
                classRecord = {
                    id: (0, crypto_1.randomUUID)(),
                    name: student.kelas,
                    grade_level: gradeLevel,
                    academic_year: academicYear,
                    description: `Kelas ${student.kelas}`,
                    max_students: 30,
                    teacher_id: null,
                    schedule: null,
                    created_at: (0, dayjs_1.default)().valueOf(),
                    updated_at: (0, dayjs_1.default)().valueOf()
                };
                await DB_1.default.table("classes").insert(classRecord);
            }
            let session = await DB_1.default.from("attendance_sessions")
                .where("teacher_id", teacherUserId)
                .where("attendance_date", today)
                .where("subject_id", subjectId)
                .where("class_id", classRecord.id)
                .where("is_active", true)
                .first();
            if (!session) {
                session = {
                    id: (0, crypto_1.randomUUID)(),
                    class_id: classRecord.id,
                    teacher_id: teacherUserId,
                    subject_id: subjectId,
                    attendance_date: today,
                    qr_token: (0, crypto_1.randomUUID)(),
                    starts_at: new Date(),
                    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000),
                    is_active: true,
                    created_at: (0, dayjs_1.default)().valueOf(),
                    updated_at: (0, dayjs_1.default)().valueOf()
                };
                await DB_1.default.table("attendance_sessions").insert(session);
            }
            const attendanceRecord = {
                id: (0, crypto_1.randomUUID)(),
                attendance_session_id: session.id,
                student_id: student.user_id,
                status: 'present',
                scanned_at: new Date(),
                created_at: (0, dayjs_1.default)().valueOf(),
                updated_at: (0, dayjs_1.default)().valueOf()
            };
            await DB_1.default.table("attendance_records").insert(attendanceRecord);
            return {
                success: true,
                message: `Absensi ${student.nama} (${student.nipd}) berhasil dicatat`,
                attendance: attendanceRecord,
                student: {
                    id: student.id,
                    nipd: student.nipd,
                    nama: student.nama,
                    kelas: student.kelas
                }
            };
        }
        catch (error) {
            console.error("Error scanning student QR:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat memproses scan QR code murid"
            };
        }
    }
    async processScan(qrData, studentId) {
        try {
            const scanData = JSON.parse(qrData);
            const { token, session_id } = scanData;
            const session = await DB_1.default.from("attendance_sessions")
                .where("id", session_id)
                .where("qr_token", token)
                .where("is_active", true)
                .first();
            if (!session) {
                return { success: false, message: "QR code tidak valid atau sudah kadaluarsa" };
            }
            if (new Date() > new Date(session.expires_at)) {
                return { success: false, message: "Sesi absensi sudah berakhir" };
            }
            const enrollment = await DB_1.default.from("student_classes")
                .where("student_id", studentId)
                .where("class_id", session.class_id)
                .where("is_active", true)
                .first();
            if (!enrollment) {
                return { success: false, message: "Anda tidak terdaftar di kelas ini" };
            }
            const existingRecord = await DB_1.default.from("attendance_records")
                .where("attendance_session_id", session.id)
                .where("student_id", studentId)
                .first();
            if (existingRecord) {
                return { success: false, message: "Anda sudah absen untuk sesi ini" };
            }
            const attendanceRecord = {
                id: (0, crypto_1.randomUUID)(),
                attendance_session_id: session.id,
                student_id: studentId,
                status: 'present',
                scanned_at: new Date(),
                created_at: (0, dayjs_1.default)().valueOf(),
                updated_at: (0, dayjs_1.default)().valueOf()
            };
            await DB_1.default.table("attendance_records").insert(attendanceRecord);
            return {
                success: true,
                message: "Absensi berhasil dicatat",
                attendance: attendanceRecord
            };
        }
        catch (error) {
            console.error("Error processing scan:", error);
            return { success: false, message: "Terjadi kesalahan saat memproses QR code" };
        }
    }
    async getClassAttendance(classId, date) {
        let query = DB_1.default.from("attendance_sessions")
            .leftJoin("attendance_records", "attendance_sessions.id", "attendance_records.attendance_session_id")
            .leftJoin("users", "attendance_records.student_id", "users.id")
            .leftJoin("students", "users.id", "students.user_id")
            .where("attendance_sessions.class_id", classId);
        if (date) {
            query = query.where("attendance_sessions.attendance_date", date);
        }
        return query.select("attendance_sessions.*", "attendance_records.student_id", "attendance_records.status", "attendance_records.scanned_at", "users.name as student_name", "students.nipd as student_number");
    }
    async getStudentAttendance(studentId, limit = 20) {
        return DB_1.default.from("attendance_records")
            .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
            .join("classes", "attendance_sessions.class_id", "classes.id")
            .where("attendance_records.student_id", studentId)
            .orderBy("attendance_sessions.attendance_date", "desc")
            .limit(limit)
            .select("attendance_records.*", "attendance_sessions.attendance_date", "classes.name as class_name", "classes.grade_level");
    }
    async getStudentAttendanceStats(studentId, classId) {
        let query = DB_1.default.from("attendance_records")
            .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
            .where("attendance_records.student_id", studentId);
        if (classId) {
            query = query.where("attendance_sessions.class_id", classId);
        }
        const stats = await query
            .select("attendance_records.status")
            .count("* as count")
            .groupBy("attendance_records.status");
        return stats.reduce((acc, stat) => {
            acc[stat.status] = stat.count;
            return acc;
        }, {});
    }
    async validateSpecificTeacherSchedule(teacherId, subjectId, scheduleId, classId) {
        try {
            const schedule = await DB_1.default.from("subject_classes")
                .where("id", scheduleId)
                .where("teacher_id", teacherId)
                .where("subject_id", subjectId)
                .where("class_id", classId)
                .first();
            if (!schedule) {
                return {
                    valid: false,
                    message: "Anda tidak memiliki akses untuk mengajar mata pelajaran ini pada jadwal yang dipilih"
                };
            }
            return {
                valid: true,
                message: "Validasi berhasil"
            };
        }
        catch (error) {
            console.error("Error validating teacher schedule:", error);
            return {
                valid: false,
                message: "Terjadi kesalahan saat validasi jadwal"
            };
        }
    }
    async markAbsent(sessionId, studentIds) {
        const session = await DB_1.default.from("attendance_sessions")
            .where("id", sessionId)
            .first();
        if (!session) {
            throw new Error("Session not found");
        }
        const absentRecords = studentIds.map(studentId => ({
            id: (0, crypto_1.randomUUID)(),
            attendance_session_id: sessionId,
            student_id: studentId,
            status: 'absent',
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        }));
        await DB_1.default.table("attendance_records").insert(absentRecords);
    }
    async closeSession(sessionId) {
        await DB_1.default.from("attendance_sessions")
            .where("id", sessionId)
            .update({
            is_active: false,
            updated_at: (0, dayjs_1.default)().valueOf()
        });
    }
}
exports.default = new AttendanceService();
//# sourceMappingURL=AttendanceService.js.map