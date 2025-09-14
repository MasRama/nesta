"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const crypto_1 = require("crypto");
class SubjectService {
    async getSubjects(page = 1, limit = 10, search) {
        let query = DB_1.default.from('subjects').select('*').where('is_active', true);
        if (search) {
            query = query.where(function () {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('kode', 'like', `%${search}%`)
                    .orWhere('deskripsi', 'like', `%${search}%`);
            });
        }
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = totalResult?.count || 0;
        const offset = (page - 1) * limit;
        const subjects = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
        return {
            data: subjects,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }
    async getSubjectById(id) {
        return await DB_1.default.from('subjects').where('id', id).where('is_active', true).first();
    }
    async getSubjectByCode(kode) {
        return await DB_1.default.from('subjects').where('kode', kode).first();
    }
    async createSubject(data) {
        const id = (0, crypto_1.randomUUID)();
        const now = Date.now();
        const subjectData = {
            id,
            ...data,
            is_active: true,
            created_at: now,
            updated_at: now
        };
        return await DB_1.default.transaction(async (trx) => {
            const existingSubject = await trx.from('subjects')
                .where('kode', data.kode)
                .first();
            if (existingSubject) {
                return existingSubject;
            }
            await trx.from('subjects').insert(subjectData);
            return await trx.from('subjects')
                .where('id', id)
                .where('is_active', true)
                .first();
        });
    }
    async updateSubject(id, data) {
        const now = Date.now();
        await DB_1.default.from('subjects')
            .where('id', id)
            .update({
            ...data,
            updated_at: now
        });
        return await this.getSubjectById(id);
    }
    async deleteSubject(id) {
        const now = Date.now();
        return await DB_1.default.from('subjects').where('id', id).update({ is_active: false, updated_at: now });
    }
    async getSubjectTeachers(subjectId) {
        return await DB_1.default.from('teacher_subjects as ts')
            .join('teachers as t', 'ts.teacher_id', 't.id')
            .select('t.*', 'ts.id as assignment_id', 'ts.created_at as assigned_at')
            .where('ts.subject_id', subjectId)
            .where('ts.is_active', true)
            .where('t.is_active', true)
            .orderBy('ts.created_at', 'desc');
    }
    async getTeacherSubjects(teacherId) {
        return await DB_1.default.from('teacher_subjects as ts')
            .join('subjects as s', 'ts.subject_id', 's.id')
            .select('s.*', 'ts.id as assignment_id', 'ts.created_at as assigned_at')
            .where('ts.teacher_id', teacherId)
            .where('ts.is_active', true)
            .where('s.is_active', true)
            .orderBy('ts.created_at', 'desc');
    }
    async assignTeacherToSubject(teacherId, subjectId) {
        const id = (0, crypto_1.randomUUID)();
        const now = Date.now();
        const existing = await DB_1.default.from('teacher_subjects')
            .where('teacher_id', teacherId)
            .where('subject_id', subjectId)
            .first();
        if (existing) {
            if (!existing.is_active) {
                await DB_1.default.from('teacher_subjects')
                    .where('id', existing.id)
                    .update({ is_active: true, updated_at: now });
                return existing;
            }
            throw new Error('Guru sudah ditugaskan ke mata pelajaran ini');
        }
        const assignmentData = {
            id,
            teacher_id: teacherId,
            subject_id: subjectId,
            is_active: true,
            created_at: now,
            updated_at: now
        };
        await DB_1.default.from('teacher_subjects').insert(assignmentData);
        return assignmentData;
    }
    async unassignTeacherFromSubject(teacherId, subjectId) {
        const now = Date.now();
        return await DB_1.default.from('teacher_subjects')
            .where('teacher_id', teacherId)
            .where('subject_id', subjectId)
            .update({ is_active: false, updated_at: now });
    }
    async getAvailableTeachers() {
        return await DB_1.default.from('teachers')
            .select('id', 'nama', 'nip', 'email')
            .where('is_active', true)
            .orderBy('nama', 'asc');
    }
    async getTeachersForModal(subjectId) {
        const allTeachers = await DB_1.default.from('teachers')
            .select('id', 'nama', 'nip', 'email')
            .where('is_active', true)
            .orderBy('nama', 'asc');
        const assignedTeachers = await DB_1.default.from('teacher_subjects')
            .select('teacher_id')
            .where('subject_id', subjectId)
            .where('is_active', true);
        const assignedTeacherIds = new Set(assignedTeachers.map(t => t.teacher_id));
        const teachersWithStatus = allTeachers.map(teacher => ({
            ...teacher,
            isAssigned: assignedTeacherIds.has(teacher.id)
        }));
        return teachersWithStatus;
    }
    async getAvailableClasses() {
        return await DB_1.default.from('classes')
            .select('id', 'name', 'grade_level', 'academic_year')
            .orderBy('grade_level', 'asc')
            .orderBy('name', 'asc');
    }
    async getSubjectClasses(subjectId) {
        return await DB_1.default.from('subject_classes as sc')
            .join('classes as c', 'sc.class_id', 'c.id')
            .leftJoin('users as u', 'sc.teacher_id', 'u.id')
            .select('c.*', 'sc.id as assignment_id', 'sc.teacher_id', 'sc.jam_per_minggu', 'sc.notes', 'sc.created_at as assigned_at', 'u.name as teacher_name')
            .where('sc.subject_id', subjectId)
            .where('sc.is_active', true)
            .orderBy('c.grade_level', 'asc')
            .orderBy('c.name', 'asc');
    }
    async getClassSubjects(classId) {
        return await DB_1.default.from('subject_classes as sc')
            .join('subjects as s', 'sc.subject_id', 's.id')
            .leftJoin('users as u', 'sc.teacher_id', 'u.id')
            .select('s.*', 'sc.id as assignment_id', 'sc.teacher_id', 'sc.jam_per_minggu', 'sc.notes', 'sc.created_at as assigned_at', 'u.name as teacher_name')
            .where('sc.class_id', classId)
            .where('sc.is_active', true)
            .where('s.is_active', true)
            .orderBy('s.nama', 'asc');
    }
    async assignSubjectToClass(data) {
        const id = (0, crypto_1.randomUUID)();
        const now = Date.now();
        const existing = await DB_1.default.from('subject_classes')
            .where('subject_id', data.subject_id)
            .where('class_id', data.class_id)
            .first();
        if (existing) {
            if (!existing.is_active) {
                await DB_1.default.from('subject_classes')
                    .where('id', existing.id)
                    .update({
                    is_active: true,
                    teacher_id: data.teacher_id,
                    jam_per_minggu: data.jam_per_minggu,
                    notes: data.notes,
                    updated_at: now
                });
                return existing;
            }
            throw new Error('Mata pelajaran sudah ditugaskan ke kelas ini');
        }
        const assignmentData = {
            id,
            subject_id: data.subject_id,
            class_id: data.class_id,
            teacher_id: data.teacher_id,
            jam_per_minggu: data.jam_per_minggu,
            notes: data.notes,
            is_active: true,
            created_at: now,
            updated_at: now
        };
        await DB_1.default.from('subject_classes').insert(assignmentData);
        return assignmentData;
    }
    async updateSubjectClassAssignment(assignmentId, data) {
        const now = Date.now();
        await DB_1.default.from('subject_classes')
            .where('id', assignmentId)
            .update({
            ...data,
            updated_at: now
        });
        return await DB_1.default.from('subject_classes').where('id', assignmentId).first();
    }
    async unassignSubjectFromClass(subjectId, classId) {
        const now = Date.now();
        return await DB_1.default.from('subject_classes')
            .where('subject_id', subjectId)
            .where('class_id', classId)
            .update({ is_active: false, updated_at: now });
    }
    validateSubjectData(data, row = 0) {
        const errors = [];
        if (!data.kode || typeof data.kode !== 'string' || data.kode.trim().length === 0) {
            errors.push({
                row,
                field: 'kode',
                message: 'Kode mata pelajaran wajib diisi',
                value: data.kode
            });
        }
        else if (data.kode.length > 10) {
            errors.push({
                row,
                field: 'kode',
                message: 'Kode mata pelajaran maksimal 10 karakter',
                value: data.kode
            });
        }
        if (!data.nama || typeof data.nama !== 'string' || data.nama.trim().length === 0) {
            errors.push({
                row,
                field: 'nama',
                message: 'Nama mata pelajaran wajib diisi',
                value: data.nama
            });
        }
        else if (data.nama.length > 100) {
            errors.push({
                row,
                field: 'nama',
                message: 'Nama mata pelajaran maksimal 100 karakter',
                value: data.nama
            });
        }
        if (data.deskripsi && typeof data.deskripsi === 'string' && data.deskripsi.length > 500) {
            errors.push({
                row,
                field: 'deskripsi',
                message: 'Deskripsi maksimal 500 karakter',
                value: data.deskripsi
            });
        }
        return errors;
    }
    async getUniqueClassesFromStudents() {
        const classes = await DB_1.default.from('students')
            .distinct('kelas')
            .where('is_active', true)
            .whereNotNull('kelas')
            .where('kelas', '!=', '')
            .orderBy('kelas');
        return classes.map(c => c.kelas);
    }
    async createSubjectSchedule(data) {
        const id = (0, crypto_1.randomUUID)();
        const now = Date.now();
        const validationErrors = this.validateScheduleData(data);
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.map(e => e.message).join(', '));
        }
        const conflicts = await this.checkScheduleConflicts(data);
        if (conflicts.length > 0) {
            throw new Error('Jadwal bertabrakan dengan jadwal yang sudah ada');
        }
        const scheduleData = {
            id,
            subject_id: data.subject_id,
            kelas: data.kelas,
            start_time: data.start_time,
            end_time: data.end_time,
            day: data.day,
            notes: data.notes || null,
            is_active: true,
            created_at: now,
            updated_at: now
        };
        await DB_1.default.from('subject_schedules').insert(scheduleData);
        return scheduleData;
    }
    async getSubjectSchedules(subjectId) {
        return await DB_1.default.from('subject_schedules')
            .where('subject_id', subjectId)
            .where('is_active', true)
            .orderBy('day')
            .orderBy('start_time');
    }
    validateScheduleData(data) {
        const errors = [];
        if (!data.subject_id) {
            errors.push({
                row: 0,
                field: 'subject_id',
                message: 'ID mata pelajaran wajib diisi',
                value: data.subject_id
            });
        }
        if (!data.kelas || typeof data.kelas !== 'string' || data.kelas.trim().length === 0) {
            errors.push({
                row: 0,
                field: 'kelas',
                message: 'Kelas wajib dipilih',
                value: data.kelas
            });
        }
        if (!data.start_time || !this.isValidTimeFormat(data.start_time)) {
            errors.push({
                row: 0,
                field: 'start_time',
                message: 'Jam mulai wajib diisi dengan format HH:MM',
                value: data.start_time
            });
        }
        if (!data.end_time || !this.isValidTimeFormat(data.end_time)) {
            errors.push({
                row: 0,
                field: 'end_time',
                message: 'Jam selesai wajib diisi dengan format HH:MM',
                value: data.end_time
            });
        }
        if (data.start_time && data.end_time && this.isValidTimeFormat(data.start_time) && this.isValidTimeFormat(data.end_time)) {
            if (data.start_time >= data.end_time) {
                errors.push({
                    row: 0,
                    field: 'end_time',
                    message: 'Jam selesai harus lebih besar dari jam mulai',
                    value: data.end_time
                });
            }
        }
        const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        if (!data.day || !validDays.includes(data.day)) {
            errors.push({
                row: 0,
                field: 'day',
                message: 'Hari wajib dipilih dari: ' + validDays.join(', '),
                value: data.day
            });
        }
        return errors;
    }
    async checkScheduleConflicts(data) {
        return await DB_1.default.from('subject_schedules')
            .where('kelas', data.kelas)
            .where('day', data.day)
            .where('is_active', true)
            .where(function () {
            this.where(function () {
                this.where('start_time', '<=', data.start_time)
                    .where('end_time', '>', data.start_time);
            }).orWhere(function () {
                this.where('start_time', '<', data.end_time)
                    .where('end_time', '>=', data.end_time);
            }).orWhere(function () {
                this.where('start_time', '>=', data.start_time)
                    .where('end_time', '<=', data.end_time);
            });
        });
    }
    isValidTimeFormat(time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
    async deleteSubjectSchedule(scheduleId) {
        const now = Date.now();
        return await DB_1.default.from('subject_schedules')
            .where('id', scheduleId)
            .update({ is_active: false, updated_at: now });
    }
}
exports.default = new SubjectService();
//# sourceMappingURL=SubjectService.js.map