"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
const DB_1 = __importDefault(require("./DB"));
class ClassService {
    async getUniqueClasses() {
        try {
            const uniqueClassNames = await DB_1.default.from('students')
                .distinct('kelas')
                .whereNotNull('kelas')
                .where('is_active', true)
                .orderBy('kelas');
            const classes = [];
            for (const row of uniqueClassNames) {
                const className = row.kelas;
                let classRecord = await this.ensureClassExists(className);
                let teacherInfo = null;
                if (classRecord.teacher_id) {
                    teacherInfo = await DB_1.default.from('teachers')
                        .where('user_id', classRecord.teacher_id)
                        .where('is_active', true)
                        .first();
                }
                const studentCount = await DB_1.default.from('students')
                    .where('kelas', className)
                    .where('is_active', true)
                    .count('id as count')
                    .first();
                const subjectCount = await DB_1.default.from('subject_classes')
                    .where('class_id', classRecord.id)
                    .where('is_active', true)
                    .count('id as count')
                    .first();
                classes.push({
                    id: classRecord.id,
                    name: classRecord.name,
                    grade_level: classRecord.grade_level,
                    academic_year: classRecord.academic_year,
                    description: classRecord.description,
                    max_students: classRecord.max_students,
                    teacher_id: classRecord.teacher_id,
                    teacher_name: teacherInfo?.nama || null,
                    teacher_nip: teacherInfo?.nip || null,
                    student_count: parseInt(studentCount?.count) || 0,
                    subject_count: parseInt(subjectCount?.count) || 0,
                    created_at: classRecord.created_at,
                    updated_at: classRecord.updated_at
                });
            }
            return classes;
        }
        catch (error) {
            console.error('Error getting unique classes:', error);
            throw new Error('Gagal mengambil data kelas');
        }
    }
    async ensureClassExists(className) {
        try {
            let classRecord = await DB_1.default.from('classes')
                .where('name', className)
                .first();
            if (!classRecord) {
                const now = (0, dayjs_1.default)().valueOf();
                const gradeLevel = this.extractGradeLevel(className);
                const academicYear = this.getCurrentAcademicYear();
                classRecord = {
                    id: (0, crypto_1.randomUUID)(),
                    name: className,
                    grade_level: gradeLevel,
                    academic_year: academicYear,
                    description: `Kelas ${className}`,
                    max_students: 30,
                    teacher_id: null,
                    created_at: now,
                    updated_at: now
                };
                await DB_1.default.table('classes').insert(classRecord);
            }
            return classRecord;
        }
        catch (error) {
            console.error('Error ensuring class exists:', error);
            throw new Error('Gagal memastikan data kelas');
        }
    }
    extractGradeLevel(className) {
        const match = className.match(/^(\d+)/);
        return match ? match[1] : '7';
    }
    getCurrentAcademicYear() {
        const now = (0, dayjs_1.default)();
        const year = now.year();
        const month = now.month() + 1;
        if (month >= 7) {
            return `${year}/${year + 1}`;
        }
        else {
            return `${year - 1}/${year}`;
        }
    }
    async assignTeacherToClass(className, teacherId) {
        try {
            const teacher = await DB_1.default.from('teachers')
                .where('id', teacherId)
                .where('is_active', true)
                .first();
            if (!teacher) {
                throw new Error('Guru tidak ditemukan atau tidak aktif');
            }
            const classRecord = await this.ensureClassExists(className);
            const existingAssignment = await DB_1.default.from('classes')
                .where('teacher_id', teacher.user_id)
                .whereNot('id', classRecord.id)
                .first();
            if (existingAssignment) {
                throw new Error(`Guru sudah menjadi wali kelas ${existingAssignment.name}`);
            }
            await DB_1.default.from('classes')
                .where('id', classRecord.id)
                .update({
                teacher_id: teacher.user_id,
                updated_at: (0, dayjs_1.default)().valueOf()
            });
        }
        catch (error) {
            console.error('Error assigning teacher to class:', error);
            throw error;
        }
    }
    async unassignTeacherFromClass(className) {
        try {
            const classRecord = await this.ensureClassExists(className);
            await DB_1.default.from('classes')
                .where('id', classRecord.id)
                .update({
                teacher_id: null,
                updated_at: (0, dayjs_1.default)().valueOf()
            });
        }
        catch (error) {
            console.error('Error unassigning teacher from class:', error);
            throw new Error('Gagal membatalkan penugasan wali kelas');
        }
    }
    async getClassSubjects(className) {
        try {
            const classRecord = await this.ensureClassExists(className);
            const assignments = await DB_1.default.from('subject_classes as sc')
                .leftJoin('subjects as s', 'sc.subject_id', 's.id')
                .leftJoin('teachers as t', 'sc.teacher_id', 't.id')
                .where('sc.class_id', classRecord.id)
                .where('sc.is_active', true)
                .select('sc.id', 'sc.subject_id', 's.nama as subject_name', 's.kode as subject_code', 'sc.teacher_id', 't.nama as teacher_name', 'sc.day', 'sc.start_time', 'sc.end_time', 'sc.notes', 'sc.is_active');
            return assignments;
        }
        catch (error) {
            console.error('Error getting class subjects:', error);
            throw new Error('Gagal mengambil mata pelajaran kelas');
        }
    }
    async assignSubjectToClass(className, subjectId, teacherId, day, startTime, endTime, notes) {
        try {
            const classRecord = await this.ensureClassExists(className);
            const subject = await DB_1.default.from('subjects')
                .where('id', subjectId)
                .where('is_active', true)
                .first();
            if (!subject) {
                throw new Error('Mata pelajaran tidak ditemukan');
            }
            const existingAssignment = await DB_1.default.from('subject_classes')
                .where('subject_id', subjectId)
                .where('class_id', classRecord.id)
                .first();
            if (existingAssignment) {
                throw new Error('Mata pelajaran sudah ditugaskan ke kelas ini');
            }
            if (!teacherId) {
                throw new Error('Guru wajib dipilih');
            }
            const teacher = await DB_1.default.from('teachers')
                .where('id', teacherId)
                .where('is_active', true)
                .first();
            if (!teacher) {
                throw new Error('Guru tidak ditemukan');
            }
            const teacherSubjectAssignment = await DB_1.default.from('teacher_subjects')
                .where('teacher_id', teacherId)
                .where('subject_id', subjectId)
                .where('is_active', true)
                .first();
            if (!teacherSubjectAssignment) {
                throw new Error('Guru belum di-assign ke mata pelajaran ini. Silakan assign guru ke mata pelajaran terlebih dahulu di menu Mata Pelajaran.');
            }
            if (!day || !startTime || !endTime) {
                throw new Error('Hari, waktu mulai, dan waktu selesai wajib diisi');
            }
            if (startTime >= endTime) {
                throw new Error('Waktu mulai harus lebih awal dari waktu selesai');
            }
            const conflictingSchedule = await DB_1.default.from('subject_classes')
                .where('class_id', classRecord.id)
                .where('day', day)
                .where('is_active', true)
                .where(function () {
                this.where(function () {
                    this.where('start_time', '<=', startTime)
                        .where('end_time', '>', startTime);
                }).orWhere(function () {
                    this.where('start_time', '<', endTime)
                        .where('end_time', '>=', endTime);
                }).orWhere(function () {
                    this.where('start_time', '>=', startTime)
                        .where('end_time', '<=', endTime);
                });
            })
                .first();
            if (conflictingSchedule) {
                throw new Error(`Jadwal bentrok dengan mata pelajaran lain pada hari ${day} jam ${conflictingSchedule.start_time}-${conflictingSchedule.end_time}`);
            }
            const assignmentData = {
                id: (0, crypto_1.randomUUID)(),
                subject_id: subjectId,
                class_id: classRecord.id,
                teacher_id: teacherId,
                day: day,
                start_time: startTime,
                end_time: endTime,
                notes: notes || null,
                is_active: true,
                created_at: (0, dayjs_1.default)().valueOf(),
                updated_at: (0, dayjs_1.default)().valueOf()
            };
            await DB_1.default.table('subject_classes').insert(assignmentData);
        }
        catch (error) {
            console.error('Error assigning subject to class:', error);
            throw error;
        }
    }
    async unassignSubjectFromClass(className, subjectId) {
        try {
            const classRecord = await this.ensureClassExists(className);
            await DB_1.default.from('subject_classes')
                .where('subject_id', subjectId)
                .where('class_id', classRecord.id)
                .delete();
        }
        catch (error) {
            console.error('Error unassigning subject from class:', error);
            throw new Error('Gagal membatalkan penugasan mata pelajaran');
        }
    }
    async getAvailableTeachers() {
        try {
            return await DB_1.default.from('teachers')
                .where('is_active', true)
                .select('id', 'nip', 'nama', 'email', 'phone', 'user_id')
                .orderBy('nama');
        }
        catch (error) {
            console.error('Error getting available teachers:', error);
            throw new Error('Gagal mengambil data guru');
        }
    }
    async getAvailableSubjects() {
        try {
            return await DB_1.default.from('subjects')
                .where('is_active', true)
                .select('id', 'kode', 'nama', 'deskripsi')
                .orderBy('nama');
        }
        catch (error) {
            console.error('Error getting available subjects:', error);
            throw new Error('Gagal mengambil data mata pelajaran');
        }
    }
}
exports.default = new ClassService();
//# sourceMappingURL=ClassService.js.map