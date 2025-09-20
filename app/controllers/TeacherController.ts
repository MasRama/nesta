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
        let data: any;
        const requestId = Date.now() + '-' + Math.random().toString(36).substring(2, 11);

        try {
            data = await request.json();
            console.log(`[${requestId}] Creating teacher with data:`, { nip: data.nip, nama: data.nama, email: data.email });

            // Validate data
            const errors = TeacherService.validateTeacherData(data);
            if (errors.length > 0) {
                console.log(`[${requestId}] Validation failed:`, errors);
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }

            console.log(`[${requestId}] Calling TeacherService.createTeacher`);
            const newTeacher = await TeacherService.createTeacher(data);
            console.log(`[${requestId}] Teacher created successfully`);

            return response.status(201).json({
                success: true,
                message: 'Guru berhasil ditambahkan',
                data: newTeacher
            });
        } catch (error: any) {
            console.error(`[${requestId}] Error creating teacher:`, error);

            // Handle UNIQUE constraint violation
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
                // If we have the data and it's a duplicate, check if teacher exists and return success
                if (data && (data.nip || data.email)) {
                    try {
                        const existingTeacher = data.nip
                            ? await TeacherService.getTeacherByNIP(data.nip)
                            : await TeacherService.getTeacherByEmail(data.email);

                        if (existingTeacher) {
                            // Return success response for idempotent operation
                            return response.status(200).json({
                                success: true,
                                message: 'Guru sudah ada (operasi idempotent)',
                                data: existingTeacher
                            });
                        }
                    } catch (checkError) {
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
            console.log('Loading teacher for edit, ID:', id);

            const teacher = await TeacherService.getTeacherByIdForEdit(id);
            console.log('Teacher data loaded:', teacher ? 'Found' : 'Not found');

            if (!teacher) {
                console.log('Teacher not found, redirecting to teachers list');
                // Redirect to teachers list with error message instead of JSON response
                return response.redirect("/admin/teachers?error=teacher_not_found");
            }

            console.log('Rendering edit page with teacher data');
            return response.inertia("admin/teachers/edit", { teacher });
        } catch (error) {
            console.error('Error loading edit form:', error);
            // Redirect to teachers list with error message instead of JSON response
            return response.redirect("/admin/teachers?error=load_failed");
        }
    }
    
    /**
     * Update teacher
     */
    public async update(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            
            // Check if teacher exists (use edit method to allow updating inactive teachers)
            const existingTeacher = await TeacherService.getTeacherByIdForEdit(id);
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
            
            const updatedTeacher = await TeacherService.updateTeacher(id, data);
            return response.status(200).json({
                success: true,
                message: 'Data guru berhasil diperbarui',
                data: updatedTeacher
            });
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

            const teacher = await TeacherService.getTeacherByIdForEdit(id);
            if (!teacher) {
                return response.status(404).json({
                    success: false,
                    error: 'Guru tidak ditemukan'
                });
            }

            await TeacherService.deleteTeacher(id);
            return response.status(200).json({
                success: true,
                message: 'Guru berhasil dihapus',
                data: { id }
            });
        } catch (error) {
            console.error('Error deleting teacher:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal menghapus guru'
            });
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