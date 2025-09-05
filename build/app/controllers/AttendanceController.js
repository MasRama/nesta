"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AttendanceService_1 = __importDefault(require("../services/AttendanceService"));
const roleAuth_1 = __importDefault(require("../middlewares/roleAuth"));
class AttendanceController {
    async generateQRCode(request, response) {
        try {
            const { class_id, duration_minutes = 30 } = await request.json();
            if (!class_id) {
                return response.status(400).json({ error: "Class ID is required" });
            }
            const canAccess = await roleAuth_1.default.canAccessClass(request, class_id);
            if (!canAccess) {
                return response.status(403).json({ error: "Unauthorized access to class" });
            }
            const result = await AttendanceService_1.default.generateQRCode(class_id, request.user.id, duration_minutes);
            return response.json(result);
        }
        catch (error) {
            console.error("Error generating QR code:", error);
            return response.status(500).json({ error: "Failed to generate QR code" });
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