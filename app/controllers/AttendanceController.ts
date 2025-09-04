import { Response, Request } from "../../type";
import AttendanceService from "../services/AttendanceService";
import RoleAuth from "../middlewares/roleAuth";

class AttendanceController {
   /**
    * Generate QR code for attendance session (Teacher only)
    */
   public async generateQRCode(request: Request, response: Response) {
      try {
         const { class_id, duration_minutes = 30 } = await request.json();
         
         if (!class_id) {
            return response.status(400).json({ error: "Class ID is required" });
         }

         // Check if teacher can access this class
         const canAccess = await RoleAuth.canAccessClass(request, class_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to class" });
         }

         const result = await AttendanceService.generateQRCode(
            class_id, 
            request.user.id, 
            duration_minutes
         );

         return response.json(result);
      } catch (error) {
         console.error("Error generating QR code:", error);
         return response.status(500).json({ error: "Failed to generate QR code" });
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