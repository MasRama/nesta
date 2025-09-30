"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ParentService_1 = __importDefault(require("../services/ParentService"));
class ParentController {
    async index(request, response) {
        try {
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const search = request.query.search;
            const result = await ParentService_1.default.getParents(page, limit, search);
            return response.inertia("admin/parents/index", {
                parents: result.data,
                total: result.pagination.total,
                page: result.pagination.page,
                limit: result.pagination.limit,
                totalPages: result.pagination.totalPages,
                filters: { search }
            });
        }
        catch (error) {
            console.error('Error fetching parents:', error);
            return response.status(500).json({ error: 'Gagal mengambil data wali murid' });
        }
    }
    async create(request, response) {
        try {
            return response.inertia("admin/parents/create", {});
        }
        catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form tambah wali murid' });
        }
    }
    async store(request, response) {
        const requestId = Math.random().toString(36).substring(7);
        let data;
        try {
            data = await request.json();
            console.log(`[${requestId}] Creating parent with data:`, { nama: data.nama, email: data.email });
            const errors = ParentService_1.default.validateParentData(data);
            if (errors.length > 0) {
                console.log(`[${requestId}] Validation failed:`, errors);
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            const existingParent = await ParentService_1.default.getParentByEmail(data.email);
            if (existingParent) {
                return response.status(400).json({
                    error: 'Email sudah digunakan',
                    errors: [{
                            field: 'email',
                            message: 'Email sudah digunakan oleh wali murid lain',
                            value: data.email
                        }]
                });
            }
            console.log(`[${requestId}] Calling ParentService.createParent`);
            const parent = await ParentService_1.default.createParent(data);
            console.log(`[${requestId}] Parent created successfully with ID: ${parent.id}`);
            return response.status(201).json({
                success: true,
                message: 'Wali murid berhasil ditambahkan',
                data: parent
            });
        }
        catch (error) {
            console.error(`[${requestId}] Error creating parent:`, error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
                if (data && data.email) {
                    try {
                        const existingParent = await ParentService_1.default.getParentByEmail(data.email);
                        if (existingParent) {
                            return response.status(201).json({
                                success: true,
                                message: 'Wali murid berhasil ditambahkan',
                                data: existingParent
                            });
                        }
                    }
                    catch (checkError) {
                        console.error('Error checking existing parent:', checkError);
                    }
                }
                return response.status(400).json({
                    error: 'Email sudah digunakan',
                    errors: [{
                            field: 'email',
                            message: 'Email sudah digunakan oleh wali murid lain',
                            value: data?.email
                        }]
                });
            }
            return response.status(500).json({
                error: 'Gagal menambahkan wali murid',
                details: error.message
            });
        }
    }
    async show(request, response) {
        try {
            const { id } = request.params;
            const parent = await ParentService_1.default.getParentById(id);
            if (!parent) {
                return response.status(404).json({ error: 'Wali murid tidak ditemukan' });
            }
            const students = await ParentService_1.default.getParentStudents(id);
            return response.inertia("admin/parents/show", {
                parent,
                students
            });
        }
        catch (error) {
            console.error('Error fetching parent:', error);
            return response.status(500).json({ error: 'Gagal mengambil data wali murid' });
        }
    }
    async edit(request, response) {
        try {
            const { id } = request.params;
            const parent = await ParentService_1.default.getParentById(id);
            if (!parent) {
                return response.status(404).json({ error: 'Wali murid tidak ditemukan' });
            }
            const students = await ParentService_1.default.getParentStudents(id);
            return response.inertia("admin/parents/edit", {
                parent,
                students
            });
        }
        catch (error) {
            console.error('Error loading edit form:', error);
            return response.status(500).json({ error: 'Gagal memuat form edit wali murid' });
        }
    }
    async update(request, response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            const existingParent = await ParentService_1.default.getParentById(id);
            if (!existingParent) {
                return response.status(404).json({ error: 'Wali murid tidak ditemukan' });
            }
            const validationData = { ...data };
            if (!data.password || data.password.trim() === '') {
                delete validationData.password;
            }
            const errors = ParentService_1.default.validateParentData(validationData);
            if (errors.length > 0) {
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            const parentWithSameEmail = await ParentService_1.default.getParentByEmail(data.email);
            if (parentWithSameEmail && parentWithSameEmail.id !== id) {
                return response.status(400).json({
                    error: 'Email sudah digunakan',
                    errors: [{
                            field: 'email',
                            message: 'Email sudah digunakan oleh wali murid lain',
                            value: data.email
                        }]
                });
            }
            const updatedParent = await ParentService_1.default.updateParent(id, data);
            return response.status(200).json({
                success: true,
                message: 'Data wali murid berhasil diperbarui',
                data: updatedParent
            });
        }
        catch (error) {
            console.error('Error updating parent:', error);
            return response.status(500).json({ error: 'Gagal mengupdate wali murid' });
        }
    }
    async destroy(request, response) {
        try {
            const { id } = request.params;
            await ParentService_1.default.deleteParent(id);
            return response.json({ message: 'Wali murid berhasil dihapus' });
        }
        catch (error) {
            console.error('Error deleting parent:', error);
            return response.status(500).json({ error: 'Gagal menghapus wali murid' });
        }
    }
    async getParentsAPI(request, response) {
        try {
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const search = request.query.search;
            const result = await ParentService_1.default.getParents(page, limit, search);
            return response.json(result);
        }
        catch (error) {
            console.error('Error fetching parents API:', error);
            return response.status(500).json({ error: 'Gagal mengambil data wali murid' });
        }
    }
    async searchStudentByNipd(request, response) {
        try {
            const { nipd } = request.query;
            if (!nipd) {
                return response.status(400).json({ error: 'NIPD harus diisi' });
            }
            const student = await ParentService_1.default.searchStudentByNipd(nipd);
            if (!student) {
                return response.status(404).json({ error: 'Siswa dengan NIPD tersebut tidak ditemukan' });
            }
            return response.json({ student });
        }
        catch (error) {
            console.error('Error searching student by NIPD:', error);
            return response.status(500).json({ error: 'Gagal mencari siswa' });
        }
    }
    async addStudent(request, response) {
        try {
            const { id } = request.params;
            const { nipd, relationship_type, is_primary_contact } = await request.json();
            const student = await ParentService_1.default.searchStudentByNipd(nipd);
            if (!student) {
                return response.status(404).json({ error: 'Siswa dengan NIPD tersebut tidak ditemukan' });
            }
            await ParentService_1.default.addStudentToParent(id, student.id, relationship_type, is_primary_contact);
            return response.json({ message: 'Siswa berhasil ditambahkan' });
        }
        catch (error) {
            console.error('Error adding student to parent:', error);
            return response.status(500).json({ error: 'Gagal menambahkan siswa' });
        }
    }
    async removeStudent(request, response) {
        try {
            const { id, studentId } = request.params;
            await ParentService_1.default.removeStudentFromParent(id, studentId);
            return response.json({ message: 'Siswa berhasil dihapus dari wali murid' });
        }
        catch (error) {
            console.error('Error removing student from parent:', error);
            return response.status(500).json({ error: 'Gagal menghapus siswa dari wali murid' });
        }
    }
}
exports.default = new ParentController();
//# sourceMappingURL=ParentController.js.map