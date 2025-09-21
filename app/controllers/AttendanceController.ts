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

         // Get teacher ID from user ID
         const teacher = await DB.from('teachers')
            .where('user_id', request.user.id)
            .where('is_active', true)
            .first();

         if (!teacher) {
            return response.status(404).json({ error: "Teacher data not found" });
         }

         const result = await AttendanceService.scanStudentQR(
            qr_data,
            teacher.user_id, // Use teacher.user_id for attendance_sessions foreign key constraint
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
         // Removed schedule active validation to allow display anytime
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
            // .where('sc.is_active', true) // REMOVED: Schedule active validation
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

   /**
    * Get teacher's attendance sessions with student lists
    */
   public async getTeacherAttendanceSessions(request: Request, response: Response) {
      try {
         const { date, subject_id, class_id } = request.query;

         // Ensure user is a teacher
         if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can access attendance sessions" });
         }

         // Get teacher record
         const teacher = await DB.from('teachers')
            .where('user_id', request.user.id)
            .where('is_active', true)
            .first();

         if (!teacher) {
            return response.status(404).json({ error: "Teacher data not found" });
         }

         const sessions = await AttendanceService.getTeacherAttendanceSessions(
            teacher.user_id,
            date as string,
            subject_id as string,
            class_id as string
         );

         return response.json({ sessions });
      } catch (error) {
         console.error("Error getting teacher attendance sessions:", error);
         return response.status(500).json({ error: "Failed to get attendance sessions" });
      }
   }

   /**
    * Get students in class for attendance management
    */
   public async getClassStudentsForAttendance(request: Request, response: Response) {
      try {
         const { class_id } = request.params;
         const { subject_id, date } = request.query;

         // Check access permissions
         const canAccess = await RoleAuth.canAccessClass(request, class_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to class" });
         }

         const students = await AttendanceService.getClassStudentsForAttendance(
            class_id,
            subject_id as string,
            date as string
         );

         return response.json({ students });
      } catch (error) {
         console.error("Error getting class students for attendance:", error);
         return response.status(500).json({ error: "Failed to get class students" });
      }
   }

   /**
    * Manual attendance management - mark student attendance
    */
   public async manualAttendance(request: Request, response: Response) {
      try {
         const { student_id, session_id, status, notes } = await request.json();

         // Ensure user is a teacher
         if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can manage attendance manually" });
         }

         // Get teacher record
         const teacher = await DB.from('teachers')
            .where('user_id', request.user.id)
            .where('is_active', true)
            .first();

         if (!teacher) {
            return response.status(404).json({ error: "Teacher data not found" });
         }

         const result = await AttendanceService.manualAttendance(
            student_id,
            session_id,
            status,
            notes,
            teacher.user_id
         );

         if (result.success) {
            return response.json({
               message: result.message,
               attendance: result.attendance
            });
         } else {
            return response.status(400).json({ error: result.message });
         }
      } catch (error) {
         console.error("Error managing manual attendance:", error);
         return response.status(500).json({ error: "Failed to manage attendance" });
      }
   }

   /**
    * Update attendance record
    */
   public async updateAttendance(request: Request, response: Response) {
      try {
         const { attendance_id } = request.params;
         const { status, notes } = await request.json();

         // Ensure user is a teacher
         if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can update attendance" });
         }

         const result = await AttendanceService.updateAttendanceRecord(
            attendance_id,
            status,
            notes
         );

         if (result.success) {
            return response.json({
               message: result.message,
               attendance: result.attendance
            });
         } else {
            return response.status(400).json({ error: result.message });
         }
      } catch (error) {
         console.error("Error updating attendance:", error);
         return response.status(500).json({ error: "Failed to update attendance" });
      }
   }

   /**
    * Get attendance statistics for teacher's classes
    */
   public async getTeacherAttendanceStats(request: Request, response: Response) {
      try {
         const { period, subject_id, class_id } = request.query;

         // Ensure user is a teacher
         if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can access attendance statistics" });
         }

         // Get teacher record
         const teacher = await DB.from('teachers')
            .where('user_id', request.user.id)
            .where('is_active', true)
            .first();

         if (!teacher) {
            return response.status(404).json({ error: "Teacher data not found" });
         }

         const stats = await AttendanceService.getTeacherAttendanceStats(
            teacher.user_id,
            period as string,
            subject_id as string,
            class_id as string
         );

         return response.json({ stats });
      } catch (error) {
         console.error("Error getting teacher attendance stats:", error);
         return response.status(500).json({ error: "Failed to get attendance statistics" });
      }
   }

   /**
    * Export attendance data to Excel
    */
   public async exportAttendanceData(request: Request, response: Response) {
      try {
         const { class_id, subject_id, start_date, end_date, format } = request.query;

         // Check access permissions
         const canAccess = await RoleAuth.canAccessClass(request, class_id as string);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to class" });
         }

         const exportData = await AttendanceService.exportAttendanceData(
            class_id as string,
            subject_id as string,
            start_date as string,
            end_date as string,
            format as string
         );

         if (format === 'excel') {
            response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            response.setHeader('Content-Disposition', `attachment; filename=attendance-${class_id}-${Date.now()}.xlsx`);
            return response.send(exportData);
         } else {
            return response.json({ data: exportData });
         }
      } catch (error) {
         console.error("Error exporting attendance data:", error);
         return response.status(500).json({ error: "Failed to export attendance data" });
      }
   }
}

export default new AttendanceController();