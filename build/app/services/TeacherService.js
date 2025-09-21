"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const crypto_1 = require("crypto");
const Authenticate_1 = __importDefault(require("./Authenticate"));
const dayjs_1 = __importDefault(require("dayjs"));
class TeacherService {
    async getTeachers(page = 1, limit = 10, search) {
        let query = DB_1.default.from('teachers').select('*').where('is_active', true);
        if (search) {
            query = query.where(function () {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('nip', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`);
            });
        }
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = totalResult?.count || 0;
        const offset = (page - 1) * limit;
        const teachers = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
        return {
            data: teachers,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }
    async getTeacherById(id) {
        return await DB_1.default.from('teachers').where('id', id).where('is_active', true).first();
    }
    async getTeacherByIdForEdit(id) {
        return await DB_1.default.from('teachers').where('id', id).first();
    }
    async getTeacherByNIP(nip) {
        return await DB_1.default.from('teachers').where('nip', nip).first();
    }
    async getTeacherByEmail(email) {
        return await DB_1.default.from('teachers').where('email', email).first();
    }
    async createTeacher(data) {
        const teacherId = (0, crypto_1.randomUUID)();
        const userId = (0, crypto_1.randomUUID)();
        const hashedPasswordForTeacher = this.hashPassword(data.password);
        const hashedPasswordForUser = await Authenticate_1.default.hash(data.password);
        const now = Date.now();
        const teacherData = {
            id: teacherId,
            nip: data.nip,
            nama: data.nama,
            email: data.email,
            password: hashedPasswordForTeacher,
            phone: data.phone || null,
            user_id: userId,
            is_active: true,
            created_at: now,
            updated_at: now
        };
        const userData = {
            id: userId,
            name: data.nama,
            email: data.email,
            phone: data.phone || null,
            password: hashedPasswordForUser,
            role: 'teacher',
            teacher_id: teacherId,
            is_verified: true,
            is_admin: false,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        return await DB_1.default.transaction(async (trx) => {
            const existingTeacherByNIP = await trx.from('teachers')
                .where('nip', data.nip)
                .first();
            if (existingTeacherByNIP) {
                const { password, ...teacherWithoutPassword } = existingTeacherByNIP;
                return teacherWithoutPassword;
            }
            const existingTeacherByEmail = await trx.from('teachers')
                .where('email', data.email)
                .first();
            if (existingTeacherByEmail) {
                const { password, ...teacherWithoutPassword } = existingTeacherByEmail;
                return teacherWithoutPassword;
            }
            const existingUser = await trx.from('users')
                .where('email', data.email)
                .first();
            if (existingUser) {
                throw new Error('Email sudah digunakan oleh user lain');
            }
            await trx.from('users').insert(userData);
            await trx.from('teachers').insert(teacherData);
            const { password, ...teacherWithoutPassword } = teacherData;
            return teacherWithoutPassword;
        });
    }
    async updateTeacher(id, data) {
        const updateData = {
            ...data,
            updated_at: Date.now()
        };
        if (data.password) {
            updateData.password = this.hashPassword(data.password);
        }
        await DB_1.default.from('teachers').where('id', id).update(updateData);
        const updatedTeacher = await this.getTeacherByIdForEdit(id);
        if (updatedTeacher) {
            const { password, ...teacherWithoutPassword } = updatedTeacher;
            return teacherWithoutPassword;
        }
        return null;
    }
    async deleteTeacher(id) {
        await DB_1.default.from('teachers').where('id', id).update({
            is_active: false,
            updated_at: Date.now()
        });
    }
    async getTeacherClassesAndSubjects(userId) {
        try {
            const teacher = await DB_1.default.from('teachers')
                .where('user_id', userId)
                .where('is_active', true)
                .first();
            if (!teacher) {
                return [];
            }
            const assignments = await DB_1.default.from('subject_classes as sc')
                .join('classes as c', 'sc.class_id', 'c.id')
                .join('subjects as s', 'sc.subject_id', 's.id')
                .leftJoin('teachers as t', 't.id', 'sc.teacher_id')
                .select('c.id as class_id', 'c.name as class_name', 'c.grade_level', 'c.academic_year', 'c.description as class_description', 'c.max_students', 's.id as subject_id', 's.nama as subject_name', 's.kode as subject_code', 's.deskripsi as subject_description', 'sc.day', 'sc.start_time', 'sc.end_time', 'sc.notes', 'sc.is_active as assignment_active', 't.nama as teacher_name', 't.nip as teacher_nip')
                .where('sc.teacher_id', teacher.id)
                .where('sc.is_active', true)
                .where('s.is_active', true)
                .orderBy('c.grade_level')
                .orderBy('c.name')
                .orderBy('sc.day')
                .orderBy('sc.start_time');
            const classesMap = new Map();
            assignments.forEach(assignment => {
                const classId = assignment.class_id;
                if (!classesMap.has(classId)) {
                    classesMap.set(classId, {
                        id: assignment.class_id,
                        name: assignment.class_name,
                        grade_level: assignment.grade_level,
                        academic_year: assignment.academic_year,
                        description: assignment.class_description,
                        max_students: assignment.max_students,
                        subjects: []
                    });
                }
                const classData = classesMap.get(classId);
                classData.subjects.push({
                    id: assignment.subject_id,
                    name: assignment.subject_name,
                    code: assignment.subject_code,
                    description: assignment.subject_description,
                    day: assignment.day,
                    start_time: assignment.start_time,
                    end_time: assignment.end_time,
                    notes: assignment.notes
                });
            });
            return Array.from(classesMap.values());
        }
        catch (error) {
            console.error('Error getting teacher classes and subjects:', error);
            throw error;
        }
    }
    async getCurrentTeachingSchedule(userId) {
        try {
            const today = new Date();
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentDay = dayNames[today.getDay()];
            const currentTime = today.toTimeString().slice(0, 5);
            const currentSchedule = await DB_1.default.from('subject_classes as sc')
                .join('classes as c', 'sc.class_id', 'c.id')
                .join('subjects as s', 'sc.subject_id', 's.id')
                .select('c.id as class_id', 'c.name as class_name', 's.id as subject_id', 's.nama as subject_name', 's.kode as subject_code', 'sc.day', 'sc.start_time', 'sc.end_time')
                .where('sc.teacher_id', userId)
                .where('sc.day', currentDay)
                .where('sc.start_time', '<=', currentTime)
                .where('sc.end_time', '>=', currentTime)
                .where('sc.is_active', true)
                .first();
            return currentSchedule;
        }
        catch (error) {
            console.error('Error getting current teaching schedule:', error);
            throw error;
        }
    }
    hashPassword(password) {
        const salt = 'netsa_teacher_salt';
        return (0, crypto_1.pbkdf2Sync)(password, salt, 10000, 64, 'sha512').toString('hex');
    }
    validateTeacherData(data, row = 0) {
        const errors = [];
        const essentialFields = [
            { field: 'nip', label: 'NIP' },
            { field: 'nama', label: 'Nama' },
            { field: 'email', label: 'Email' }
        ];
        for (const { field, label } of essentialFields) {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push({
                    row,
                    field,
                    message: `${label} wajib diisi`,
                    value: data[field]
                });
            }
        }
        if (data.nip && data.nip.toString().trim() !== '') {
            const nip = data.nip.toString().trim();
            if (!/^\d+$/.test(nip)) {
                errors.push({
                    row,
                    field: 'nip',
                    message: 'NIP harus berupa angka',
                    value: data.nip
                });
            }
        }
        if (data.email && data.email.toString().trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email.toString().trim())) {
                errors.push({
                    row,
                    field: 'email',
                    message: 'Format email tidak valid',
                    value: data.email
                });
            }
        }
        if (data.phone && data.phone.toString().trim() !== '') {
            const phone = data.phone.toString().trim();
            if (!/^[0-9+\-\s()]+$/.test(phone)) {
                errors.push({
                    row,
                    field: 'phone',
                    message: 'Format nomor telepon tidak valid',
                    value: data.phone
                });
            }
        }
        if (data.status && data.status.toString().trim() !== '') {
            const validStatuses = ['active', 'inactive'];
            if (!validStatuses.includes(data.status.toString().trim())) {
                errors.push({
                    row,
                    field: 'status',
                    message: 'Status harus "active" atau "inactive"',
                    value: data.status
                });
            }
        }
        return errors;
    }
    async getCurrentActiveSchedule(teacherUserId) {
        try {
            const teacher = await DB_1.default.from('teachers')
                .where('user_id', teacherUserId)
                .where('is_active', true)
                .first();
            if (!teacher) {
                return {
                    hasActiveSchedule: false,
                    message: "Data guru tidak ditemukan"
                };
            }
            const now = new Date();
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentDay = dayNames[now.getDay()];
            const currentTime = now.toTimeString().slice(0, 5);
            const schedule = await DB_1.default.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacher.id)
                .where("sc.day", currentDay)
                .where("sc.start_time", "<=", currentTime)
                .where("sc.end_time", ">=", currentTime)
                .where("s.is_active", true)
                .select("sc.*", "s.id as subject_id", "s.nama as subject_name", "s.kode as subject_code", "s.deskripsi as subject_description", "c.name as class_name")
                .first();
            if (!schedule) {
                return {
                    hasActiveSchedule: false,
                    message: `Tidak ada jadwal mengajar saat ini (${currentDay}, ${currentTime})`
                };
            }
            return {
                hasActiveSchedule: true,
                schedule: {
                    ...schedule,
                    current_day: currentDay,
                    current_time: currentTime
                },
                message: `Sedang mengajar ${schedule.subject_name} di kelas ${schedule.kelas}`
            };
        }
        catch (error) {
            console.error("Error getting current active schedule:", error);
            return {
                hasActiveSchedule: false,
                message: "Terjadi kesalahan saat mengambil jadwal"
            };
        }
    }
    async getTeacherSubjects(teacherUserId) {
        try {
            const teacher = await DB_1.default.from('teachers')
                .where('user_id', teacherUserId)
                .where('is_active', true)
                .first();
            if (!teacher) {
                return [];
            }
            const subjectsWithSchedule = await DB_1.default.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacher.id)
                .where("s.is_active", true)
                .select("s.id", "s.nama", "s.kode", "s.deskripsi", "sc.day", "sc.start_time", "sc.end_time", "c.name as kelas")
                .orderBy("s.nama")
                .orderBy("sc.day")
                .orderBy("sc.start_time");
            const subjectsMap = new Map();
            subjectsWithSchedule.forEach(item => {
                const subjectId = item.id;
                if (!subjectsMap.has(subjectId)) {
                    subjectsMap.set(subjectId, {
                        id: item.id,
                        nama: item.nama,
                        kode: item.kode,
                        deskripsi: item.deskripsi,
                        schedules: []
                    });
                }
                if (item.day && item.start_time && item.end_time) {
                    subjectsMap.get(subjectId).schedules.push({
                        day: item.day,
                        start_time: item.start_time,
                        end_time: item.end_time,
                        kelas: item.kelas
                    });
                }
            });
            return Array.from(subjectsMap.values());
        }
        catch (error) {
            console.error("Error getting teacher subjects:", error);
            return [];
        }
    }
    async getTeacherWeeklySchedule(teacherUserId) {
        try {
            const teacher = await DB_1.default.from('teachers')
                .where('user_id', teacherUserId)
                .where('is_active', true)
                .first();
            if (!teacher) {
                return [];
            }
            const schedule = await DB_1.default.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacher.id)
                .where("s.is_active", true)
                .select("sc.day", "sc.start_time", "sc.end_time", "c.name as kelas", "s.id as subject_id", "s.nama as subject_name", "s.kode as subject_code")
                .orderBy("sc.day")
                .orderBy("sc.start_time");
            const groupedSchedule = schedule.reduce((acc, item) => {
                const day = item.day;
                if (!acc[day]) {
                    acc[day] = [];
                }
                acc[day].push(item);
                return acc;
            }, {});
            const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const result = dayOrder.map(day => ({
                day,
                schedules: groupedSchedule[day] || []
            }));
            return result;
        }
        catch (error) {
            console.error("Error getting teacher weekly schedule:", error);
            return [];
        }
    }
    async getTodaySchedules(teacherUserId) {
        try {
            const teacher = await DB_1.default.from('teachers')
                .where('user_id', teacherUserId)
                .where('is_active', true)
                .first();
            if (!teacher) {
                return {
                    hasSchedules: false,
                    schedules: [],
                    message: "Data guru tidak ditemukan"
                };
            }
            const now = new Date();
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentDay = dayNames[now.getDay()];
            const schedules = await DB_1.default.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacher.id)
                .where("sc.day", currentDay)
                .where("s.is_active", true)
                .select("sc.id as schedule_id", "s.id as subject_id", "s.nama as subject_name", "s.kode as subject_code", "s.deskripsi as subject_description", "sc.day", "sc.start_time", "sc.end_time", "c.id as class_id", "c.name as class_name")
                .orderBy("sc.start_time");
            if (schedules.length === 0) {
                return {
                    hasSchedules: false,
                    schedules: [],
                    message: `Anda tidak memiliki jadwal mengajar hari ini (${currentDay})`
                };
            }
            const formattedSchedules = schedules.map(schedule => ({
                schedule_id: schedule.schedule_id,
                subject_id: schedule.subject_id,
                subject_name: schedule.subject_name,
                subject_code: schedule.subject_code,
                subject_description: schedule.subject_description,
                day: schedule.day,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                class_id: schedule.class_id,
                class_name: schedule.class_name,
                display_text: `${schedule.subject_name} - ${schedule.start_time}-${schedule.end_time} (${schedule.class_name})`
            }));
            return {
                hasSchedules: true,
                schedules: formattedSchedules,
                message: `Ditemukan ${schedules.length} jadwal mengajar hari ini`
            };
        }
        catch (error) {
            console.error("Error getting today schedules:", error);
            return {
                hasSchedules: false,
                schedules: [],
                message: "Terjadi kesalahan saat mengambil jadwal hari ini"
            };
        }
    }
    async getTeachersBySubject(subjectId) {
        try {
            const teachers = await DB_1.default.from("teacher_subjects as ts")
                .join("teachers as t", "ts.teacher_id", "t.id")
                .where("ts.subject_id", subjectId)
                .where("ts.is_active", true)
                .where("t.is_active", true)
                .select("t.id", "t.nama", "t.nip", "t.email", "t.phone")
                .orderBy("t.nama");
            return teachers;
        }
        catch (error) {
            console.error("Error getting teachers by subject:", error);
            return [];
        }
    }
    async isTeacherAssignedToSubject(teacherId, subjectId) {
        try {
            const assignment = await DB_1.default.from("teacher_subjects")
                .where("teacher_id", teacherId)
                .where("subject_id", subjectId)
                .where("is_active", true)
                .first();
            return !!assignment;
        }
        catch (error) {
            console.error("Error checking teacher-subject assignment:", error);
            return false;
        }
    }
}
exports.default = new TeacherService();
//# sourceMappingURL=TeacherService.js.map