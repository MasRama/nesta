import { Response, Request } from "../../type";
import AttendanceService from "../services/AttendanceService";
import RoleAuth from "../middlewares/roleAuth";
import DB from "../services/DB";

class AttendanceController {
   /**
    * Scan student QR code for attendance (Teacher only)
    */
   public async scanStudentQR(request: Request, response: Response) {
      try {
         const { qr_data, subject_id, schedule_id, class_id } = await request.json();

         if (!qr_data) {
            return response.status(400).json({ error: "QR data is required" });
         }

         if (!subject_id) {
            return response.status(400).json({ error: "Subject ID is required" });
         }

         // Ensure user is a teacher
         if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can scan student QR codes" });
         }

         const result = await AttendanceService.scanStudentQR(
            qr_data,
            request.user.id,
            subject_id,
            schedule_id,
            class_id
         );

         if (result.success) {
            return response.json({
               message: result.message,
               attendance: result.attendance,
               student: result.student
            });
         } else {
            return response.status(400).json({ error: result.message });
         }
      } catch (error) {
         console.error("Error scanning student QR:", error);
         return response.status(500).json({ error: "Failed to scan student QR code" });
      }
   }

   /**
    * Get available subjects for attendance (Teacher only)
    */
   public async getAvailableSubjects(request: Request, response: Response) {
      try {
         const { class_id } = request.params;

         if (!class_id) {
            return response.status(400).json({ error: "Class ID is required" });
         }

         // Check if teacher can access this class
         const canAccess = await RoleAuth.canAccessClass(request, class_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to class" });
         }

         const now = new Date();
         const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
         const currentDay = dayNames[now.getDay()];

         // Get subjects that teacher teaches in this class today
         const subjects = await DB.from('subject_classes as sc')
            .join('subjects as s', 'sc.subject_id', 's.id')
            .select(
               's.id',
               's.nama as name',
               's.kode as code',
               'sc.day',
               'sc.start_time',
               'sc.end_time'
            )
            .where('sc.teacher_id', request.user.id)
            .where('sc.class_id', class_id)
            .where('sc.day', currentDay)
            .where('sc.is_active', true)
            .where('s.is_active', true)
            .orderBy('sc.start_time');

         return response.json({ subjects });
      } catch (error) {
         console.error("Error getting available subjects:", error);
         return response.status(500).json({ error: "Failed to get available subjects" });
      }
   }

   /**
    * Process QR code scan (Student only)
    */
   public async processScan(request: Request, response: Response) {
      try {
         const { qr_data } = await request.json();
         
         if (!qr_data) {
            return response.status(400).json({ error: "QR data is required" });
         }

         const result = await AttendanceService.processScan(qr_data, request.user.id);

         if (result.success) {
            return response.json({ 
               message: result.message, 
               attendance: result.attendance 
            });
         } else {
            return response.status(400).json({ error: result.message });
         }
      } catch (error) {
         console.error("Error processing scan:", error);
         return response.status(500).json({ error: "Failed to process QR scan" });
      }
   }

   /**
    * Get class attendance records (Teacher/Admin only)
    */
   public async getClassAttendance(request: Request, response: Response) {
      try {
         const { class_id } = request.params;
         const { date } = request.query;

         // Check access permissions
         const canAccess = await RoleAuth.canAccessClass(request, class_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to class" });
         }

         const attendance = await AttendanceService.getClassAttendance(
            class_id, 
            date as string
         );

         return response.json({ attendance });
      } catch (error) {
         console.error("Error getting class attendance:", error);
         return response.status(500).json({ error: "Failed to get attendance data" });
      }
   }

   /**
    * Get student attendance history
    */
   public async getStudentAttendance(request: Request, response: Response) {
      try {
         const { student_id } = request.params;
         const { limit = 20 } = request.query;

         // Check if user can access this student's data
         const canAccess = await RoleAuth.canAccessStudent(request, student_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to student data" });
         }

         const attendance = await AttendanceService.getStudentAttendance(
            student_id, 
            parseInt(limit as string)
         );

         return response.json({ attendance });
      } catch (error) {
         console.error("Error getting student attendance:", error);
         return response.status(500).json({ error: "Failed to get attendance data" });
      }
   }

   /**
    * Get attendance statistics for student
    */
   public async getAttendanceStats(request: Request, response: Response) {
      try {
         const { student_id } = request.params;
         const { class_id } = request.query;

         // Check permissions
         const canAccess = await RoleAuth.canAccessStudent(request, student_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to student data" });
         }

         const stats = await AttendanceService.getStudentAttendanceStats(
            student_id,
            class_id as string
         );

         return response.json({ stats });
      } catch (error) {
         console.error("Error getting attendance stats:", error);
         return response.status(500).json({ error: "Failed to get attendance statistics" });
      }
   }

   /**
    * Get teacher's schedules for today (Teacher only)
    */
   public async getTodaySchedules(request: Request, response: Response) {
      try {
         // Ensure user is a teacher
         if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can access schedules" });
         }

         const TeacherService = (await import("../services/TeacherService")).default;
         const result = await TeacherService.getTodaySchedules(request.user.id);

         return response.json(result);
      } catch (error) {
         console.error("Error getting today schedules:", error);
         return response.status(500).json({ error: "Failed to get today's schedules" });
      }
   }

   /**
    * Close attendance session (Teacher only)
    */
   public async closeSession(request: Request, response: Response) {
      try {
         const { session_id } = request.params;

         // Additional validation can be added here to check if teacher owns the session

         await AttendanceService.closeSession(session_id);

         return response.json({ message: "Attendance session closed successfully" });
      } catch (error) {
         console.error("Error closing session:", error);
         return response.status(500).json({ error: "Failed to close attendance session" });
      }
   }
}

export default new AttendanceController();