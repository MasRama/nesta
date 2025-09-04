/**
 * Attendance Service
 * Handles QR code generation, attendance tracking, and reporting
 */

import DB from "./DB";
import QRCode from 'qrcode';
import { randomUUID } from "crypto";
import dayjs from "dayjs";

interface AttendanceSession {
   id: string;
   class_id: string;
   teacher_id: string;
   attendance_date: string;
   qr_token: string;
   starts_at: Date;
   expires_at: Date;
   is_active: boolean;
   notes?: string;
}

interface AttendanceRecord {
   id: string;
   attendance_session_id: string;
   student_id: string;
   status: 'present' | 'absent' | 'late' | 'excused';
   scanned_at?: Date;
   notes?: string;
}

class AttendanceService {
   /**
    * Generate QR code for attendance session
    */
   async generateQRCode(classId: string, teacherId: string, durationMinutes: number = 30): Promise<{ session: AttendanceSession, qrCodeDataURL: string }> {
      const token = randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

      const session = {
         id: randomUUID(),
         class_id: classId,
         teacher_id: teacherId,
         attendance_date: dayjs().format('YYYY-MM-DD'),
         qr_token: token,
         starts_at: now,
         expires_at: expiresAt,
         is_active: true,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      };

      await DB.table("attendance_sessions").insert(session);

      // Generate QR code data URL
      const qrData = JSON.stringify({
         token,
         session_id: session.id,
         class_id: classId,
         timestamp: now.getTime()
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData);

      return { session, qrCodeDataURL };
   }

   /**
    * Process QR code scan by student
    */
   async processScan(qrData: string, studentId: string): Promise<{ success: boolean, message: string, attendance?: AttendanceRecord }> {
      try {
         const scanData = JSON.parse(qrData);
         const { token, session_id } = scanData;

         // Validate session
         const session = await DB.from("attendance_sessions")
            .where("id", session_id)
            .where("qr_token", token)
            .where("is_active", true)
            .first();

         if (!session) {
            return { success: false, message: "QR code tidak valid atau sudah kadaluarsa" };
         }

         // Check if session is still active
         if (new Date() > new Date(session.expires_at)) {
            return { success: false, message: "Sesi absensi sudah berakhir" };
         }

         // Check if student is enrolled in this class
         const enrollment = await DB.from("student_classes")
            .where("student_id", studentId)
            .where("class_id", session.class_id)
            .where("is_active", true)
            .first();

         if (!enrollment) {
            return { success: false, message: "Anda tidak terdaftar di kelas ini" };
         }

         // Check if already marked present
         const existingRecord = await DB.from("attendance_records")
            .where("attendance_session_id", session.id)
            .where("student_id", studentId)
            .first();

         if (existingRecord) {
            return { success: false, message: "Anda sudah absen untuk sesi ini" };
         }

         // Create attendance record
         const attendanceRecord = {
            id: randomUUID(),
            attendance_session_id: session.id,
            student_id: studentId,
            status: 'present' as const,
            scanned_at: new Date(),
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         };

         await DB.table("attendance_records").insert(attendanceRecord);

         return { 
            success: true, 
            message: "Absensi berhasil dicatat", 
            attendance: attendanceRecord 
         };

      } catch (error) {
         console.error("Error processing scan:", error);
         return { success: false, message: "Terjadi kesalahan saat memproses QR code" };
      }
   }

   /**
    * Get attendance records for a class
    */
   async getClassAttendance(classId: string, date?: string): Promise<any[]> {
      let query = DB.from("attendance_sessions")
         .leftJoin("attendance_records", "attendance_sessions.id", "attendance_records.attendance_session_id")
         .leftJoin("users", "attendance_records.student_id", "users.id")
         .where("attendance_sessions.class_id", classId);

      if (date) {
         query = query.where("attendance_sessions.attendance_date", date);
      }

      return query.select(
         "attendance_sessions.*",
         "attendance_records.student_id",
         "attendance_records.status",
         "attendance_records.scanned_at",
         "users.name as student_name",
         "users.student_id as student_number"
      );
   }

   /**
    * Get student attendance history
    */
   async getStudentAttendance(studentId: string, limit: number = 20): Promise<any[]> {
      return DB.from("attendance_records")
         .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
         .join("classes", "attendance_sessions.class_id", "classes.id")
         .where("attendance_records.student_id", studentId)
         .orderBy("attendance_sessions.attendance_date", "desc")
         .limit(limit)
         .select(
            "attendance_records.*",
            "attendance_sessions.attendance_date",
            "classes.name as class_name",
            "classes.grade_level"
         );
   }

   /**
    * Get attendance statistics for a student
    */
   async getStudentAttendanceStats(studentId: string, classId?: string): Promise<any> {
      let query = DB.from("attendance_records")
         .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
         .where("attendance_records.student_id", studentId);

      if (classId) {
         query = query.where("attendance_sessions.class_id", classId);
      }

      const stats = await query
         .select("attendance_records.status")
         .count("* as count")
         .groupBy("attendance_records.status");

      return stats.reduce((acc, stat) => {
         acc[stat.status] = stat.count;
         return acc;
      }, {});
   }

   /**
    * Mark student as absent for active sessions
    */
   async markAbsent(sessionId: string, studentIds: string[]): Promise<void> {
      const session = await DB.from("attendance_sessions")
         .where("id", sessionId)
         .first();

      if (!session) {
         throw new Error("Session not found");
      }

      const absentRecords = studentIds.map(studentId => ({
         id: randomUUID(),
         attendance_session_id: sessionId,
         student_id: studentId,
         status: 'absent' as const,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      }));

      await DB.table("attendance_records").insert(absentRecords);
   }

   /**
    * Close attendance session
    */
   async closeSession(sessionId: string): Promise<void> {
      await DB.from("attendance_sessions")
         .where("id", sessionId)
         .update({ 
            is_active: false,
            updated_at: dayjs().valueOf()
         });
   }
}

export default new AttendanceService();