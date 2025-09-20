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
   subject_id?: string;
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
    * Validate if teacher can generate QR code for specific class and subject at current time
    */
   async validateTeacherSchedule(teacherId: string, classId: string, subjectId?: string): Promise<{ valid: boolean, message: string, schedule?: any }> {
      try {
         const now = new Date();
         const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
         const currentDay = dayNames[now.getDay()];
         const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

         // Check if teacher has any schedule for this class today
         let query = DB.from('subject_classes as sc')
            .join('classes as c', 'sc.class_id', 'c.id')
            .join('subjects as s', 'sc.subject_id', 's.id')
            .select(
               'sc.*',
               'c.name as class_name',
               's.nama as subject_name',
               's.kode as subject_code'
            )
            .where('sc.teacher_id', teacherId)
            .where('sc.class_id', classId)
            .where('sc.day', currentDay)
            .where('sc.is_active', true);

         // If specific subject is provided, validate it
         if (subjectId) {
            query = query.where('sc.subject_id', subjectId);
         }

         const schedules = await query;

         if (schedules.length === 0) {
            return {
               valid: false,
               message: subjectId
                  ? 'Anda tidak memiliki jadwal mengajar mata pelajaran ini di kelas ini hari ini'
                  : 'Anda tidak memiliki jadwal mengajar di kelas ini hari ini'
            };
         }

         // Check if current time is within any teaching schedule
         const activeSchedule = schedules.find(schedule => {
            return currentTime >= schedule.start_time && currentTime <= schedule.end_time;
         });

         if (!activeSchedule) {
            const nextSchedule = schedules.find(schedule => currentTime < schedule.start_time);
            if (nextSchedule) {
               return {
                  valid: false,
                  message: `Jadwal mengajar ${nextSchedule.subject_name} dimulai pada ${nextSchedule.start_time}. Saat ini belum waktunya.`
               };
            } else {
               return {
                  valid: false,
                  message: 'Tidak ada jadwal mengajar yang aktif saat ini untuk kelas ini.'
               };
            }
         }

         return {
            valid: true,
            message: 'Validasi berhasil',
            schedule: activeSchedule
         };

      } catch (error) {
         console.error('Error validating teacher schedule:', error);
         return {
            valid: false,
            message: 'Terjadi kesalahan saat memvalidasi jadwal'
         };
      }
   }

   /**
    * Validate teacher-subject relationship for attendance
    */
   async validateTeacherSubject(teacherId: string, subjectId: string, studentClass: string): Promise<{ valid: boolean, message: string, schedule?: any }> {
      try {
         // Check if teacher teaches this subject and has schedule for this class
         const schedule = await DB.from("subject_classes as sc")
            .join("subjects as s", "sc.subject_id", "s.id")
            .join("classes as c", "sc.class_id", "c.id")
            .where("sc.teacher_id", teacherId)
            .where("s.id", subjectId)
            .where("c.name", studentClass)
            .where("sc.is_active", true)
            .where("s.is_active", true)
            .select(
               "sc.*",
               "s.id as subject_id",
               "s.nama as subject_name",
               "s.kode as subject_code",
               "c.name as class_name"
            )
            .first();

         if (!schedule) {
            return {
               valid: false,
               message: `Anda tidak mengampu mata pelajaran ini untuk kelas ${studentClass} atau jadwal tidak aktif.`
            };
         }

         return {
            valid: true,
            message: "Validasi berhasil",
            schedule
         };

      } catch (error) {
         console.error("Error validating teacher-subject relationship:", error);
         return {
            valid: false,
            message: "Terjadi kesalahan saat memvalidasi mata pelajaran"
         };
      }
   }

   /**
    * Scan student QR code for attendance (Teacher scans student QR)
    * QR format expected: NSID_Nama Lengkap (e.g., NSID001_Ahmad Budi Santoso)
    */
   async scanStudentQR(qrData: string, teacherId: string, subjectId: string, scheduleId?: string, classId?: string): Promise<{ success: boolean, message: string, attendance?: AttendanceRecord, student?: any }> {
      try {
         // Parse QR data format: NSID_Nama Lengkap
         const qrParts = qrData.split('_');
         if (qrParts.length < 2) {
            return {
               success: false,
               message: "Format QR code tidak valid. Format yang benar: NSID_Nama Lengkap"
            };
         }

         const nsid = qrParts[0].trim();
         const namaLengkap = qrParts.slice(1).join('_').trim(); // Handle names with underscores

         // Validate student exists in database
         const student = await DB.from("students")
            .where("nipd", nsid)
            .where("nama", namaLengkap)
            .where("is_active", true)
            .first();

         if (!student) {
            return {
               success: false,
               message: `Siswa dengan NSID ${nsid} dan nama ${namaLengkap} tidak ditemukan atau tidak aktif`
            };
         }

         // Validate teacher-subject relationship
         let scheduleValidation;
         if (scheduleId && classId) {
            // Use specific schedule validation if schedule info is provided
            scheduleValidation = await this.validateSpecificTeacherSchedule(teacherId, subjectId, scheduleId, classId);
         } else {
            // Fallback to general validation
            scheduleValidation = await this.validateTeacherSubject(teacherId, subjectId, student.kelas);
         }

         if (!scheduleValidation.valid) {
            return {
               success: false,
               message: scheduleValidation.message
            };
         }

         // Check if student already has attendance today for this subject
         const today = dayjs().format('YYYY-MM-DD');
         const existingAttendance = await DB.from("attendance_records")
            .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
            .where("attendance_records.student_id", student.id)
            .where("attendance_sessions.attendance_date", today)
            .where("attendance_sessions.subject_id", subjectId)
            .first();

         if (existingAttendance) {
            return {
               success: false,
               message: `${student.nama} sudah melakukan absensi untuk mata pelajaran ini hari ini`
            };
         }

         // Get or create class_id for the student's class
         let classRecord = await DB.from("classes")
            .where("name", student.kelas)
            .first();

         if (!classRecord) {
            // Create class record if it doesn't exist
            const gradeLevel = student.kelas.match(/\d+/)?.[0] || "0";
            const academicYear = new Date().getFullYear() + "/" + (new Date().getFullYear() + 1);

            classRecord = {
               id: randomUUID(),
               name: student.kelas,
               grade_level: gradeLevel,
               academic_year: academicYear,
               description: `Kelas ${student.kelas}`,
               max_students: 30,
               teacher_id: null,
               schedule: null,
               created_at: dayjs().valueOf(),
               updated_at: dayjs().valueOf()
            };

            await DB.table("classes").insert(classRecord);
         }

         // Create or get attendance session for today
         let session = await DB.from("attendance_sessions")
            .where("teacher_id", teacherId)
            .where("attendance_date", today)
            .where("subject_id", subjectId)
            .where("class_id", classRecord.id)
            .where("is_active", true)
            .first();

         if (!session) {
            // Create new attendance session
            session = {
               id: randomUUID(),
               class_id: classRecord.id,
               teacher_id: teacherId,
               subject_id: subjectId,
               attendance_date: today,
               qr_token: randomUUID(), // Not used in new flow but required by schema
               starts_at: new Date(),
               expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
               is_active: true,
               created_at: dayjs().valueOf(),
               updated_at: dayjs().valueOf()
            };

            await DB.table("attendance_sessions").insert(session);
         }

         // Create attendance record
         const attendanceRecord = {
            id: randomUUID(),
            attendance_session_id: session.id,
            student_id: student.id,
            status: 'present' as const,
            scanned_at: new Date(),
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         };

         await DB.table("attendance_records").insert(attendanceRecord);

         return {
            success: true,
            message: `Absensi ${student.nama} (${student.nipd}) berhasil dicatat`,
            attendance: attendanceRecord,
            student: {
               id: student.id,
               nipd: student.nipd,
               nama: student.nama,
               kelas: student.kelas
            }
         };

      } catch (error) {
         console.error("Error scanning student QR:", error);
         return {
            success: false,
            message: "Terjadi kesalahan saat memproses scan QR code murid"
         };
      }
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
    * Validate teacher schedule with specific schedule ID and class ID
    */
   async validateSpecificTeacherSchedule(teacherId: string, subjectId: string, scheduleId: string, classId: string): Promise<{ valid: boolean, message: string }> {
      try {
         // Check if the teacher is assigned to this specific schedule
         const schedule = await DB.from("subject_classes")
            .where("id", scheduleId)
            .where("teacher_id", teacherId)
            .where("subject_id", subjectId)
            .where("class_id", classId)
            .where("is_active", true)
            .first();

         if (!schedule) {
            return {
               valid: false,
               message: "Anda tidak memiliki akses untuk mengajar mata pelajaran ini pada jadwal yang dipilih"
            };
         }

         // Check if it's the right day and time
         const now = new Date();
         const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
         const currentDay = dayNames[now.getDay()];

         if (schedule.day !== currentDay) {
            return {
               valid: false,
               message: `Jadwal ini untuk hari ${schedule.day}, bukan hari ${currentDay}`
            };
         }

         return {
            valid: true,
            message: "Validasi berhasil"
         };

      } catch (error) {
         console.error("Error validating teacher schedule:", error);
         return {
            valid: false,
            message: "Terjadi kesalahan saat validasi jadwal"
         };
      }
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