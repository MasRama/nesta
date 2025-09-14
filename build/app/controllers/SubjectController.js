"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubjectService_1 = __importDefault(require("../services/SubjectService"));
class SubjectController {
    async index(request, response) {
        try {
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const search = request.query.search;
            const result = await SubjectService_1.default.getSubjects(page, limit, search);
            return response.inertia("admin/subjects/index", {
                subjects: result.data,
                total: result.pagination.total,
                page: result.pagination.page,
                limit: result.pagination.limit,
                totalPages: result.pagination.totalPages,
                filters: { search }
            });
        }
        catch (error) {
            console.error('Error fetching subjects:', error);
            return response.status(500).json({ error: 'Gagal mengambil data mata pelajaran' });
        }
    }
    async create(request, response) {
        try {
            return response.inertia("admin/subjects/create");
        }
        catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form' });
        }
    }
    async store(request, response) {
        let data;
        const requestId = Date.now() + '-' + Math.random().toString(36).substring(2, 11);
        try {
            data = await request.json();
            console.log(`[${requestId}] Creating subject with data:`, { kode: data.kode, nama: data.nama });
            const errors = SubjectService_1.default.validateSubjectData(data);
            if (errors.length > 0) {
                console.log(`[${requestId}] Validation failed:`, errors);
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            console.log(`[${requestId}] Calling SubjectService.createSubject`);
            await SubjectService_1.default.createSubject(data);
            console.log(`[${requestId}] Subject created successfully`);
            return response.redirect("/admin/subjects");
        }
        catch (error) {
            console.error(`[${requestId}] Error creating subject:`, error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
                if (data && data.kode) {
                    try {
                        const existingSubject = await SubjectService_1.default.getSubjectByCode(data.kode);
                        if (existingSubject) {
                            return response.redirect("/admin/subjects");
                        }
                    }
                    catch (checkError) {
                        console.error('Error checking existing subject:', checkError);
                    }
                }
                return response.status(400).json({
                    error: 'Kode mata pelajaran sudah digunakan'
                });
            }
            return response.status(500).json({ error: 'Gagal menambahkan mata pelajaran' });
        }
    }
    async show(request, response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const teachers = await SubjectService_1.default.getSubjectTeachers(id);
            return response.inertia("admin/subjects/show", { subject, teachers });
        }
        catch (error) {
            console.error('Error fetching subject:', error);
            return response.status(500).json({ error: 'Gagal mengambil data mata pelajaran' });
        }
    }
    async edit(request, response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            return response.inertia("admin/subjects/edit", { subject });
        }
        catch (error) {
            console.error('Error loading edit form:', error);
            return response.status(500).json({ error: 'Gagal memuat form edit' });
        }
    }
    async update(request, response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            const existingSubject = await SubjectService_1.default.getSubjectById(id);
            if (!existingSubject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const errors = SubjectService_1.default.validateSubjectData(data);
            if (errors.length > 0) {
                return response.status(422).json({
                    error: 'Data tidak valid',
                    errors: errors.map(e => `${e.field}: ${e.message}`)
                });
            }
            if (data.kode !== existingSubject.kode) {
                const duplicateSubject = await SubjectService_1.default.getSubjectByCode(data.kode);
                if (duplicateSubject) {
                    return response.status(422).json({
                        error: 'Kode mata pelajaran sudah digunakan'
                    });
                }
            }
            await SubjectService_1.default.updateSubject(id, data);
            return response.redirect("/admin/subjects");
        }
        catch (error) {
            console.error('Error updating subject:', error);
            return response.status(500).json({ error: 'Gagal memperbarui mata pelajaran' });
        }
    }
    async destroy(request, response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            await SubjectService_1.default.deleteSubject(id);
            return response.redirect("/admin/subjects");
        }
        catch (error) {
            console.error('Error deleting subject:', error);
            return response.status(500).json({ error: 'Gagal menghapus mata pelajaran' });
        }
    }
    async getSubjectsAPI(request, response) {
        try {
            const search = request.query.search;
            const result = await SubjectService_1.default.getSubjects(1, 100, search);
            return response.json({ data: result.data });
        }
        catch (error) {
            console.error('Error fetching subjects API:', error);
            return response.status(500).json({ error: 'Gagal mengambil data mata pelajaran' });
        }
    }
    async assignTeachers(request, response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const assignedTeachers = await SubjectService_1.default.getSubjectTeachers(id);
            const availableTeachers = await SubjectService_1.default.getAvailableTeachers();
            return response.inertia("admin/subjects/assign-teachers", {
                subject,
                assignedTeachers,
                availableTeachers
            });
        }
        catch (error) {
            console.error('Error loading teacher assignment page:', error);
            return response.status(500).json({ error: 'Gagal memuat halaman assignment guru' });
        }
    }
    async assignTeacher(request, response) {
        try {
            const { id } = request.params;
            const { teacher_id } = await request.json();
            if (!teacher_id) {
                return response.status(422).json({ error: 'ID guru wajib diisi' });
            }
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            await SubjectService_1.default.assignTeacherToSubject(teacher_id, id);
            return response.json({ message: 'Guru berhasil ditugaskan ke mata pelajaran' });
        }
        catch (error) {
            console.error('Error assigning teacher:', error);
            if (error instanceof Error && error.message.includes('sudah ditugaskan')) {
                return response.status(422).json({ error: error.message });
            }
            return response.status(500).json({ error: 'Gagal menugaskan guru' });
        }
    }
    async unassignTeacher(request, response) {
        try {
            const { id } = request.params;
            const { teacher_id } = await request.json();
            if (!teacher_id) {
                return response.status(422).json({ error: 'ID guru wajib diisi' });
            }
            await SubjectService_1.default.unassignTeacherFromSubject(teacher_id, id);
            return response.json({ message: 'Guru berhasil dibatalkan dari mata pelajaran' });
        }
        catch (error) {
            console.error('Error unassigning teacher:', error);
            return response.status(500).json({ error: 'Gagal membatalkan assignment guru' });
        }
    }
    async getTeachersModal(request, response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const teachers = await SubjectService_1.default.getTeachersForModal(id);
            return response.json({
                subject,
                teachers
            });
        }
        catch (error) {
            console.error('Error fetching teachers for modal:', error);
            return response.status(500).json({ error: 'Gagal mengambil data guru' });
        }
    }
    async batchAssignTeachers(request, response) {
        try {
            const { id } = request.params;
            const { teacher_ids } = await request.json();
            if (!Array.isArray(teacher_ids)) {
                return response.status(422).json({ error: 'teacher_ids harus berupa array' });
            }
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const currentAssignments = await SubjectService_1.default.getSubjectTeachers(id);
            const currentTeacherIds = new Set(currentAssignments.map(t => t.id));
            const newTeacherIds = new Set(teacher_ids);
            const toAssign = teacher_ids.filter(id => !currentTeacherIds.has(id));
            const toUnassign = currentAssignments
                .filter(t => !newTeacherIds.has(t.id))
                .map(t => t.id);
            for (const teacherId of toAssign) {
                try {
                    await SubjectService_1.default.assignTeacherToSubject(teacherId, id);
                }
                catch (error) {
                    console.warn(`Failed to assign teacher ${teacherId}:`, error);
                }
            }
            for (const teacherId of toUnassign) {
                try {
                    await SubjectService_1.default.unassignTeacherFromSubject(teacherId, id);
                }
                catch (error) {
                    console.warn(`Failed to unassign teacher ${teacherId}:`, error);
                }
            }
            return response.json({
                message: 'Assignment guru berhasil diperbarui',
                assigned: toAssign.length,
                unassigned: toUnassign.length
            });
        }
        catch (error) {
            console.error('Error batch assigning teachers:', error);
            return response.status(500).json({ error: 'Gagal memperbarui assignment guru' });
        }
    }
    async assignClasses(request, response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const assignedClasses = await SubjectService_1.default.getSubjectClasses(id);
            const availableClasses = await SubjectService_1.default.getAvailableClasses();
            const availableTeachers = await SubjectService_1.default.getAvailableTeachers();
            return response.inertia("admin/subjects/assign-classes", {
                subject,
                assignedClasses,
                availableClasses,
                availableTeachers
            });
        }
        catch (error) {
            console.error('Error loading class assignment page:', error);
            return response.status(500).json({ error: 'Gagal memuat halaman assignment kelas' });
        }
    }
    async assignToClass(request, response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            if (!data.class_id) {
                return response.status(422).json({ error: 'ID kelas wajib diisi' });
            }
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const assignmentData = {
                subject_id: id,
                class_id: data.class_id,
                teacher_id: data.teacher_id,
                jam_per_minggu: data.jam_per_minggu,
                notes: data.notes
            };
            await SubjectService_1.default.assignSubjectToClass(assignmentData);
            return response.json({ message: 'Mata pelajaran berhasil ditugaskan ke kelas' });
        }
        catch (error) {
            console.error('Error assigning subject to class:', error);
            if (error instanceof Error && error.message.includes('sudah ditugaskan')) {
                return response.status(422).json({ error: error.message });
            }
            return response.status(500).json({ error: 'Gagal menugaskan mata pelajaran ke kelas' });
        }
    }
    async updateClassAssignment(request, response) {
        try {
            const { assignmentId } = request.params;
            const data = await request.json();
            await SubjectService_1.default.updateSubjectClassAssignment(assignmentId, data);
            return response.json({ message: 'Assignment berhasil diupdate' });
        }
        catch (error) {
            console.error('Error updating class assignment:', error);
            return response.status(500).json({ error: 'Gagal mengupdate assignment' });
        }
    }
    async unassignFromClass(request, response) {
        try {
            const { id } = request.params;
            const { class_id } = await request.json();
            if (!class_id) {
                return response.status(422).json({ error: 'ID kelas wajib diisi' });
            }
            await SubjectService_1.default.unassignSubjectFromClass(id, class_id);
            return response.json({ message: 'Mata pelajaran berhasil dibatalkan dari kelas' });
        }
        catch (error) {
            console.error('Error unassigning subject from class:', error);
            return response.status(500).json({ error: 'Gagal membatalkan assignment kelas' });
        }
    }
    async getUniqueClasses(request, response) {
        try {
            const classes = await SubjectService_1.default.getUniqueClassesFromStudents();
            return response.json({ classes });
        }
        catch (error) {
            console.error('Error fetching unique classes:', error);
            return response.status(500).json({ error: 'Gagal mengambil data kelas' });
        }
    }
    async createSchedule(request, response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const scheduleData = {
                subject_id: id,
                kelas: data.kelas,
                start_time: data.start_time,
                end_time: data.end_time,
                day: data.day,
                notes: data.notes
            };
            const schedule = await SubjectService_1.default.createSubjectSchedule(scheduleData);
            return response.json({
                message: 'Jadwal berhasil dibuat',
                schedule
            });
        }
        catch (error) {
            console.error('Error creating subject schedule:', error);
            if (error instanceof Error) {
                return response.status(422).json({ error: error.message });
            }
            return response.status(500).json({ error: 'Gagal membuat jadwal' });
        }
    }
    async getSchedules(request, response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService_1.default.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            const schedules = await SubjectService_1.default.getSubjectSchedules(id);
            return response.json({ schedules });
        }
        catch (error) {
            console.error('Error fetching subject schedules:', error);
            return response.status(500).json({ error: 'Gagal mengambil jadwal' });
        }
    }
    async deleteSchedule(request, response) {
        try {
            const { scheduleId } = request.params;
            await SubjectService_1.default.deleteSubjectSchedule(scheduleId);
            return response.json({ message: 'Jadwal berhasil dihapus' });
        }
        catch (error) {
            console.error('Error deleting subject schedule:', error);
            return response.status(500).json({ error: 'Gagal menghapus jadwal' });
        }
    }
}
exports.default = new SubjectController();
//# sourceMappingURL=SubjectController.js.map