"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ClassService_1 = __importDefault(require("../services/ClassService"));
class ClassController {
    async index(request, response) {
        try {
            const classes = await ClassService_1.default.getUniqueClasses();
            return response.inertia("admin/classes/index", {
                classes
            });
        }
        catch (error) {
            console.error('Error fetching classes:', error);
            return response.status(500).json({ error: 'Gagal mengambil data kelas' });
        }
    }
    async getClassesAPI(request, response) {
        try {
            const classes = await ClassService_1.default.getUniqueClasses();
            return response.json({
                success: true,
                data: classes
            });
        }
        catch (error) {
            console.error('Error fetching classes API:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal mengambil data kelas'
            });
        }
    }
    async getAvailableTeachers(request, response) {
        try {
            const teachers = await ClassService_1.default.getAvailableTeachers();
            return response.json({
                success: true,
                data: teachers
            });
        }
        catch (error) {
            console.error('Error fetching available teachers:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal mengambil data guru'
            });
        }
    }
    async getAvailableSubjects(request, response) {
        try {
            const subjects = await ClassService_1.default.getAvailableSubjects();
            return response.json({
                success: true,
                data: subjects
            });
        }
        catch (error) {
            console.error('Error fetching available subjects:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal mengambil data mata pelajaran'
            });
        }
    }
    async getClassSubjects(request, response) {
        try {
            const { className } = request.params;
            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }
            const subjects = await ClassService_1.default.getClassSubjects(decodeURIComponent(className));
            return response.json({
                success: true,
                data: subjects
            });
        }
        catch (error) {
            console.error('Error fetching class subjects:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal mengambil mata pelajaran kelas'
            });
        }
    }
    async assignTeacher(request, response) {
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
            await ClassService_1.default.assignTeacherToClass(decodeURIComponent(className), data.teacher_id);
            return response.json({
                success: true,
                message: 'Wali kelas berhasil ditugaskan'
            });
        }
        catch (error) {
            console.error('Error assigning teacher to class:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal menugaskan wali kelas'
            });
        }
    }
    async unassignTeacher(request, response) {
        try {
            const { className } = request.params;
            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }
            await ClassService_1.default.unassignTeacherFromClass(decodeURIComponent(className));
            return response.json({
                success: true,
                message: 'Wali kelas berhasil dibatalkan'
            });
        }
        catch (error) {
            console.error('Error unassigning teacher from class:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal membatalkan penugasan wali kelas'
            });
        }
    }
    async assignSubject(request, response) {
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
            await ClassService_1.default.assignSubjectToClass(decodeURIComponent(className), data.subject_id, data.teacher_id, data.day, data.start_time, data.end_time, data.notes || null);
            return response.json({
                success: true,
                message: 'Mata pelajaran berhasil ditugaskan ke kelas'
            });
        }
        catch (error) {
            console.error('Error assigning subject to class:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal menugaskan mata pelajaran'
            });
        }
    }
    async unassignSubject(request, response) {
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
            await ClassService_1.default.unassignSubjectFromClass(decodeURIComponent(className), data.subject_id);
            return response.json({
                success: true,
                message: 'Mata pelajaran berhasil dibatalkan dari kelas'
            });
        }
        catch (error) {
            console.error('Error unassigning subject from class:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal membatalkan penugasan mata pelajaran'
            });
        }
    }
    async show(request, response) {
        try {
            const { className } = request.params;
            if (!className) {
                return response.status(400).json({
                    success: false,
                    error: 'Nama kelas wajib diisi'
                });
            }
            const decodedClassName = decodeURIComponent(className);
            const classes = await ClassService_1.default.getUniqueClasses();
            const classInfo = classes.find(c => c.name === decodedClassName);
            if (!classInfo) {
                return response.status(404).json({
                    success: false,
                    error: 'Kelas tidak ditemukan'
                });
            }
            const subjects = await ClassService_1.default.getClassSubjects(decodedClassName);
            return response.json({
                success: true,
                data: {
                    class: classInfo,
                    subjects
                }
            });
        }
        catch (error) {
            console.error('Error fetching class details:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal mengambil detail kelas'
            });
        }
    }
}
exports.default = new ClassController();
//# sourceMappingURL=ClassController.js.map