import { Request, Response } from "../../type";
import StudentService from "../services/StudentService";

class StudentController {
    /**
     * Get all students with pagination and filters
     */
    public async index(request: Request, response: Response) {
        try {
            const page = parseInt(request.query.page as string) || 1;
            const limit = parseInt(request.query.limit as string) || 10;
            const search = request.query.search as string;
            const kelas = request.query.kelas as string;
            const gender = request.query.gender as string;
            
            const result = await StudentService.getStudents(page, limit, search, kelas, gender);
            const classes = await StudentService.getClasses();
            
            return response.inertia("admin/students/index", {
                ...result,
                classes,
                filters: { search, kelas, gender }
            });
        } catch (error) {
            console.error('Error fetching students:', error);
            return response.status(500).json({ error: 'Gagal mengambil data siswa' });
        }
    }
    
    /**
     * Show create student form
     */
    public async create(request: Request, response: Response) {
        try {
            const classes = await StudentService.getClasses();
            return response.inertia("admin/students/create", { classes });
        } catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form' });
        }
    }
    
    /**
     * Store new student
     */
    public async store(request: Request, response: Response) {
        try {
            const data = await request.json();
            
            // Validate data
            const errors = StudentService.validateStudentData(data);
            if (errors.length > 0) {
                return response.status(400).json({ 
                    error: 'Data tidak valid', 
                    errors 
                });
            }
            
            // Check if NIPD already exists
            const existingStudent = await StudentService.getStudentByNIPD(data.nipd);
            if (existingStudent) {
                return response.status(400).json({ 
                    error: 'NIPD sudah terdaftar' 
                });
            }
            
            const student = await StudentService.createStudent(data);
            return response.json({ 
                message: 'Siswa berhasil ditambahkan', 
                student 
            });
        } catch (error) {
            console.error('Error creating student:', error);
            return response.status(500).json({ error: 'Gagal menambahkan siswa' });
        }
    }
    
    /**
     * Show student detail
     */
    public async show(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const student = await StudentService.getStudentById(id);
            
            if (!student) {
                return response.status(404).json({ error: 'Siswa tidak ditemukan' });
            }
            
            return response.inertia("admin/students/show", { student });
        } catch (error) {
            console.error('Error fetching student:', error);
            return response.status(500).json({ error: 'Gagal mengambil data siswa' });
        }
    }
    
    /**
     * Show edit student form
     */
    public async edit(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const student = await StudentService.getStudentById(id);
            
            if (!student) {
                return response.status(404).json({ error: 'Siswa tidak ditemukan' });
            }
            
            const classes = await StudentService.getClasses();
            return response.inertia("admin/students/edit", { student, classes });
        } catch (error) {
            console.error('Error loading edit form:', error);
            return response.status(500).json({ error: 'Gagal memuat form edit' });
        }
    }
    
    /**
     * Update student
     */
    public async update(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            
            // Check if student exists
            const existingStudent = await StudentService.getStudentById(id);
            if (!existingStudent) {
                return response.status(404).json({ error: 'Siswa tidak ditemukan' });
            }
            
            // Validate data
            const errors = StudentService.validateStudentData(data);
            if (errors.length > 0) {
                return response.status(400).json({ 
                    error: 'Data tidak valid', 
                    errors 
                });
            }
            
            // Check if NIPD already exists (exclude current student)
            if (data.nipd !== existingStudent.nipd) {
                const duplicateStudent = await StudentService.getStudentByNIPD(data.nipd);
                if (duplicateStudent) {
                    return response.status(400).json({ 
                        error: 'NIPD sudah terdaftar' 
                    });
                }
            }
            
            const student = await StudentService.updateStudent(id, data);
            return response.json({ 
                message: 'Data siswa berhasil diperbarui', 
                student 
            });
        } catch (error) {
            console.error('Error updating student:', error);
            return response.status(500).json({ error: 'Gagal memperbarui data siswa' });
        }
    }
    
    /**
     * Delete student (soft delete)
     */
    public async destroy(request: Request, response: Response) {
        try {
            const { id } = request.params;
            
            const student = await StudentService.getStudentById(id);
            if (!student) {
                return response.status(404).json({ error: 'Siswa tidak ditemukan' });
            }
            
            await StudentService.deleteStudent(id);
            return response.json({ message: 'Siswa berhasil dihapus' });
        } catch (error) {
            console.error('Error deleting student:', error);
            return response.status(500).json({ error: 'Gagal menghapus siswa' });
        }
    }
    
    /**
     * Get students API (for AJAX requests)
     */
    public async getStudentsAPI(request: Request, response: Response) {
        try {
            const page = parseInt(request.query.page as string) || 1;
            const limit = parseInt(request.query.limit as string) || 10;
            const search = request.query.search as string;
            const kelas = request.query.kelas as string;
            const gender = request.query.gender as string;

            const result = await StudentService.getStudents(page, limit, search, kelas, gender);
            return response.json(result);
        } catch (error) {
            console.error('Error fetching students API:', error);
            return response.status(500).json({ error: 'Gagal mengambil data siswa' });
        }
    }

    /**
     * Import students from CSV with auto-create class functionality
     */
    public async importCSV(request: Request, response: Response) {
        try {
            const { csvContent } = await request.json();

            if (!csvContent) {
                return response.status(400).json({ error: 'File CSV tidak ditemukan' });
            }

            const result = await StudentService.importFromCSV(csvContent);

            // Build success message with class creation info
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
        } catch (error) {
            console.error('Error importing CSV:', error);
            return response.status(500).json({ error: 'Gagal mengimport data CSV' });
        }
    }

    /**
     * Export students to CSV
     */
    public async exportCSV(request: Request, response: Response) {
        try {
            const search = request.query.search as string;
            const kelas = request.query.kelas as string;
            const gender = request.query.gender as string;

            const csvContent = await StudentService.exportToCSV({ search, kelas, gender });

            response.setHeader('Content-Type', 'text/csv; charset=utf-8');
            response.setHeader('Content-Disposition', 'attachment; filename="data_siswa.csv"');

            return response.send(csvContent);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            return response.status(500).json({ error: 'Gagal mengexport data CSV' });
        }
    }

    /**
     * Download CSV template
     */
    public async downloadTemplate(request: Request, response: Response) {
        try {
            const csvContent = StudentService.generateCSVTemplate();

            response.setHeader('Content-Type', 'text/csv; charset=utf-8');
            response.setHeader('Content-Disposition', 'attachment; filename="template_siswa.csv"');

            return response.send(csvContent);
        } catch (error) {
            console.error('Error downloading template:', error);
            return response.status(500).json({ error: 'Gagal mendownload template' });
        }
    }
    
    /**
     * Bulk delete students
     */
    public async bulkDelete(request: Request, response: Response) {
        try {
            const { ids } = await request.json();
            
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return response.status(400).json({ error: 'ID siswa tidak valid' });
            }
            
            const deletedCount = await StudentService.bulkDeleteStudents(ids);
            return response.json({ 
                message: `${deletedCount} siswa berhasil dihapus`,
                count: deletedCount
            });
        } catch (error) {
            console.error('Error bulk deleting students:', error);
            return response.status(500).json({ error: 'Gagal menghapus siswa' });
        }
    }
}

export default new StudentController();
