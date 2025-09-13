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
        try {
            const data = await request.json();
            
            // Validate data
            const errors = SubjectService.validateSubjectData(data);
            if (errors.length > 0) {
                return response.status(422).json({ 
                    error: 'Data tidak valid', 
                    errors: errors.map(e => `${e.field}: ${e.message}`)
                });
            }
            
            // Check if subject code already exists
            const existingSubject = await SubjectService.getSubjectByCode(data.kode);
            if (existingSubject) {
                return response.status(422).json({ 
                    error: 'Kode mata pelajaran sudah digunakan' 
                });
            }
            
            const subject = await SubjectService.createSubject(data);
            return response.status(201).json({ 
                message: 'Mata pelajaran berhasil ditambahkan', 
                data: subject 
            });
        } catch (error) {
            console.error('Error creating subject:', error);
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
            
            const subject = await SubjectService.updateSubject(id, data);
            return response.json({ 
                message: 'Mata pelajaran berhasil diperbarui', 
                data: subject 
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
            return response.json({ message: 'Mata pelajaran berhasil dihapus' });
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
    
    /**
     * Show teacher assignment page
     */
    public async assignTeachers(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService.getSubjectById(id);
            
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            
            const assignedTeachers = await SubjectService.getSubjectTeachers(id);
            const availableTeachers = await SubjectService.getAvailableTeachers();
            
            return response.inertia("admin/subjects/assign-teachers", {
                subject,
                assignedTeachers,
                availableTeachers
            });
        } catch (error) {
            console.error('Error loading teacher assignment page:', error);
            return response.status(500).json({ error: 'Gagal memuat halaman assignment guru' });
        }
    }
    
    /**
     * Assign teacher to subject
     */
    public async assignTeacher(request: Request, response: Response) {
        try {
            const { id } = request.params; // subject id
            const { teacher_id } = await request.json();
            
            if (!teacher_id) {
                return response.status(422).json({ error: 'ID guru wajib diisi' });
            }
            
            const subject = await SubjectService.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            
            await SubjectService.assignTeacherToSubject(teacher_id, id);
            return response.json({ message: 'Guru berhasil ditugaskan ke mata pelajaran' });
        } catch (error) {
            console.error('Error assigning teacher:', error);
            if (error instanceof Error && error.message.includes('sudah ditugaskan')) {
                return response.status(422).json({ error: error.message });
            }
            return response.status(500).json({ error: 'Gagal menugaskan guru' });
        }
    }
    
    /**
     * Unassign teacher from subject
     */
    public async unassignTeacher(request: Request, response: Response) {
        try {
            const { id } = request.params; // subject id
            const { teacher_id } = await request.json();
            
            if (!teacher_id) {
                return response.status(422).json({ error: 'ID guru wajib diisi' });
            }
            
            await SubjectService.unassignTeacherFromSubject(teacher_id, id);
            return response.json({ message: 'Guru berhasil dibatalkan dari mata pelajaran' });
        } catch (error) {
            console.error('Error unassigning teacher:', error);
            return response.status(500).json({ error: 'Gagal membatalkan assignment guru' });
        }
    }
    
    /**
     * Show class assignment page
     */
    public async assignClasses(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const subject = await SubjectService.getSubjectById(id);
            
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            
            const assignedClasses = await SubjectService.getSubjectClasses(id);
            const availableClasses = await SubjectService.getAvailableClasses();
            const availableTeachers = await SubjectService.getAvailableTeachers();
            
            return response.inertia("admin/subjects/assign-classes", {
                subject,
                assignedClasses,
                availableClasses,
                availableTeachers
            });
        } catch (error) {
            console.error('Error loading class assignment page:', error);
            return response.status(500).json({ error: 'Gagal memuat halaman assignment kelas' });
        }
    }
    
    /**
     * Assign subject to class
     */
    public async assignToClass(request: Request, response: Response) {
        try {
            const { id } = request.params; // subject id
            const data = await request.json();
            
            if (!data.class_id) {
                return response.status(422).json({ error: 'ID kelas wajib diisi' });
            }
            
            const subject = await SubjectService.getSubjectById(id);
            if (!subject) {
                return response.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
            }
            
            const assignmentData = {
                subject_id: id,
                class_id: data.class_id,
                teacher_id: data.teacher_id,
                jam_per_minggu: data.jam_per_minggu,
                notes: data.notes
            };
            
            await SubjectService.assignSubjectToClass(assignmentData);
            return response.json({ message: 'Mata pelajaran berhasil ditugaskan ke kelas' });
        } catch (error) {
            console.error('Error assigning subject to class:', error);
            if (error instanceof Error && error.message.includes('sudah ditugaskan')) {
                return response.status(422).json({ error: error.message });
            }
            return response.status(500).json({ error: 'Gagal menugaskan mata pelajaran ke kelas' });
        }
    }
    
    /**
     * Update subject-class assignment
     */
    public async updateClassAssignment(request: Request, response: Response) {
        try {
            const { assignmentId } = request.params;
            const data = await request.json();
            
            await SubjectService.updateSubjectClassAssignment(assignmentId, data);
            return response.json({ message: 'Assignment berhasil diupdate' });
        } catch (error) {
            console.error('Error updating class assignment:', error);
            return response.status(500).json({ error: 'Gagal mengupdate assignment' });
        }
    }
    
    /**
     * Unassign subject from class
     */
    public async unassignFromClass(request: Request, response: Response) {
        try {
            const { id } = request.params; // subject id
            const { class_id } = await request.json();
            
            if (!class_id) {
                return response.status(422).json({ error: 'ID kelas wajib diisi' });
            }
            
            await SubjectService.unassignSubjectFromClass(id, class_id);
            return response.json({ message: 'Mata pelajaran berhasil dibatalkan dari kelas' });
        } catch (error) {
            console.error('Error unassigning subject from class:', error);
            return response.status(500).json({ error: 'Gagal membatalkan assignment kelas' });
        }
    }
}

export default new SubjectController();