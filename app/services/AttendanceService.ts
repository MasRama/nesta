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
    * Note: Schedule active validation removed to allow attendance at any time
    */
   async validateTeacherSubject(teacherId: string, subjectId: string, studentClass: string): Promise<{ valid: boolean, message: string, schedule?: any }> {
      try {
         // Check if teacher teaches this subject for this class
         // Removed schedule active validation (.where("sc.is_active", true)) to allow attendance anytime
         const schedule = await DB.from("subject_classes as sc")
            .join("subjects as s", "sc.subject_id", "s.id")
            .join("classes as c", "sc.class_id", "c.id")
            .where("sc.teacher_id", teacherId)
            .where("s.id", subjectId)
            .where("c.name", studentClass)
            // .where("sc.is_active", true) // REMOVED: Schedule active validation
            .where("s.is_active", true) // Keep subject active validation
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
               message: `Anda tidak mengampu mata pelajaran ini untuk kelas ${studentClass}.`
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
    * @param qrData QR code data in format NSID_Nama Lengkap
    * @param teacherUserId User ID of the teacher (from users table) - used for attendance_sessions
    * @param subjectId Subject ID
    * @param scheduleId Optional schedule ID
    * @param classId Optional class ID
    */
   async scanStudentQR(qrData: string, teacherUserId: string, subjectId: string, scheduleId?: string, classId?: string): Promise<{ success: boolean, message: string, attendance?: AttendanceRecord, student?: any }> {
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

         // Get teacher record from user_id for validation purposes
         const teacher = await DB.from("teachers")
            .where("user_id", teacherUserId)
            .where("is_active", true)
            .first();

         if (!teacher) {
            return {
               success: false,
               message: "Data guru tidak ditemukan atau tidak aktif"
            };
         }

         // Validate teacher-subject relationship
         let scheduleValidation: { valid: boolean, message: string, schedule?: any };
         if (scheduleId && classId) {
            // Use specific schedule validation if schedule info is provided
            scheduleValidation = await this.validateSpecificTeacherSchedule(teacher.id, subjectId, scheduleId, classId);
         } else {
            // Fallback to general validation
            scheduleValidation = await this.validateTeacherSubject(teacher.id, subjectId, student.kelas);
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
            .where("attendance_records.student_id", student.user_id) // Use student.user_id for foreign key constraint
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
            .where("teacher_id", teacherUserId)
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
               teacher_id: teacherUserId,
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
            student_id: student.user_id, // Use student.user_id for foreign key constraint
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
         .leftJoin("students", "users.id", "students.user_id") // Join to get student details
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
         "students.nipd as student_number" // Use students.nipd instead of users.student_id
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
    * Note: Day and time validation removed to allow attendance at any time
    */
   async validateSpecificTeacherSchedule(teacherId: string, subjectId: string, scheduleId: string, classId: string): Promise<{ valid: boolean, message: string }> {
      try {
         // Check if the teacher is assigned to this specific schedule
         // Removed schedule active validation (.where("is_active", true)) to allow attendance anytime
         const schedule = await DB.from("subject_classes")
            .where("id", scheduleId)
            .where("teacher_id", teacherId)
            .where("subject_id", subjectId)
            .where("class_id", classId)
            // .where("is_active", true) // REMOVED: Schedule active validation
            .first();

         if (!schedule) {
            return {
               valid: false,
               message: "Anda tidak memiliki akses untuk mengajar mata pelajaran ini pada jadwal yang dipilih"
            };
         }

         // REMOVED: Day and time validation to allow attendance anytime
         // const now = new Date();
         // const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
         // const currentDay = dayNames[now.getDay()];
         //
         // if (schedule.day !== currentDay) {
         //    return {
         //       valid: false,
         //       message: `Jadwal ini untuk hari ${schedule.day}, bukan hari ${currentDay}`
         //    };
         // }

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

   /**
    * Get teacher's attendance sessions with student lists
    */
   async getTeacherAttendanceSessions(teacherUserId: string, date?: string, subjectId?: string, classId?: string): Promise<any[]> {
      let query = DB.from("attendance_sessions as as")
         .leftJoin("subjects as s", "as.subject_id", "s.id")
         .leftJoin("classes as c", "as.class_id", "c.id")
         .where("as.teacher_id", teacherUserId);

      if (date) {
         query = query.where("as.attendance_date", date);
      } else {
         // Default to today if no date specified
         query = query.where("as.attendance_date", dayjs().format('YYYY-MM-DD'));
      }

      if (subjectId) {
         query = query.where("as.subject_id", subjectId);
      }

      if (classId) {
         query = query.where("as.class_id", classId);
      }

      const sessions = await query.select(
         "as.*",
         "s.nama as subject_name",
         "s.kode as subject_code",
         "c.name as class_name",
         "c.grade_level"
      ).orderBy("as.created_at", "desc");

      // Get attendance records for each session
      for (const session of sessions) {
         const attendanceRecords = await DB.from("attendance_records as ar")
            .leftJoin("users as u", "ar.student_id", "u.id")
            .leftJoin("students as st", "u.id", "st.user_id")
            .where("ar.attendance_session_id", session.id)
            .select(
               "ar.*",
               "u.name as student_name",
               "st.nipd as student_number",
               "st.kelas as student_class"
            )
            .orderBy("u.name");

         session.attendance_records = attendanceRecords;
         session.total_present = attendanceRecords.filter(r => r.status === 'present').length;
         session.total_absent = attendanceRecords.filter(r => r.status === 'absent').length;
         session.total_late = attendanceRecords.filter(r => r.status === 'late').length;
         session.total_excused = attendanceRecords.filter(r => r.status === 'excused').length;
      }

      return sessions;
   }

   /**
    * Get students in class for attendance management
    */
   async getClassStudentsForAttendance(classId: string, subjectId?: string, date?: string): Promise<any[]> {
      const targetDate = date || dayjs().format('YYYY-MM-DD');

      // Get all students in the class
      const students = await DB.from("student_classes as sc")
         .join("students as st", "sc.student_id", "st.user_id")
         .join("users as u", "st.user_id", "u.id")
         .where("sc.class_id", classId)
         .where("sc.is_active", true)
         .where("st.is_active", true)
         .select(
            "st.*",
            "u.name as student_name",
            "u.id as user_id"
         )
         .orderBy("st.nipd");

      // Get attendance records for the specified date and subject (if provided)
      for (const student of students) {
         let attendanceQuery = DB.from("attendance_records as ar")
            .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
            .where("ar.student_id", student.user_id)
            .where("as.attendance_date", targetDate);

         if (subjectId) {
            attendanceQuery = attendanceQuery.where("as.subject_id", subjectId);
         }

         const attendanceRecord = await attendanceQuery
            .select("ar.*", "as.subject_id")
            .first();

         student.attendance_status = attendanceRecord?.status || 'not_marked';
         student.attendance_id = attendanceRecord?.id || null;
         student.attendance_notes = attendanceRecord?.notes || null;
         student.scanned_at = attendanceRecord?.scanned_at || null;
      }

      return students;
   }

   /**
    * Manual attendance management - mark student attendance
    */
   async manualAttendance(studentId: string, sessionId: string, status: string, notes?: string, _teacherUserId?: string): Promise<{ success: boolean, message: string, attendance?: any }> {
      try {
         // Validate session exists and is active
         const session = await DB.from("attendance_sessions")
            .where("id", sessionId)
            .first();

         if (!session) {
            return { success: false, message: "Sesi absensi tidak ditemukan" };
         }

         // Check if attendance record already exists
         const existingRecord = await DB.from("attendance_records")
            .where("attendance_session_id", sessionId)
            .where("student_id", studentId)
            .first();

         let attendanceRecord: any;

         if (existingRecord) {
            // Update existing record
            await DB.from("attendance_records")
               .where("id", existingRecord.id)
               .update({
                  status,
                  notes,
                  updated_at: dayjs().valueOf()
               });

            attendanceRecord = await DB.from("attendance_records")
               .where("id", existingRecord.id)
               .first();
         } else {
            // Create new record
            attendanceRecord = {
               id: randomUUID(),
               attendance_session_id: sessionId,
               student_id: studentId,
               status,
               notes,
               scanned_at: status === 'present' ? new Date() : null,
               created_at: dayjs().valueOf(),
               updated_at: dayjs().valueOf()
            };

            await DB.table("attendance_records").insert(attendanceRecord);
         }

         // Get student name for response
         const student = await DB.from("users")
            .where("id", studentId)
            .first();

         return {
            success: true,
            message: `Absensi ${student?.name || 'siswa'} berhasil ${existingRecord ? 'diperbarui' : 'dicatat'} sebagai ${status}`,
            attendance: attendanceRecord
         };

      } catch (error) {
         console.error("Error in manual attendance:", error);
         return {
            success: false,
            message: "Terjadi kesalahan saat mengelola absensi manual"
         };
      }
   }

   /**
    * Update attendance record
    */
   async updateAttendanceRecord(attendanceId: string, status: string, notes?: string): Promise<{ success: boolean, message: string, attendance?: any }> {
      try {
         const existingRecord = await DB.from("attendance_records")
            .where("id", attendanceId)
            .first();

         if (!existingRecord) {
            return { success: false, message: "Record absensi tidak ditemukan" };
         }

         await DB.from("attendance_records")
            .where("id", attendanceId)
            .update({
               status,
               notes,
               updated_at: dayjs().valueOf()
            });

         const updatedRecord = await DB.from("attendance_records")
            .where("id", attendanceId)
            .first();

         return {
            success: true,
            message: "Record absensi berhasil diperbarui",
            attendance: updatedRecord
         };

      } catch (error) {
         console.error("Error updating attendance record:", error);
         return {
            success: false,
            message: "Terjadi kesalahan saat memperbarui record absensi"
         };
      }
   }

   /**
    * Get attendance statistics for teacher's classes
    */
   async getTeacherAttendanceStats(teacherUserId: string, period?: string, subjectId?: string, classId?: string): Promise<any> {
      try {
         let startDate: string;
         let endDate: string;
         const today = dayjs();

         // Determine date range based on period
         switch (period) {
            case 'week':
               startDate = today.startOf('week').format('YYYY-MM-DD');
               endDate = today.endOf('week').format('YYYY-MM-DD');
               break;
            case 'month':
               startDate = today.startOf('month').format('YYYY-MM-DD');
               endDate = today.endOf('month').format('YYYY-MM-DD');
               break;
            case 'today':
            default:
               startDate = today.format('YYYY-MM-DD');
               endDate = today.format('YYYY-MM-DD');
               break;
         }

         let query = DB.from("attendance_sessions as as")
            .leftJoin("attendance_records as ar", "as.id", "ar.attendance_session_id")
            .leftJoin("subjects as s", "as.subject_id", "s.id")
            .leftJoin("classes as c", "as.class_id", "c.id")
            .where("as.teacher_id", teacherUserId)
            .whereBetween("as.attendance_date", [startDate, endDate]);

         if (subjectId) {
            query = query.where("as.subject_id", subjectId);
         }

         if (classId) {
            query = query.where("as.class_id", classId);
         }

         // Get overall statistics
         const overallStats = await query.clone()
            .select("ar.status")
            .count("* as count")
            .groupBy("ar.status");

         // Get statistics by subject
         const subjectStats = await query.clone()
            .select("s.nama as subject_name", "ar.status")
            .count("* as count")
            .groupBy("s.nama", "ar.status");

         // Get statistics by class
         const classStats = await query.clone()
            .select("c.name as class_name", "ar.status")
            .count("* as count")
            .groupBy("c.name", "ar.status");

         // Get daily statistics for the period
         const dailyStats = await query.clone()
            .select("as.attendance_date", "ar.status")
            .count("* as count")
            .groupBy("as.attendance_date", "ar.status")
            .orderBy("as.attendance_date");

         // Get students with frequent absences
         const frequentAbsences = await DB.from("attendance_records as ar")
            .join("attendance_sessions as as", "ar.attendance_session_id", "as.id")
            .join("users as u", "ar.student_id", "u.id")
            .join("students as st", "u.id", "st.user_id")
            .where("as.teacher_id", teacherUserId)
            .where("ar.status", 'absent')
            .whereBetween("as.attendance_date", [startDate, endDate])
            .select("u.name as student_name", "st.nipd as student_number")
            .count("* as absent_count")
            .groupBy("u.id", "u.name", "st.nipd")
            .having("absent_count", ">=", 3)
            .orderBy("absent_count", "desc");

         return {
            period: period || 'today',
            date_range: { start: startDate, end: endDate },
            overall: overallStats.reduce((acc: any, stat: any) => {
               acc[stat.status] = stat.count;
               return acc;
            }, {}),
            by_subject: this.groupStatsByCategory(subjectStats, 'subject_name'),
            by_class: this.groupStatsByCategory(classStats, 'class_name'),
            daily: this.groupDailyStats(dailyStats),
            frequent_absences: frequentAbsences
         };

      } catch (error) {
         console.error("Error getting teacher attendance stats:", error);
         throw error;
      }
   }

   /**
    * Helper method to group statistics by category
    */
   private groupStatsByCategory(stats: any[], categoryField: string): any {
      const grouped: any = {};
      stats.forEach(stat => {
         const category = stat[categoryField];
         if (!grouped[category]) {
            grouped[category] = {};
         }
         grouped[category][stat.status] = stat.count;
      });
      return grouped;
   }

   /**
    * Helper method to group daily statistics
    */
   private groupDailyStats(stats: any[]): any {
      const grouped: any = {};
      stats.forEach(stat => {
         const date = stat.attendance_date;
         if (!grouped[date]) {
            grouped[date] = {};
         }
         grouped[date][stat.status] = stat.count;
      });
      return grouped;
   }

   /**
    * Export attendance data to Excel or JSON
    */
   async exportAttendanceData(classId: string, subjectId?: string, startDate?: string, endDate?: string, format?: string): Promise<any> {
      try {
         const start = startDate || dayjs().startOf('month').format('YYYY-MM-DD');
         const end = endDate || dayjs().endOf('month').format('YYYY-MM-DD');

         let query = DB.from("attendance_sessions as as")
            .leftJoin("attendance_records as ar", "as.id", "ar.attendance_session_id")
            .leftJoin("users as u", "ar.student_id", "u.id")
            .leftJoin("students as st", "u.id", "st.user_id")
            .leftJoin("subjects as s", "as.subject_id", "s.id")
            .leftJoin("classes as c", "as.class_id", "c.id")
            .where("as.class_id", classId)
            .whereBetween("as.attendance_date", [start, end]);

         if (subjectId) {
            query = query.where("as.subject_id", subjectId);
         }

         const data = await query.select(
            "as.attendance_date",
            "s.nama as subject_name",
            "c.name as class_name",
            "u.name as student_name",
            "st.nipd as student_number",
            "ar.status",
            "ar.scanned_at",
            "ar.notes"
         ).orderBy("as.attendance_date").orderBy("u.name");

         if (format === 'excel') {
            // For Excel export, we would need to install xlsx package
            // For now, return structured data that can be processed by frontend
            return {
               headers: [
                  'Tanggal', 'Mata Pelajaran', 'Kelas', 'Nama Siswa',
                  'NIPD', 'Status', 'Waktu Scan', 'Catatan'
               ],
               data: data.map(row => [
                  row.attendance_date,
                  row.subject_name,
                  row.class_name,
                  row.student_name,
                  row.student_number,
                  row.status,
                  row.scanned_at ? dayjs(row.scanned_at).format('HH:mm:ss') : '',
                  row.notes || ''
               ])
            };
         }

         return data;

      } catch (error) {
         console.error("Error exporting attendance data:", error);
         throw error;
      }
   }
}

export default new AttendanceService();