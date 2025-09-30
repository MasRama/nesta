"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StudentService_1 = __importDefault(require("../services/StudentService"));
class StudentController {
    async index(request, response) {
        try {
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const search = request.query.search;
            const kelas = request.query.kelas;
            const gender = request.query.gender;
            const result = await StudentService_1.default.getStudents(page, limit, search, kelas, gender);
            const classes = await StudentService_1.default.getClasses();
            return response.inertia("admin/students/index", {
                ...result,
                classes,
                filters: { search, kelas, gender }
            });
        }
        catch (error) {
            console.error('Error fetching students:', error);
            return response.status(500).json({ error: 'Gagal mengambil data siswa' });
        }
    }
    async create(request, response) {
        try {
            const classes = await StudentService_1.default.getClasses();
            return response.inertia("admin/students/create", { classes });
        }
        catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form' });
        }
    }
    async store(request, response) {
        try {
            const data = await request.json();
            const errors = StudentService_1.default.validateStudentData(data);
            if (errors.length > 0) {
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            const existingStudent = await StudentService_1.default.getStudentByNIPD(data.nipd);
            if (existingStudent) {
                return response.status(400).json({
                    error: 'NIPD sudah terdaftar'
                });
            }
            const student = await StudentService_1.default.createStudent(data);
            return response.json({
                message: 'Siswa berhasil ditambahkan',
                student
            });
        }
        catch (error) {
            console.error('Error creating student:', error);
            return response.status(500).json({ error: 'Gagal menambahkan siswa' });
        }
    }
    async show(request, response) {
        try {
            const { id } = request.params;
            const student = await StudentService_1.default.getStudentById(id);
            if (!student) {
                return response.status(404).json({ error: 'Siswa tidak ditemukan' });
            }
            return response.inertia("admin/students/show", { student });
        }
        catch (error) {
            console.error('Error fetching student:', error);
            return response.status(500).json({ error: 'Gagal mengambil data siswa' });
        }
    }
    async edit(request, response) {
        try {
            const { id } = request.params;
            const student = await StudentService_1.default.getStudentById(id);
            if (!student) {
                return response.status(404).json({ error: 'Siswa tidak ditemukan' });
            }
            const classes = await StudentService_1.default.getClasses();
            return response.inertia("admin/students/edit", { student, classes });
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
            const existingStudent = await StudentService_1.default.getStudentById(id);
            if (!existingStudent) {
                return response.status(404).json({ error: 'Siswa tidak ditemukan' });
            }
            const errors = StudentService_1.default.validateStudentData(data);
            if (errors.length > 0) {
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            if (data.nipd !== existingStudent.nipd) {
                const duplicateStudent = await StudentService_1.default.getStudentByNIPD(data.nipd);
                if (duplicateStudent) {
                    return response.status(400).json({
                        error: 'NIPD sudah terdaftar'
                    });
                }
            }
            const student = await StudentService_1.default.updateStudent(id, data);
            return response.json({
                message: 'Data siswa berhasil diperbarui',
                student
            });
        }
        catch (error) {
            console.error('Error updating student:', error);
            return response.status(500).json({ error: 'Gagal memperbarui data siswa' });
        }
    }
    async destroy(request, response) {
        try {
            const { id } = request.params;
            const student = await StudentService_1.default.getStudentById(id);
            if (!student) {
                return response.status(404).json({ error: 'Siswa tidak ditemukan' });
            }
            await StudentService_1.default.deleteStudent(id);
            return response.json({ message: 'Siswa berhasil dihapus' });
        }
        catch (error) {
            console.error('Error deleting student:', error);
            return response.status(500).json({ error: 'Gagal menghapus siswa' });
        }
    }
    async getStudentsAPI(request, response) {
        try {
            const page = parseInt(request.query.page) || 1;
            const limit = parseInt(request.query.limit) || 10;
            const search = request.query.search;
            const kelas = request.query.kelas;
            const gender = request.query.gender;
            const result = await StudentService_1.default.getStudents(page, limit, search, kelas, gender);
            return response.json(result);
        }
        catch (error) {
            console.error('Error fetching students API:', error);
            return response.status(500).json({ error: 'Gagal mengambil data siswa' });
        }
    }
    async importCSV(request, response) {
        try {
            const { csvContent } = await request.json();
            if (!csvContent) {
                return response.status(400).json({ error: 'File CSV tidak ditemukan' });
            }
            const result = await StudentService_1.default.importFromCSV(csvContent);
            let message = `Import selesai. ${result.success} siswa berhasil ditambahkan.`;
            if (result.classesCreated.length > 0) {
                message += ` ${result.classesCreated.length} kelas baru dibuat: ${result.classesCreated.join(', ')}.`;
            }
            return response.json({
                message,
                success: result.success,
                errors: result.errors,
                duplicates: result.duplicates,
                classesCreated: result.classesCreated
            });
        }
        catch (error) {
            console.error('Error importing CSV:', error);
            return response.status(500).json({ error: 'Gagal mengimport data CSV' });
        }
    }
    async exportCSV(request, response) {
        try {
            const search = request.query.search;
            const kelas = request.query.kelas;
            const gender = request.query.gender;
            const csvContent = await StudentService_1.default.exportToCSV({ search, kelas, gender });
            response.setHeader('Content-Type', 'text/csv; charset=utf-8');
            response.setHeader('Content-Disposition', 'attachment; filename="data_siswa.csv"');
            return response.send(csvContent);
        }
        catch (error) {
            console.error('Error exporting CSV:', error);
            return response.status(500).json({ error: 'Gagal mengexport data CSV' });
        }
    }
    async downloadTemplate(request, response) {
        try {
            const csvContent = StudentService_1.default.generateCSVTemplate();
            response.setHeader('Content-Type', 'text/csv; charset=utf-8');
            response.setHeader('Content-Disposition', 'attachment; filename="template_siswa.csv"');
            return response.send(csvContent);
        }
        catch (error) {
            console.error('Error downloading template:', error);
            return response.status(500).json({ error: 'Gagal mendownload template' });
        }
    }
    async bulkDelete(request, response) {
        try {
            const { ids } = await request.json();
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return response.status(400).json({ error: 'ID siswa tidak valid' });
            }
            const deletedCount = await StudentService_1.default.bulkDeleteStudents(ids);
            return response.json({
                message: `${deletedCount} siswa berhasil dihapus`,
                count: deletedCount
            });
        }
        catch (error) {
            console.error('Error bulk deleting students:', error);
            return response.status(500).json({ error: 'Gagal menghapus siswa' });
        }
    }
}
exports.default = new StudentController();
//# sourceMappingURL=StudentController.js.map