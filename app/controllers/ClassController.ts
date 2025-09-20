import { Request, Response } from "../../type";
import ClassService from "../services/ClassService";

class ClassController {
    /**
     * Show classes management page
     */
    public async index(request: Request, response: Response) {
        try {
            const classes = await ClassService.getUniqueClasses();
            
            return response.inertia("admin/classes/index", {
                classes
            });
        } catch (error) {
            console.error('Error fetching classes:', error);
            return response.status(500).json({ error: 'Gagal mengambil data kelas' });
        }
    }

    /**
     * Get classes data for API calls
     */
    public async getClassesAPI(request: Request, response: Response) {
        try {
            const classes = await ClassService.getUniqueClasses();
            
            return response.json({
                success: true,
                data: classes
            });
        } catch (error) {
            console.error('Error fetching classes API:', error);
            return response.status(500).json({ 
                success: false,
                error: 'Gagal mengambil data kelas' 
            });
        }
    }

    /**
     * Get available teachers for assignment modal
     */
    public async getAvailableTeachers(request: Request, response: Response) {
        try {
            const teachers = await ClassService.getAvailableTeachers();
            
            return response.json({
                success: true,
                data: teachers
            });
        } catch (error) {
            console.error('Error fetching available teachers:', error);
            return response.status(500).json({ 
                success: false,
                error: 'Gagal mengambil data guru' 
            });
        }
    }

    /**
     * Get available subjects for assignment modal
     */
    public async getAvailableSubjects(request: Request, response: Response) {
        try {
            const subjects = await ClassService.getAvailableSubjects();
            
            return response.json({
                success: true,
                data: subjects
            });
        } catch (error) {
            console.error('Error fetching available subjects:', error);
            return response.status(500).json({ 
                success: false,
                error: 'Gagal mengambil data mata pelajaran' 
            });
        }
    }

    /**
     * Get subjects assigned to a specific class
     */
    public async getClassSubjects(request: Request, response: Response) {
        try {
            const { className } = request.params;
            
            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }

            const subjects = await ClassService.getClassSubjects(decodeURIComponent(className));
            
            return response.json({
                success: true,
                data: subjects
            });
        } catch (error) {
            console.error('Error fetching class subjects:', error);
            return response.status(500).json({ 
                success: false,
                error: 'Gagal mengambil mata pelajaran kelas' 
            });
        }
    }

    /**
     * Assign teacher as homeroom teacher to class
     */
    public async assignTeacher(request: Request, response: Response) {
        try {
            const { className } = request.params;
            const data = await request.json();

            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }

            if (!data.teacher_id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID guru wajib diisi'
                });
            }

            await ClassService.assignTeacherToClass(
                decodeURIComponent(className), 
                data.teacher_id
            );

            return response.json({
                success: true,
                message: 'Wali kelas berhasil ditugaskan'
            });

        } catch (error: any) {
            console.error('Error assigning teacher to class:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal menugaskan wali kelas'
            });
        }
    }

    /**
     * Unassign teacher from class
     */
    public async unassignTeacher(request: Request, response: Response) {
        try {
            const { className } = request.params;

            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }

            await ClassService.unassignTeacherFromClass(decodeURIComponent(className));

            return response.json({
                success: true,
                message: 'Wali kelas berhasil dibatalkan'
            });

        } catch (error: any) {
            console.error('Error unassigning teacher from class:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal membatalkan penugasan wali kelas'
            });
        }
    }

    /**
     * Assign subject to class
     */
    public async assignSubject(request: Request, response: Response) {
        try {
            const { className } = request.params;
            const data = await request.json();

            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }

            if (!data.subject_id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID mata pelajaran wajib diisi'
                });
            }

            if (!data.teacher_id) {
                return response.status(400).json({
                    success: false,
                    error: 'Guru wajib dipilih'
                });
            }

            if (!data.day || !data.start_time || !data.end_time) {
                return response.status(400).json({
                    success: false,
                    error: 'Hari, waktu mulai, dan waktu selesai wajib diisi'
                });
            }

            await ClassService.assignSubjectToClass(
                decodeURIComponent(className),
                data.subject_id,
                data.teacher_id,
                data.day,
                data.start_time,
                data.end_time,
                data.notes || null
            );

            return response.json({
                success: true,
                message: 'Mata pelajaran berhasil ditugaskan ke kelas'
            });

        } catch (error: any) {
            console.error('Error assigning subject to class:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal menugaskan mata pelajaran'
            });
        }
    }

    /**
     * Unassign subject from class
     */
    public async unassignSubject(request: Request, response: Response) {
        try {
            const { className } = request.params;
            const data = await request.json();

            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }

            if (!data.subject_id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID mata pelajaran wajib diisi'
                });
            }

            await ClassService.unassignSubjectFromClass(
                decodeURIComponent(className),
                data.subject_id
            );

            return response.json({
                success: true,
                message: 'Mata pelajaran berhasil dibatalkan dari kelas'
            });

        } catch (error: any) {
            console.error('Error unassigning subject from class:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal membatalkan penugasan mata pelajaran'
            });
        }
    }

    /**
     * Get class details with teacher and subjects
     */
    public async show(request: Request, response: Response) {
        try {
            const { className } = request.params;

            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }

            const decodedClassName = decodeURIComponent(className);
            
            // Get class info
            const classes = await ClassService.getUniqueClasses();
            const classInfo = classes.find(c => c.name === decodedClassName);

            if (!classInfo) {
                return response.status(404).json({
                    success: false,
                    error: 'Kelas tidak ditemukan'
                });
            }

            // Get assigned subjects
            const subjects = await ClassService.getClassSubjects(decodedClassName);

            return response.json({
                success: true,
                data: {
                    class: classInfo,
                    subjects
                }
            });

        } catch (error) {
            console.error('Error fetching class details:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal mengambil detail kelas'
            });
        }
    }
}

export default new ClassController();
