import { Request, Response } from "../../type";
import TeacherService from "../services/TeacherService";

class TeacherController {
    /**
     * Get all teachers with pagination and filters
     */
    public async index(request: Request, response: Response) {
        try {
            const page = parseInt(request.query.page as string) || 1;
            const limit = parseInt(request.query.limit as string) || 10;
            const search = request.query.search as string;
            
            const result = await TeacherService.getTeachers(page, limit, search);
            
            return response.inertia("admin/teachers/index", {
                teachers: result.data,
                total: result.pagination.total,
                page: result.pagination.page,
                limit: result.pagination.limit,
                totalPages: result.pagination.totalPages,
                filters: { search }
            });
        } catch (error) {
            console.error('Error fetching teachers:', error);
            return response.status(500).json({ error: 'Gagal mengambil data guru' });
        }
    }
    
    /**
     * Show create teacher form
     */
    public async create(request: Request, response: Response) {
        try {
            return response.inertia("admin/teachers/create");
        } catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form' });
        }
    }
    
    /**
     * Store new teacher
     */
    public async store(request: Request, response: Response) {
        try {
            const data = await request.json();
            
            // Validate data
            const errors = TeacherService.validateTeacherData(data);
            if (errors.length > 0) {
                return response.status(400).json({ 
                    error: 'Data tidak valid', 
                    errors 
                });
            }
            
            // Check if NIP already exists
            const existingTeacher = await TeacherService.getTeacherByNIP(data.nip);
            if (existingTeacher) {
                return response.status(400).json({ 
                    error: 'NIP sudah terdaftar' 
                });
            }
            
            // Check if email already exists
            const existingEmail = await TeacherService.getTeacherByEmail(data.email);
            if (existingEmail) {
                return response.status(400).json({ 
                    error: 'Email sudah terdaftar' 
                });
            }
            
            await TeacherService.createTeacher(data);
            return response.redirect("/admin/teachers");
        } catch (error) {
            console.error('Error creating teacher:', error);
            return response.status(500).json({ error: 'Gagal menambahkan guru' });
        }
    }
    
    /**
     * Show teacher detail
     */
    public async show(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const teacher = await TeacherService.getTeacherById(id);
            
            if (!teacher) {
                return response.status(404).json({ error: 'Guru tidak ditemukan' });
            }
            
            return response.inertia("admin/teachers/show", { teacher });
        } catch (error) {
            console.error('Error fetching teacher:', error);
            return response.status(500).json({ error: 'Gagal mengambil data guru' });
        }
    }
    
    /**
     * Show edit teacher form
     */
    public async edit(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const teacher = await TeacherService.getTeacherById(id);
            
            if (!teacher) {
                return response.status(404).json({ error: 'Guru tidak ditemukan' });
            }
            
            return response.inertia("admin/teachers/edit", { teacher });
        } catch (error) {
            console.error('Error loading edit form:', error);
            return response.status(500).json({ error: 'Gagal memuat form edit' });
        }
    }
    
    /**
     * Update teacher
     */
    public async update(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            
            // Check if teacher exists
            const existingTeacher = await TeacherService.getTeacherById(id);
            if (!existingTeacher) {
                return response.status(404).json({ error: 'Guru tidak ditemukan' });
            }
            
            // Validate data (skip password validation if not provided)
            const validationData = { ...data };
            if (!data.password || data.password.trim() === '') {
                delete validationData.password;
            }
            
            const errors = TeacherService.validateTeacherData(validationData);
            if (errors.length > 0) {
                return response.status(400).json({ 
                    error: 'Data tidak valid', 
                    errors 
                });
            }
            
            // Check if NIP already exists (exclude current teacher)
            if (data.nip !== existingTeacher.nip) {
                const duplicateNIP = await TeacherService.getTeacherByNIP(data.nip);
                if (duplicateNIP) {
                    return response.status(400).json({ 
                        error: 'NIP sudah terdaftar' 
                    });
                }
            }
            
            // Check if email already exists (exclude current teacher)
            if (data.email !== existingTeacher.email) {
                const duplicateEmail = await TeacherService.getTeacherByEmail(data.email);
                if (duplicateEmail) {
                    return response.status(400).json({ 
                        error: 'Email sudah terdaftar' 
                    });
                }
            }
            
            await TeacherService.updateTeacher(id, data);
            return response.redirect("/admin/teachers");
        } catch (error) {
            console.error('Error updating teacher:', error);
            return response.status(500).json({ error: 'Gagal memperbarui data guru' });
        }
    }
    
    /**
     * Delete teacher (soft delete)
     */
    public async destroy(request: Request, response: Response) {
        try {
            const { id } = request.params;
            
            const teacher = await TeacherService.getTeacherById(id);
            if (!teacher) {
                return response.status(404).json({ error: 'Guru tidak ditemukan' });
            }
            
            await TeacherService.deleteTeacher(id);
            return response.redirect("/admin/teachers");
        } catch (error) {
            console.error('Error deleting teacher:', error);
            return response.status(500).json({ error: 'Gagal menghapus guru' });
        }
    }
    
    /**
     * Get teachers API (for AJAX requests)
     */
    public async getTeachersAPI(request: Request, response: Response) {
        try {
            const page = parseInt(request.query.page as string) || 1;
            const limit = parseInt(request.query.limit as string) || 10;
            const search = request.query.search as string;

            const result = await TeacherService.getTeachers(page, limit, search);
            return response.json(result);
        } catch (error) {
            console.error('Error fetching teachers API:', error);
            return response.status(500).json({ error: 'Gagal mengambil data guru' });
        }
    }
}

export default new TeacherController();