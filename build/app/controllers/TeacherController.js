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
        try {
            const data = await request.json();
            const errors = TeacherService_1.default.validateTeacherData(data);
            if (errors.length > 0) {
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            const existingTeacher = await TeacherService_1.default.getTeacherByNIP(data.nip);
            if (existingTeacher) {
                return response.status(400).json({
                    error: 'NIP sudah terdaftar'
                });
            }
            const existingEmail = await TeacherService_1.default.getTeacherByEmail(data.email);
            if (existingEmail) {
                return response.status(400).json({
                    error: 'Email sudah terdaftar'
                });
            }
            await TeacherService_1.default.createTeacher(data);
            return response.redirect("/admin/teachers");
        }
        catch (error) {
            console.error('Error creating teacher:', error);
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
            const teacher = await TeacherService_1.default.getTeacherById(id);
            if (!teacher) {
                return response.status(404).json({ error: 'Guru tidak ditemukan' });
            }
            return response.inertia("admin/teachers/edit", { teacher });
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
            const existingTeacher = await TeacherService_1.default.getTeacherById(id);
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
            await TeacherService_1.default.updateTeacher(id, data);
            return response.redirect("/admin/teachers");
        }
        catch (error) {
            console.error('Error updating teacher:', error);
            return response.status(500).json({ error: 'Gagal memperbarui data guru' });
        }
    }
    async destroy(request, response) {
        try {
            const { id } = request.params;
            const teacher = await TeacherService_1.default.getTeacherById(id);
            if (!teacher) {
                return response.status(404).json({ error: 'Guru tidak ditemukan' });
            }
            await TeacherService_1.default.deleteTeacher(id);
            return response.redirect("/admin/teachers");
        }
        catch (error) {
            console.error('Error deleting teacher:', error);
            return response.status(500).json({ error: 'Gagal menghapus guru' });
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
}
exports.default = new TeacherController();
//# sourceMappingURL=TeacherController.js.map