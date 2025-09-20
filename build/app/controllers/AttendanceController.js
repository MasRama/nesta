"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AttendanceService_1 = __importDefault(require("../services/AttendanceService"));
const roleAuth_1 = __importDefault(require("../middlewares/roleAuth"));
const DB_1 = __importDefault(require("../services/DB"));
class AttendanceController {
    async scanStudentQR(request, response) {
        try {
            const { qr_data, subject_id, schedule_id, class_id } = await request.json();
            if (!qr_data) {
                return response.status(400).json({ error: "QR data is required" });
            }
            if (!subject_id) {
                return response.status(400).json({ error: "Subject ID is required" });
            }
            if (request.user.role !== 'teacher') {
                return response.status(403).json({ error: "Only teachers can scan student QR codes" });
            }
            const result = await AttendanceService_1.default.scanStudentQR(qr_data, request.user.id, subject_id, schedule_id, class_id);
            if (result.success) {
                return response.json({
                    message: result.message,
                    attendance: result.attendance,
                    student: result.student
                });
            }
            else {
                return response.status(400).json({ error: result.message });
            }
        }
        catch (error) {
            console.error("Error scanning student QR:", error);
            return response.status(500).json({ error: "Failed to scan student QR code" });
        }
    }
    async getAvailableSubjects(request, response) {
        try {
            const { class_id } = request.params;
            if (!class_id) {
                return response.status(400).json({ error: "Class ID is required" });
            }
            const canAccess = await roleAuth_1.default.canAccessClass(request, class_id);
            if (!canAccess) {
                return response.status(403).json({ error: "Unauthorized access to class" });
            }
            const now = new Date();
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentDay = dayNames[now.getDay()];
            const subjects = await DB_1.default.from('subject_classes as sc')
                .join('subjects as s', 'sc.subject_id', 's.id')
                .select('s.id', 's.nama as name', 's.kode as code', 'sc.day', 'sc.start_time', 'sc.end_time')
                .where('sc.teacher_id', request.user.id)
                .where('sc.class_id', class_id)
                .where('sc.day', currentDay)
                .where('sc.is_active', true)
                .where('s.is_active', true)
                .orderBy('sc.start_time');
            return response.json({ subjects });
        }
        catch (error) {
            console.error("Error getting available subjects:", error);
            return response.status(500).json({ error: "Failed to get available subjects" });
        }
    }
    async processScan(request, response) {
        try {
            const { qr_data } = await request.json();
            if (!qr_data) {
                return response.status(400).json({ error: "QR data is required" });
            }
            const result = await AttendanceService_1.default.processScan(qr_data, request.user.id);
            if (result.success) {
                return response.json({
                    message: result.message,
                    attendance: result.attendance
                });
            }
            else {
                return response.status(400).json({ error: result.message });
            }
        }
        catch (error) {
            console.error("Error processing scan:", error);
            return response.status(500).json({ error: "Failed to process QR scan" });
        }
    }
    async getClassAttendance(request, response) {
        try {
            const { class_id } = request.params;
            const { date } = request.query;
            const canAccess = await roleAuth_1.default.canAccessClass(request, class_id);
            if (!canAccess) {
                return response.status(403).json({ error: "Unauthorized access to class" });
            }
            const attendance = await AttendanceService_1.default.getClassAttendance(class_id, date);
            return response.json({ attendance });
        }
        catch (error) {
            console.error("Error getting class attendance:", error);
            return response.status(500).json({ error: "Failed to get attendance data" });
        }
    }
    async getStudentAttendance(request, response) {
        try {
            const { student_id } = request.params;
            const { limit = 20 } = request.query;
            const canAccess = await roleAuth_1.default.canAccessStudent(request, student_id);
            if (!canAccess) {
                return response.status(403).json({ error: "Unauthorized access to student data" });
            }
            const attendance = await AttendanceService_1.default.getStudentAttendance(student_id, parseInt(limit));
            return response.json({ attendance });
        }
        catch (error) {
            console.error("Error getting student attendance:", error);
            return response.status(500).json({ error: "Failed to get attendance data" });
        }
    }
    async getAttendanceStats(request, response) {
        try {
            const { student_id } = request.params;
            const { class_id } = request.query;
            const canAccess = await roleAuth_1.default.canAccessStudent(request, student_id);
            if (!canAccess) {
                return response.status(403).json({ error: "Unauthorized access to student data" });
            }
            const stats = await AttendanceService_1.default.getStudentAttendanceStats(student_id, class_id);
            return response.json({ stats });
        }
        catch (error) {
            console.error("Error getting attendance stats:", error);
            return response.status(500).json({ error: "Failed to get attendance statistics" });
        }
    }
    async getTodaySchedules(request, response) {
        try {
            if (request.user.role !== 'teacher') {
                return response.status(403).json({ error: "Only teachers can access schedules" });
            }
            const TeacherService = (await Promise.resolve().then(() => __importStar(require("../services/TeacherService")))).default;
            const result = await TeacherService.getTodaySchedules(request.user.id);
            return response.json(result);
        }
        catch (error) {
            console.error("Error getting today schedules:", error);
            return response.status(500).json({ error: "Failed to get today's schedules" });
        }
    }
    async closeSession(request, response) {
        try {
            const { session_id } = request.params;
            await AttendanceService_1.default.closeSession(session_id);
            return response.json({ message: "Attendance session closed successfully" });
        }
        catch (error) {
            console.error("Error closing session:", error);
            return response.status(500).json({ error: "Failed to close attendance session" });
        }
    }
}
exports.default = new AttendanceController();
//# sourceMappingURL=AttendanceController.js.map