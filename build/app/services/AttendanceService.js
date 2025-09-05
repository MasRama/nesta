"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
class AttendanceService {
    async generateQRCode(classId, teacherId, durationMinutes = 30) {
        const token = (0, crypto_1.randomUUID)();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
        const session = {
            id: (0, crypto_1.randomUUID)(),
            class_id: classId,
            teacher_id: teacherId,
            attendance_date: (0, dayjs_1.default)().format('YYYY-MM-DD'),
            qr_token: token,
            starts_at: now,
            expires_at: expiresAt,
            is_active: true,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        await DB_1.default.table("attendance_sessions").insert(session);
        const qrData = JSON.stringify({
            token,
            session_id: session.id,
            class_id: classId,
            timestamp: now.getTime()
        });
        const qrCodeDataURL = await qrcode_1.default.toDataURL(qrData);
        return { session, qrCodeDataURL };
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
            .where("attendance_sessions.class_id", classId);
        if (date) {
            query = query.where("attendance_sessions.attendance_date", date);
        }
        return query.select("attendance_sessions.*", "attendance_records.student_id", "attendance_records.status", "attendance_records.scanned_at", "users.name as student_name", "users.student_id as student_number");
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