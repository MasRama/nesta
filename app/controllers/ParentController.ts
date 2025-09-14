import { Request, Response } from "../../type";
import ParentService from "../services/ParentService";
import StudentService from "../services/StudentService";

class ParentController {
    /**
     * Get all parents with pagination and filters
     */
    public async index(request: Request, response: Response) {
        try {
            const page = parseInt(request.query.page as string) || 1;
            const limit = parseInt(request.query.limit as string) || 10;
            const search = request.query.search as string;
            
            const result = await ParentService.getParents(page, limit, search);
            
            return response.inertia("admin/parents/index", {
                parents: result.data,
                total: result.pagination.total,
                page: result.pagination.page,
                limit: result.pagination.limit,
                totalPages: result.pagination.totalPages,
                filters: { search }
            });
        } catch (error) {
            console.error('Error fetching parents:', error);
            return response.status(500).json({ error: 'Gagal mengambil data wali murid' });
        }
    }
    
    /**
     * Show create parent form
     */
    public async create(request: Request, response: Response) {
        try {
            return response.inertia("admin/parents/create", {});
        } catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form tambah wali murid' });
        }
    }
    
    /**
     * Store new parent
     */
    public async store(request: Request, response: Response) {
        const requestId = Math.random().toString(36).substring(7);
        let data: any;

        try {
            data = await request.json();
            console.log(`[${requestId}] Creating parent with data:`, { nama: data.nama, email: data.email });

            // Validate data
            const errors = ParentService.validateParentData(data);
            if (errors.length > 0) {
                console.log(`[${requestId}] Validation failed:`, errors);
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }

            // Check if email already exists
            const existingParent = await ParentService.getParentByEmail(data.email);
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
            const parent = await ParentService.createParent(data);
            console.log(`[${requestId}] Parent created successfully`);

            // Add students if provided
            if (data.students && Array.isArray(data.students)) {
                for (const studentData of data.students) {
                    const student = await StudentService.getStudentByNIPD(studentData.nipd);
                    if (student) {
                        await ParentService.addStudentToParent(
                            parent.id,
                            student.id,
                            studentData.relationship_type || 'wali',
                            studentData.is_primary_contact || false
                        );
                    }
                }
            }

            return response.redirect("/admin/parents");
        } catch (error: any) {
            console.error(`[${requestId}] Error creating parent:`, error);
            
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
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
    
    /**
     * Show parent detail
     */
    public async show(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const parent = await ParentService.getParentById(id);
            
            if (!parent) {
                return response.status(404).json({ error: 'Wali murid tidak ditemukan' });
            }
            
            const students = await ParentService.getParentStudents(id);
            
            return response.inertia("admin/parents/show", { 
                parent,
                students
            });
        } catch (error) {
            console.error('Error fetching parent:', error);
            return response.status(500).json({ error: 'Gagal mengambil data wali murid' });
        }
    }
    
    /**
     * Show edit parent form
     */
    public async edit(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const parent = await ParentService.getParentById(id);
            
            if (!parent) {
                return response.status(404).json({ error: 'Wali murid tidak ditemukan' });
            }
            
            const students = await ParentService.getParentStudents(id);
            
            return response.inertia("admin/parents/edit", { 
                parent,
                students
            });
        } catch (error) {
            console.error('Error loading edit form:', error);
            return response.status(500).json({ error: 'Gagal memuat form edit wali murid' });
        }
    }
    
    /**
     * Update parent
     */
    public async update(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            
            // Validate data
            const errors = ParentService.validateParentData(data);
            if (errors.length > 0) {
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }
            
            // Check if email already exists (excluding current parent)
            const existingParent = await ParentService.getParentByEmail(data.email);
            if (existingParent && existingParent.id !== id) {
                return response.status(400).json({
                    error: 'Email sudah digunakan',
                    errors: [{
                        field: 'email',
                        message: 'Email sudah digunakan oleh wali murid lain',
                        value: data.email
                    }]
                });
            }
            
            await ParentService.updateParent(id, data);
            return response.redirect("/admin/parents");
        } catch (error) {
            console.error('Error updating parent:', error);
            return response.status(500).json({ error: 'Gagal mengupdate wali murid' });
        }
    }
    
    /**
     * Delete parent
     */
    public async destroy(request: Request, response: Response) {
        try {
            const { id } = request.params;
            await ParentService.deleteParent(id);
            return response.json({ message: 'Wali murid berhasil dihapus' });
        } catch (error) {
            console.error('Error deleting parent:', error);
            return response.status(500).json({ error: 'Gagal menghapus wali murid' });
        }
    }
    
    /**
     * Get parents API (for AJAX requests)
     */
    public async getParentsAPI(request: Request, response: Response) {
        try {
            const page = parseInt(request.query.page as string) || 1;
            const limit = parseInt(request.query.limit as string) || 10;
            const search = request.query.search as string;

            const result = await ParentService.getParents(page, limit, search);
            return response.json(result);
        } catch (error) {
            console.error('Error fetching parents API:', error);
            return response.status(500).json({ error: 'Gagal mengambil data wali murid' });
        }
    }
    
    /**
     * Search student by NIPD
     */
    public async searchStudentByNipd(request: Request, response: Response) {
        try {
            const { nipd } = request.query;
            
            if (!nipd) {
                return response.status(400).json({ error: 'NIPD harus diisi' });
            }
            
            const student = await ParentService.searchStudentByNipd(nipd as string);
            
            if (!student) {
                return response.status(404).json({ error: 'Siswa dengan NIPD tersebut tidak ditemukan' });
            }
            
            return response.json({ student });
        } catch (error) {
            console.error('Error searching student by NIPD:', error);
            return response.status(500).json({ error: 'Gagal mencari siswa' });
        }
    }
    
    /**
     * Add student to parent
     */
    public async addStudent(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const { nipd, relationship_type, is_primary_contact } = await request.json();
            
            const student = await ParentService.searchStudentByNipd(nipd);
            if (!student) {
                return response.status(404).json({ error: 'Siswa dengan NIPD tersebut tidak ditemukan' });
            }
            
            await ParentService.addStudentToParent(id, student.id, relationship_type, is_primary_contact);
            return response.json({ message: 'Siswa berhasil ditambahkan' });
        } catch (error) {
            console.error('Error adding student to parent:', error);
            return response.status(500).json({ error: 'Gagal menambahkan siswa' });
        }
    }
    
    /**
     * Remove student from parent
     */
    public async removeStudent(request: Request, response: Response) {
        try {
            const { id, studentId } = request.params;
            await ParentService.removeStudentFromParent(id, studentId);
            return response.json({ message: 'Siswa berhasil dihapus dari wali murid' });
        } catch (error) {
            console.error('Error removing student from parent:', error);
            return response.status(500).json({ error: 'Gagal menghapus siswa dari wali murid' });
        }
    }
}

export default new ParentController();
