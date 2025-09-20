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
            const newSubject = await SubjectService_1.default.createSubject(data);
            console.log(`[${requestId}] Subject created successfully`);
            return response.status(201).json({
                success: true,
                message: 'Mata pelajaran berhasil ditambahkan',
                data: newSubject
            });
        }
        catch (error) {
            console.error(`[${requestId}] Error creating subject:`, error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
                if (data && data.kode) {
                    try {
                        const existingSubject = await SubjectService_1.default.getSubjectByCode(data.kode);
                        if (existingSubject) {
                            return response.status(201).json({
                                success: true,
                                message: 'Mata pelajaran berhasil ditambahkan',
                                data: existingSubject
                            });
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
            const updatedSubject = await SubjectService_1.default.updateSubject(id, data);
            return response.status(200).json({
                success: true,
                message: 'Data mata pelajaran berhasil diperbarui',
                data: updatedSubject
            });
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
            return response.json({
                success: true,
                message: 'Mata pelajaran berhasil dihapus'
            });
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
}
exports.default = new SubjectController();
//# sourceMappingURL=SubjectController.js.map