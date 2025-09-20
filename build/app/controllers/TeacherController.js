"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TeacherService_1 = __importDefault(require("../services/TeacherService"));
class TeacherController {
    async index(request, response) {
        try {
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const search = request.query.search;
            const result = await TeacherService_1.default.getTeachers(page, limit, search);
            return response.inertia("admin/teachers/index", {
                teachers: result.data,
                total: result.pagination.total,
                page: result.pagination.page,
                limit: result.pagination.limit,
                totalPages: result.pagination.totalPages,
                filters: { search }
            });
        }
        catch (error) {
            console.error('Error fetching teachers:', error);
            return response.status(500).json({ error: 'Gagal mengambil data guru' });
        }
    }
    async create(request, response) {
        try {
            return response.inertia("admin/teachers/create");
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
            console.log(`[${requestId}] Creating teacher with data:`, { nip: data.nip, nama: data.nama, email: data.email });
            const errors = TeacherService_1.default.validateTeacherData(data);
            if (errors.length > 0) {
                console.log(`[${requestId}] Validation failed:`, errors);
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            console.log(`[${requestId}] Calling TeacherService.createTeacher`);
            const newTeacher = await TeacherService_1.default.createTeacher(data);
            console.log(`[${requestId}] Teacher created successfully`);
            return response.status(201).json({
                success: true,
                message: 'Guru berhasil ditambahkan',
                data: newTeacher
            });
        }
        catch (error) {
            console.error(`[${requestId}] Error creating teacher:`, error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
                if (data && (data.nip || data.email)) {
                    try {
                        const existingTeacher = data.nip
                            ? await TeacherService_1.default.getTeacherByNIP(data.nip)
                            : await TeacherService_1.default.getTeacherByEmail(data.email);
                        if (existingTeacher) {
                            return response.status(200).json({
                                success: true,
                                message: 'Guru sudah ada (operasi idempotent)',
                                data: existingTeacher
                            });
                        }
                    }
                    catch (checkError) {
                        console.error('Error checking existing teacher:', checkError);
                    }
                }
                return response.status(400).json({
                    error: 'NIP atau Email sudah terdaftar'
                });
            }
            return response.status(500).json({ error: 'Gagal menambahkan guru' });
        }
    }
    async show(request, response) {
        try {
            const { id } = request.params;
            const teacher = await TeacherService_1.default.getTeacherById(id);
            if (!teacher) {
                return response.status(404).json({ error: 'Guru tidak ditemukan' });
            }
            return response.inertia("admin/teachers/show", { teacher });
        }
        catch (error) {
            console.error('Error fetching teacher:', error);
            return response.status(500).json({ error: 'Gagal mengambil data guru' });
        }
    }
    async edit(request, response) {
        try {
            const { id } = request.params;
            console.log('Loading teacher for edit, ID:', id);
            const teacher = await TeacherService_1.default.getTeacherByIdForEdit(id);
            console.log('Teacher data loaded:', teacher ? 'Found' : 'Not found');
            if (!teacher) {
                console.log('Teacher not found, redirecting to teachers list');
                return response.redirect("/admin/teachers?error=teacher_not_found");
            }
            console.log('Rendering edit page with teacher data');
            return response.inertia("admin/teachers/edit", { teacher });
        }
        catch (error) {
            console.error('Error loading edit form:', error);
            return response.redirect("/admin/teachers?error=load_failed");
        }
    }
    async update(request, response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            const existingTeacher = await TeacherService_1.default.getTeacherByIdForEdit(id);
            if (!existingTeacher) {
                return response.status(404).json({ error: 'Guru tidak ditemukan' });
            }
            const validationData = { ...data };
            if (!data.password || data.password.trim() === '') {
                delete validationData.password;
            }
            const errors = TeacherService_1.default.validateTeacherData(validationData);
            if (errors.length > 0) {
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            if (data.nip !== existingTeacher.nip) {
                const duplicateNIP = await TeacherService_1.default.getTeacherByNIP(data.nip);
                if (duplicateNIP) {
                    return response.status(400).json({
                        error: 'NIP sudah terdaftar'
                    });
                }
            }
            if (data.email !== existingTeacher.email) {
                const duplicateEmail = await TeacherService_1.default.getTeacherByEmail(data.email);
                if (duplicateEmail) {
                    return response.status(400).json({
                        error: 'Email sudah terdaftar'
                    });
                }
            }
            const updatedTeacher = await TeacherService_1.default.updateTeacher(id, data);
            return response.status(200).json({
                success: true,
                message: 'Data guru berhasil diperbarui',
                data: updatedTeacher
            });
        }
        catch (error) {
            console.error('Error updating teacher:', error);
            return response.status(500).json({ error: 'Gagal memperbarui data guru' });
        }
    }
    async destroy(request, response) {
        try {
            const { id } = request.params;
            const teacher = await TeacherService_1.default.getTeacherByIdForEdit(id);
            if (!teacher) {
                return response.status(404).json({
                    success: false,
                    error: 'Guru tidak ditemukan'
                });
            }
            await TeacherService_1.default.deleteTeacher(id);
            return response.status(200).json({
                success: true,
                message: 'Guru berhasil dihapus',
                data: { id }
            });
        }
        catch (error) {
            console.error('Error deleting teacher:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal menghapus guru'
            });
        }
    }
    async getTeachersAPI(request, response) {
        try {
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const search = request.query.search;
            const result = await TeacherService_1.default.getTeachers(page, limit, search);
            return response.json(result);
        }
        catch (error) {
            console.error('Error fetching teachers API:', error);
            return response.status(500).json({ error: 'Gagal mengambil data guru' });
        }
    }
    async getTeachersBySubject(request, response) {
        try {
            const { subjectId } = request.params;
            if (!subjectId) {
                return response.status(400).json({ error: 'Subject ID wajib diisi' });
            }
            const teachers = await TeacherService_1.default.getTeachersBySubject(subjectId);
            return response.json({
                success: true,
                data: teachers
            });
        }
        catch (error) {
            console.error('Error fetching teachers by subject:', error);
            return response.status(500).json({ error: 'Gagal mengambil data guru berdasarkan mata pelajaran' });
        }
    }
}
exports.default = new TeacherController();
//# sourceMappingURL=TeacherController.js.map