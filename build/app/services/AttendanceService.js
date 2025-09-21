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
            const trimmedQrData = qrData.trim();
            if (!trimmedQrData) {
                return {
                    success: false,
                    message: "QR code tidak boleh kosong"
                };
            }
            let student;
            let nipd;
            let namaLengkap = null;
            if (trimmedQrData.includes('_')) {
                const qrParts = trimmedQrData.split('_');
                if (qrParts.length < 2) {
                    return {
                        success: false,
                        message: "Format QR code tidak valid. Format yang didukung: NIPD_Nama Lengkap atau NIPD saja"
                    };
                }
                nipd = qrParts[0].trim();
                namaLengkap = qrParts.slice(1).join('_').trim();
                student = await DB_1.default.from("students")
                    .where("nipd", nipd)
                    .where("nama", namaLengkap)
                    .where("is_active", true)
                    .first();
                if (!student) {
                    return {
                        success: false,
                        message: `Siswa dengan NIPD ${nipd} dan nama ${namaLengkap} tidak ditemukan atau tidak aktif`
                    };
                }
            }
            else {
                nipd = trimmedQrData;
                student = await DB_1.default.from("students")
                    .where("nipd", nipd)
                    .where("is_active", true)
                    .first();
                if (!student) {
                    return {
                        success: false,
                        message: `Siswa dengan NIPD ${nipd} tidak ditemukan atau tidak aktif`
                    };
                }
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
            const formatUsed = namaLengkap ? "NIPD + Nama" : "NIPD";
            const successMessage = `Absensi ${student.nama} (${student.nipd}) berhasil dicatat [Format: ${formatUsed}]`;
            return {
                success: true,
                message: successMessage,
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
    async getStudentAttendanceHistory(studentId, options = {}) {
        if (!studentId) {
            throw new Error("Student ID is required");
        }
        const { page = 1, limit = 20, subjectId, startDate, endDate, classId } = options;
        const validatedPage = Math.max(1, Math.floor(page));
        const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
        const offset = (validatedPage - 1) * validatedLimit;
        if (startDate && !this.isValidDate(startDate)) {
            throw new Error("Invalid start date format. Use YYYY-MM-DD");
        }
        if (endDate && !this.isValidDate(endDate)) {
            throw new Error("Invalid end date format. Use YYYY-MM-DD");
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            throw new Error("Start date cannot be after end date");
        }
        let query = DB_1.default.from("attendance_records as ar")
            .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
            .join("classes as c", "as.class_id", "c.id")
            .leftJoin("subjects as s", "as.subject_id", "s.id")
            .where("ar.student_id", studentId);
        if (subjectId) {
            query = query.where("as.subject_id", subjectId);
        }
        if (classId) {
            query = query.where("as.class_id", classId);
        }
        if (startDate) {
            query = query.where("as.attendance_date", ">=", startDate);
        }
        if (endDate) {
            query = query.where("as.attendance_date", "<=", endDate);
        }
        const totalQuery = query.clone().count("* as count").first();
        const total = await totalQuery;
        const data = await query
            .select("ar.id", "ar.status", "ar.scanned_at", "ar.notes", "ar.created_at", "as.attendance_date", "as.starts_at", "as.expires_at", "c.name as class_name", "c.grade_level", "s.nama as subject_name", "s.kode as subject_code")
            .orderBy("as.attendance_date", "desc")
            .orderBy("as.starts_at", "desc")
            .limit(validatedLimit)
            .offset(offset);
        return {
            data,
            pagination: {
                page: validatedPage,
                limit: validatedLimit,
                total: total?.count || 0,
                totalPages: Math.ceil((total?.count || 0) / validatedLimit)
            }
        };
    }
    async getStudentAttendanceStatsBySubject(studentId, options = {}) {
        const { startDate, endDate, classId } = options;
        let query = DB_1.default.from("attendance_records as ar")
            .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
            .join("subjects as s", "as.subject_id", "s.id")
            .where("ar.student_id", studentId);
        if (classId) {
            query = query.where("as.class_id", classId);
        }
        if (startDate) {
            query = query.where("as.attendance_date", ">=", startDate);
        }
        if (endDate) {
            query = query.where("as.attendance_date", "<=", endDate);
        }
        const stats = await query
            .select("s.id as subject_id", "s.nama as subject_name", "s.kode as subject_code", "ar.status")
            .count("* as count")
            .groupBy("s.id", "s.nama", "s.kode", "ar.status")
            .orderBy("s.nama");
        const groupedStats = {};
        stats.forEach(stat => {
            const subjectKey = stat.subject_id;
            if (!groupedStats[subjectKey]) {
                groupedStats[subjectKey] = {
                    subject_id: stat.subject_id,
                    subject_name: stat.subject_name,
                    subject_code: stat.subject_code,
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    percentage: 0
                };
            }
            groupedStats[subjectKey][stat.status] = stat.count;
            groupedStats[subjectKey].total += stat.count;
        });
        Object.values(groupedStats).forEach((subject) => {
            if (subject.total > 0) {
                subject.percentage = Math.round((subject.present / subject.total) * 100);
            }
        });
        return Object.values(groupedStats);
    }
    async getStudentSubjects(studentId) {
        if (!studentId) {
            throw new Error("Student ID is required");
        }
        return DB_1.default.from("student_classes as sc")
            .join("subject_classes as sbc", "sc.class_id", "sbc.class_id")
            .join("subjects as s", "sbc.subject_id", "s.id")
            .where("sc.student_id", studentId)
            .where("sc.is_active", true)
            .where("sbc.is_active", true)
            .where("s.is_active", true)
            .select("s.id", "s.nama", "s.kode", "s.deskripsi")
            .groupBy("s.id", "s.nama", "s.kode", "s.deskripsi")
            .orderBy("s.nama");
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
    async getParentChildren(parentId) {
        if (!parentId) {
            throw new Error("Parent ID is required");
        }
        return DB_1.default.from("parent_student_relations as psr")
            .join("users as u", "psr.student_id", "u.id")
            .leftJoin("students as s", "u.id", "s.user_id")
            .where("psr.parent_id", parentId)
            .select("u.id as user_id", "u.name", "u.email", "s.id as student_id", "s.nipd", "s.nama as student_name", "s.kelas", "psr.relationship", "psr.is_primary_contact")
            .orderBy("psr.is_primary_contact", "desc")
            .orderBy("u.name");
    }
    async getParentChildrenAttendanceHistory(parentId, options = {}) {
        if (!parentId) {
            throw new Error("Parent ID is required");
        }
        const { page = 1, limit = 20, subjectId, startDate, endDate, classId, childId } = options;
        const validatedPage = Math.max(1, Math.floor(page));
        const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
        const offset = (validatedPage - 1) * validatedLimit;
        if (startDate && !this.isValidDate(startDate)) {
            throw new Error("Invalid start date format. Use YYYY-MM-DD");
        }
        if (endDate && !this.isValidDate(endDate)) {
            throw new Error("Invalid end date format. Use YYYY-MM-DD");
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            throw new Error("Start date cannot be after end date");
        }
        const children = await this.getParentChildren(parentId);
        if (children.length === 0) {
            return {
                data: [],
                pagination: {
                    page: validatedPage,
                    limit: validatedLimit,
                    total: 0,
                    totalPages: 0
                },
                children: []
            };
        }
        const childUserIds = children.map(child => child.user_id);
        let query = DB_1.default.from("attendance_records as ar")
            .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
            .join("classes as c", "as.class_id", "c.id")
            .leftJoin("subjects as s", "as.subject_id", "s.id")
            .join("users as u", "ar.student_id", "u.id")
            .leftJoin("students as st", "u.id", "st.user_id")
            .whereIn("ar.student_id", childUserIds);
        if (childId) {
            query = query.where("ar.student_id", childId);
        }
        if (subjectId) {
            query = query.where("as.subject_id", subjectId);
        }
        if (classId) {
            query = query.where("as.class_id", classId);
        }
        if (startDate) {
            query = query.where("as.attendance_date", ">=", startDate);
        }
        if (endDate) {
            query = query.where("as.attendance_date", "<=", endDate);
        }
        const totalQuery = query.clone().count("* as count").first();
        const total = await totalQuery;
        const data = await query
            .select("ar.id", "ar.status", "ar.scanned_at", "ar.notes", "ar.created_at", "as.attendance_date", "as.starts_at", "as.expires_at", "c.name as class_name", "c.grade_level", "s.nama as subject_name", "s.kode as subject_code", "u.id as student_user_id", "u.name as student_name", "st.nipd as student_nipd", "st.kelas as student_class")
            .orderBy("as.attendance_date", "desc")
            .orderBy("u.name")
            .orderBy("as.starts_at", "desc")
            .limit(validatedLimit)
            .offset(offset);
        return {
            data,
            pagination: {
                page: validatedPage,
                limit: validatedLimit,
                total: total?.count || 0,
                totalPages: Math.ceil((total?.count || 0) / validatedLimit)
            },
            children
        };
    }
    async getParentChildrenAttendanceStats(parentId, options = {}) {
        if (!parentId) {
            throw new Error("Parent ID is required");
        }
        const { startDate, endDate, classId, childId } = options;
        if (startDate && !this.isValidDate(startDate)) {
            throw new Error("Invalid start date format. Use YYYY-MM-DD");
        }
        if (endDate && !this.isValidDate(endDate)) {
            throw new Error("Invalid end date format. Use YYYY-MM-DD");
        }
        const children = await this.getParentChildren(parentId);
        if (children.length === 0) {
            return {
                combined: { present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 },
                per_child: [],
                per_subject: []
            };
        }
        const childUserIds = children.map(child => child.user_id);
        let query = DB_1.default.from("attendance_records as ar")
            .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
            .join("users as u", "ar.student_id", "u.id")
            .leftJoin("students as st", "u.id", "st.user_id")
            .leftJoin("subjects as s", "as.subject_id", "s.id")
            .whereIn("ar.student_id", childUserIds);
        if (childId) {
            query = query.where("ar.student_id", childId);
        }
        if (classId) {
            query = query.where("as.class_id", classId);
        }
        if (startDate) {
            query = query.where("as.attendance_date", ">=", startDate);
        }
        if (endDate) {
            query = query.where("as.attendance_date", "<=", endDate);
        }
        const combinedStats = await query.clone()
            .select("ar.status")
            .count("* as count")
            .groupBy("ar.status");
        const perChildStats = await query.clone()
            .select("u.id as student_id", "u.name as student_name", "st.nipd", "st.kelas", "ar.status")
            .count("* as count")
            .groupBy("u.id", "u.name", "st.nipd", "st.kelas", "ar.status")
            .orderBy("u.name");
        const perSubjectStats = await query.clone()
            .select("s.id as subject_id", "s.nama as subject_name", "s.kode as subject_code", "ar.status")
            .count("* as count")
            .groupBy("s.id", "s.nama", "s.kode", "ar.status")
            .orderBy("s.nama");
        const combined = combinedStats.reduce((acc, stat) => {
            acc[stat.status] = stat.count;
            acc.total += stat.count;
            return acc;
        }, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
        combined.percentage = combined.total > 0 ? Math.round((combined.present / combined.total) * 100) : 0;
        const perChildMap = new Map();
        perChildStats.forEach((stat) => {
            const key = stat.student_id;
            if (!perChildMap.has(key)) {
                perChildMap.set(key, {
                    student_id: stat.student_id,
                    student_name: stat.student_name,
                    nipd: stat.nipd,
                    kelas: stat.kelas,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0,
                    percentage: 0
                });
            }
            const childStat = perChildMap.get(key);
            childStat[stat.status] = stat.count;
            childStat.total += stat.count;
        });
        const perChild = Array.from(perChildMap.values()).map((child) => {
            child.percentage = child.total > 0 ? Math.round((child.present / child.total) * 100) : 0;
            return child;
        });
        const perSubjectMap = new Map();
        perSubjectStats.forEach((stat) => {
            const key = stat.subject_id;
            if (!perSubjectMap.has(key)) {
                perSubjectMap.set(key, {
                    subject_id: stat.subject_id,
                    subject_name: stat.subject_name,
                    subject_code: stat.subject_code,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0,
                    percentage: 0
                });
            }
            const subjectStat = perSubjectMap.get(key);
            subjectStat[stat.status] = stat.count;
            subjectStat.total += stat.count;
        });
        const perSubject = Array.from(perSubjectMap.values()).map((subject) => {
            subject.percentage = subject.total > 0 ? Math.round((subject.present / subject.total) * 100) : 0;
            return subject;
        });
        return {
            combined,
            per_child: perChild,
            per_subject: perSubject
        };
    }
    async getParentChildrenSubjects(parentId) {
        if (!parentId) {
            throw new Error("Parent ID is required");
        }
        const children = await this.getParentChildren(parentId);
        if (children.length === 0) {
            return [];
        }
        const childUserIds = children.map(child => child.user_id);
        return DB_1.default.from("student_classes as sc")
            .join("subject_classes as sbc", "sc.class_id", "sbc.class_id")
            .join("subjects as s", "sbc.subject_id", "s.id")
            .whereIn("sc.student_id", childUserIds)
            .where("sc.is_active", true)
            .where("sbc.is_active", true)
            .where("s.is_active", true)
            .select("s.id", "s.nama", "s.kode", "s.deskripsi")
            .groupBy("s.id", "s.nama", "s.kode", "s.deskripsi")
            .orderBy("s.nama");
    }
    isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) {
            return false;
        }
        const date = new Date(dateString);
        const timestamp = date.getTime();
        if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
            return false;
        }
        return dateString === date.toISOString().split('T')[0];
    }
}
exports.default = new AttendanceService();
//# sourceMappingURL=AttendanceService.js.map