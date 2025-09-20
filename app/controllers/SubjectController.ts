import { Request, Response } from "../../type";
import SubjectService from "../services/SubjectService";

class SubjectController {
    /**
     * Get all subjects with pagination and filters
     */
    public async index(request: Request, response: Response) {
        try {
            const page = parseInt(request.query.page as string) || 1;
            const limit = parseInt(request.query.limit as string) || 10;
            const search = request.query.search as string;
            
            const result = await SubjectService.getSubjects(page, limit, search);
            
            return response.inertia("admin/subjects/index", {
                subjects: result.data,
                total: result.pagination.total,
                page: result.pagination.page,
                limit: result.pagination.limit,
                totalPages: result.pagination.totalPages,
                filters: { search }
            });
        } catch (error) {
            console.error('Error fetching subjects:', error);
            return response.status(500).json({ error: 'Gagal mengambil data mata pelajaran' });
        }
    }
    
    /**
     * Show create subject form
     */
    public async create(request: Request, response: Response) {
        try {
            return response.inertia("admin/subjects/create");
        } catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form' });
        }
    }
    
    /**
     * Store new subject
     */
    public async store(request: Request, response: Response) {
        let data: any;
        const requestId = Date.now() + '-' + Math.random().toString(36).substring(2, 11);

        try {
            data = await request.json();
            console.log(`[${requestId}] Creating subject with data:`, { kode: data.kode, nama: data.nama });

            // Validate data
            const errors = SubjectService.validateSubjectData(data);
            if (errors.length > 0) {
                console.log(`[${requestId}] Validation failed:`, errors);
                return response.status(400).json({
                    error: 'Data tidak valid',
                    errors
                });
            }

            console.log(`[${requestId}] Calling SubjectService.createSubject`);
            const newSubject = await SubjectService.createSubject(data);
            console.log(`[${requestId}] Subject created successfully`);

            return response.status(201).json({
                success: true,
                message: 'Mata pelajaran berhasil ditambahkan',
                data: newSubject
            });
        } catch (error: any) {
            console.error(`[${requestId}] Error creating subject:`, error);

            // Handle UNIQUE constraint violation
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
                // If we have the data and it's a duplicate, check if subject exists and return success
                if (data && data.kode) {
                    try {
                        const existingSubject = await SubjectService.getSubjectByCode(data.kode);
                        if (existingSubject) {
                            // Return success response for idempotent operation
                            return response.status(201).json({
                                success: true,
                                message: 'Mata pelajaran berhasil ditambahkan',
                                data: existingSubject
                            });
                        }
                    } catch (checkError) {
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
    
    /**
     * Show subject details
     */
    public async show(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService.getSubjectById(id);
            
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            
            const teachers = await SubjectService.getSubjectTeachers(id);
            
            return response.inertia("admin/subjects/show", { subject, teachers });
        } catch (error) {
            console.error('Error fetching subject:', error);
            return response.status(500).json({ error: 'Gagal mengambil data mata pelajaran' });
        }
    }
    
    /**
     * Show edit subject form
     */
    public async edit(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService.getSubjectById(id);
            
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            
            return response.inertia("admin/subjects/edit", { subject });
        } catch (error) {
            console.error('Error loading edit form:', error);
            return response.status(500).json({ error: 'Gagal memuat form edit' });
        }
    }
    
    /**
     * Update subject
     */
    public async update(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            
            // Check if subject exists
            const existingSubject = await SubjectService.getSubjectById(id);
            if (!existingSubject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            
            // Validate data
            const errors = SubjectService.validateSubjectData(data);
            if (errors.length > 0) {
                return response.status(422).json({ 
                    error: 'Data tidak valid', 
                    errors: errors.map(e => `${e.field}: ${e.message}`)
                });
            }
            
            // Check if subject code already exists (excluding current subject)
            if (data.kode !== existingSubject.kode) {
                const duplicateSubject = await SubjectService.getSubjectByCode(data.kode);
                if (duplicateSubject) {
                    return response.status(422).json({ 
                        error: 'Kode mata pelajaran sudah digunakan' 
                    });
                }
            }
            
            const updatedSubject = await SubjectService.updateSubject(id, data);
            return response.status(200).json({
                success: true,
                message: 'Data mata pelajaran berhasil diperbarui',
                data: updatedSubject
            });
        } catch (error) {
            console.error('Error updating subject:', error);
            return response.status(500).json({ error: 'Gagal memperbarui mata pelajaran' });
        }
    }
    
    /**
     * Delete subject
     */
    public async destroy(request: Request, response: Response) {
        try {
            const { id } = request.params;
            
            const subject = await SubjectService.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            
            await SubjectService.deleteSubject(id);
            return response.json({
                success: true,
                message: 'Mata pelajaran berhasil dihapus'
            });
        } catch (error) {
            console.error('Error deleting subject:', error);
            return response.status(500).json({ error: 'Gagal menghapus mata pelajaran' });
        }
    }
    
    /**
     * Get subjects API (for dropdowns, etc.)
     */
    public async getSubjectsAPI(request: Request, response: Response) {
        try {
            const search = request.query.search as string;
            const result = await SubjectService.getSubjects(1, 100, search);
            return response.json({ data: result.data });
        } catch (error) {
            console.error('Error fetching subjects API:', error);
            return response.status(500).json({ error: 'Gagal mengambil data mata pelajaran' });
        }
    }
}

export default new SubjectController();