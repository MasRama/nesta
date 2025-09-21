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
    async getTeacherAttendanceSessions(teacherUserId, date, subjectId, classId) {
        let query = DB_1.default.from("attendance_sessions as as")
            .leftJoin("subjects as s", "as.subject_id", "s.id")
            .leftJoin("classes as c", "as.class_id", "c.id")
            .where("as.teacher_id", teacherUserId);
        if (date) {
            query = query.where("as.attendance_date", date);
        }
        else {
            query = query.where("as.attendance_date", (0, dayjs_1.default)().format('YYYY-MM-DD'));
        }
        if (subjectId) {
            query = query.where("as.subject_id", subjectId);
        }
        if (classId) {
            query = query.where("as.class_id", classId);
        }
        const sessions = await query.select("as.*", "s.nama as subject_name", "s.kode as subject_code", "c.name as class_name", "c.grade_level").orderBy("as.created_at", "desc");
        for (const session of sessions) {
            const attendanceRecords = await DB_1.default.from("attendance_records as ar")
                .leftJoin("users as u", "ar.student_id", "u.id")
                .leftJoin("students as st", "u.id", "st.user_id")
                .where("ar.attendance_session_id", session.id)
                .select("ar.*", "u.name as student_name", "st.nipd as student_number", "st.kelas as student_class")
                .orderBy("u.name");
            session.attendance_records = attendanceRecords;
            session.total_present = attendanceRecords.filter(r => r.status === 'present').length;
            session.total_absent = attendanceRecords.filter(r => r.status === 'absent').length;
            session.total_late = attendanceRecords.filter(r => r.status === 'late').length;
            session.total_excused = attendanceRecords.filter(r => r.status === 'excused').length;
        }
        return sessions;
    }
    async getClassStudentsForAttendance(classId, subjectId, date) {
        const targetDate = date || (0, dayjs_1.default)().format('YYYY-MM-DD');
        const students = await DB_1.default.from("student_classes as sc")
            .join("students as st", "sc.student_id", "st.user_id")
            .join("users as u", "st.user_id", "u.id")
            .where("sc.class_id", classId)
            .where("sc.is_active", true)
            .where("st.is_active", true)
            .select("st.*", "u.name as student_name", "u.id as user_id")
            .orderBy("st.nipd");
        for (const student of students) {
            let attendanceQuery = DB_1.default.from("attendance_records as ar")
                .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
                .where("ar.student_id", student.user_id)
                .where("as.attendance_date", targetDate);
            if (subjectId) {
                attendanceQuery = attendanceQuery.where("as.subject_id", subjectId);
            }
            const attendanceRecord = await attendanceQuery
                .select("ar.*", "as.subject_id")
                .first();
            student.attendance_status = attendanceRecord?.status || 'not_marked';
            student.attendance_id = attendanceRecord?.id || null;
            student.attendance_notes = attendanceRecord?.notes || null;
            student.scanned_at = attendanceRecord?.scanned_at || null;
        }
        return students;
    }
    async manualAttendance(studentId, sessionId, status, notes, _teacherUserId) {
        try {
            const session = await DB_1.default.from("attendance_sessions")
                .where("id", sessionId)
                .first();
            if (!session) {
                return { success: false, message: "Sesi absensi tidak ditemukan" };
            }
            const existingRecord = await DB_1.default.from("attendance_records")
                .where("attendance_session_id", sessionId)
                .where("student_id", studentId)
                .first();
            let attendanceRecord;
            if (existingRecord) {
                await DB_1.default.from("attendance_records")
                    .where("id", existingRecord.id)
                    .update({
                    status,
                    notes,
                    updated_at: (0, dayjs_1.default)().valueOf()
                });
                attendanceRecord = await DB_1.default.from("attendance_records")
                    .where("id", existingRecord.id)
                    .first();
            }
            else {
                attendanceRecord = {
                    id: (0, crypto_1.randomUUID)(),
                    attendance_session_id: sessionId,
                    student_id: studentId,
                    status,
                    notes,
                    scanned_at: status === 'present' ? new Date() : null,
                    created_at: (0, dayjs_1.default)().valueOf(),
                    updated_at: (0, dayjs_1.default)().valueOf()
                };
                await DB_1.default.table("attendance_records").insert(attendanceRecord);
            }
            const student = await DB_1.default.from("users")
                .where("id", studentId)
                .first();
            return {
                success: true,
                message: `Absensi ${student?.name || 'siswa'} berhasil ${existingRecord ? 'diperbarui' : 'dicatat'} sebagai ${status}`,
                attendance: attendanceRecord
            };
        }
        catch (error) {
            console.error("Error in manual attendance:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat mengelola absensi manual"
            };
        }
    }
    async updateAttendanceRecord(attendanceId, status, notes) {
        try {
            const existingRecord = await DB_1.default.from("attendance_records")
                .where("id", attendanceId)
                .first();
            if (!existingRecord) {
                return { success: false, message: "Record absensi tidak ditemukan" };
            }
            await DB_1.default.from("attendance_records")
                .where("id", attendanceId)
                .update({
                status,
                notes,
                updated_at: (0, dayjs_1.default)().valueOf()
            });
            const updatedRecord = await DB_1.default.from("attendance_records")
                .where("id", attendanceId)
                .first();
            return {
                success: true,
                message: "Record absensi berhasil diperbarui",
                attendance: updatedRecord
            };
        }
        catch (error) {
            console.error("Error updating attendance record:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat memperbarui record absensi"
            };
        }
    }
    async getTeacherAttendanceStats(teacherUserId, period, subjectId, classId) {
        try {
            let startDate;
            let endDate;
            const today = (0, dayjs_1.default)();
            switch (period) {
                case 'week':
                    startDate = today.startOf('week').format('YYYY-MM-DD');
                    endDate = today.endOf('week').format('YYYY-MM-DD');
                    break;
                case 'month':
                    startDate = today.startOf('month').format('YYYY-MM-DD');
                    endDate = today.endOf('month').format('YYYY-MM-DD');
                    break;
                case 'today':
                default:
                    startDate = today.format('YYYY-MM-DD');
                    endDate = today.format('YYYY-MM-DD');
                    break;
            }
            let query = DB_1.default.from("attendance_sessions as as")
                .leftJoin("attendance_records as ar", "as.id", "ar.attendance_session_id")
                .leftJoin("subjects as s", "as.subject_id", "s.id")
                .leftJoin("classes as c", "as.class_id", "c.id")
                .where("as.teacher_id", teacherUserId)
                .whereBetween("as.attendance_date", [startDate, endDate]);
            if (subjectId) {
                query = query.where("as.subject_id", subjectId);
            }
            if (classId) {
                query = query.where("as.class_id", classId);
            }
            const overallStats = await query.clone()
                .select("ar.status")
                .count("* as count")
                .groupBy("ar.status");
            const subjectStats = await query.clone()
                .select("s.nama as subject_name", "ar.status")
                .count("* as count")
                .groupBy("s.nama", "ar.status");
            const classStats = await query.clone()
                .select("c.name as class_name", "ar.status")
                .count("* as count")
                .groupBy("c.name", "ar.status");
            const dailyStats = await query.clone()
                .select("as.attendance_date", "ar.status")
                .count("* as count")
                .groupBy("as.attendance_date", "ar.status")
                .orderBy("as.attendance_date");
            const frequentAbsences = await DB_1.default.from("attendance_records as ar")
                .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
                .join("users as u", "ar.student_id", "u.id")
                .join("students as st", "u.id", "st.user_id")
                .where("as.teacher_id", teacherUserId)
                .where("ar.status", 'absent')
                .whereBetween("as.attendance_date", [startDate, endDate])
                .select("u.name as student_name", "st.nipd as student_number")
                .count("* as absent_count")
                .groupBy("u.id", "u.name", "st.nipd")
                .having("absent_count", ">=", 3)
                .orderBy("absent_count", "desc");
            return {
                period: period || 'today',
                date_range: { start: startDate, end: endDate },
                overall: overallStats.reduce((acc, stat) => {
                    acc[stat.status] = stat.count;
                    return acc;
                }, {}),
                by_subject: this.groupStatsByCategory(subjectStats, 'subject_name'),
                by_class: this.groupStatsByCategory(classStats, 'class_name'),
                daily: this.groupDailyStats(dailyStats),
                frequent_absences: frequentAbsences
            };
        }
        catch (error) {
            console.error("Error getting teacher attendance stats:", error);
            throw error;
        }
    }
    groupStatsByCategory(stats, categoryField) {
        const grouped = {};
        stats.forEach(stat => {
            const category = stat[categoryField];
            if (!grouped[category]) {
                grouped[category] = {};
            }
            grouped[category][stat.status] = stat.count;
        });
        return grouped;
    }
    groupDailyStats(stats) {
        const grouped = {};
        stats.forEach(stat => {
            const date = stat.attendance_date;
            if (!grouped[date]) {
                grouped[date] = {};
            }
            grouped[date][stat.status] = stat.count;
        });
        return grouped;
    }
    async exportAttendanceData(classId, subjectId, startDate, endDate, format) {
        try {
            const start = startDate || (0, dayjs_1.default)().startOf('month').format('YYYY-MM-DD');
            const end = endDate || (0, dayjs_1.default)().endOf('month').format('YYYY-MM-DD');
            let query = DB_1.default.from("attendance_sessions as as")
                .leftJoin("attendance_records as ar", "as.id", "ar.attendance_session_id")
                .leftJoin("users as u", "ar.student_id", "u.id")
                .leftJoin("students as st", "u.id", "st.user_id")
                .leftJoin("subjects as s", "as.subject_id", "s.id")
                .leftJoin("classes as c", "as.class_id", "c.id")
                .where("as.class_id", classId)
                .whereBetween("as.attendance_date", [start, end]);
            if (subjectId) {
                query = query.where("as.subject_id", subjectId);
            }
            const data = await query.select("as.attendance_date", "s.nama as subject_name", "c.name as class_name", "u.name as student_name", "st.nipd as student_number", "ar.status", "ar.scanned_at", "ar.notes").orderBy("as.attendance_date").orderBy("u.name");
            if (format === 'excel') {
                return {
                    headers: [
                        'Tanggal', 'Mata Pelajaran', 'Kelas', 'Nama Siswa',
                        'NIPD', 'Status', 'Waktu Scan', 'Catatan'
                    ],
                    data: data.map(row => [
                        row.attendance_date,
                        row.subject_name,
                        row.class_name,
                        row.student_name,
                        row.student_number,
                        row.status,
                        row.scanned_at ? (0, dayjs_1.default)(row.scanned_at).format('HH:mm:ss') : '',
                        row.notes || ''
                    ])
                };
            }
            return data;
        }
        catch (error) {
            console.error("Error exporting attendance data:", error);
            throw error;
        }
    }
}
exports.default = new AttendanceService();
//# sourceMappingURL=AttendanceService.js.map