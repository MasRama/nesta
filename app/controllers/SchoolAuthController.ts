import DB from "../services/DB";
import Authenticate from "../services/Authenticate";
import TeacherService from "../services/TeacherService";
import { Response, Request } from "../../type";
import { randomUUID, pbkdf2Sync } from "crypto";
import dayjs from "dayjs";
import * as fs from "fs";
import * as path from "path";

// Student login support - Updated
class SchoolAuthController {
   /**
    * Role-based login process
    * Redirects users to appropriate dashboards based on their role
    */
   public processLogin = async (request: Request, response: Response) => {
      let body = await request.json();
      let { email, password, phone } = body;

      console.log("🔐 Login attempt:", { email, phone, hasPassword: !!password });

      let user;

      // Check if this is a student login (format: nipd@spensagi.id)
      if (email && email.endsWith("@spensagi.id")) {
         console.log("📚 Detected student login format");
         const nipd = email.replace("@spensagi.id", "");
         console.log("🔍 Looking for student with NIPD:", nipd);
         
         const student = await DB.from("students")
            .where("nipd", nipd)
            .where("is_active", true)
            .first();

         console.log("👨‍🎓 Student found:", student ? `Yes (${student.nama})` : "No");

         if (student) {
            // Verify password (password should match NIPD)
            if (password === nipd) {
               console.log("✅ Student password correct, logging in...");
               return Authenticate.processStudent(student, request, response);
            } else {
               console.log("❌ Student password incorrect");
               return response
                  .cookie("error", "Password salah", 3000)
                  .redirect("/login");
            }
         }
         // Continue to check other tables if student not found
         console.log("⚠️ Student not found, checking other tables...");
      }

      // First, try to find user in users table
      if (email && email.includes("@")) {
         console.log("🔍 Looking for user with email:", email);
         user = await DB.from("users").where("email", email).first();
         console.log("👤 User found in users table:", user ? "Yes" : "No");
      } else if (phone) {
         console.log("🔍 Looking for user with phone:", phone);
         user = await DB.from("users").where("phone", phone).first();
         console.log("👤 User found in users table:", user ? "Yes" : "No");
      }

      if (user) {
         const password_match = await Authenticate.compare(password, user.password);
         console.log("🔑 Password match:", password_match);

         if (password_match) {
            return this.processRoleBasedAuth(user, request, response);
         } else {
            return response
               .cookie("error", "Password salah", 3000)
               .redirect("/login");
         }
      }

      // If not found in users table, try teachers table for backward compatibility
      if (email && email.includes("@")) {
         console.log("🔍 Looking for teacher with email:", email);
         const teacher = await DB.from("teachers")
            .where("email", email)
            .where("is_active", true)
            .first();

         console.log("👨‍🏫 Teacher found:", teacher ? "Yes" : "No");

         if (teacher) {
            const password_match = this.compareTeacherPassword(password, teacher.password);
            console.log("🔑 Teacher password match:", password_match);

            if (password_match) {
               // Create or get corresponding user account
               const userAccount = await this.getOrCreateUserForTeacher(teacher);
               return this.processRoleBasedAuth(userAccount, request, response);
            } else {
               return response
                  .cookie("error", "Password salah", 3000)
                  .redirect("/login");
            }
         }
      }

      console.log("❌ No user, student, or teacher found");
      return response
         .cookie("error", "Email/No.HP tidak terdaftar", 3000)
         .redirect("/login");
   }

   /**
    * Compare password with teacher's hashed password
    * Teachers use different hashing method than users
    */
   private compareTeacherPassword(password: string, hashedPassword: string): boolean {
      const salt = 'netsa_teacher_salt';
      const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return hash === hashedPassword;
   }

   /**
    * Get or create user account for teacher
    * This ensures teachers can login through the unified system
    */
   private async getOrCreateUserForTeacher(teacher: any) {
      // Check if teacher already has a linked user account
      if (teacher.user_id) {
         const existingUser = await DB.from("users").where("id", teacher.user_id).first();
         if (existingUser) {
            return existingUser;
         }
      }

      // Check if user with this email already exists
      const existingUser = await DB.from("users").where("email", teacher.email).first();
      if (existingUser && existingUser.role === 'teacher') {
         // Link existing user to teacher
         await DB.from("teachers")
            .where("id", teacher.id)
            .update({
               user_id: existingUser.id,
               updated_at: Date.now()
            });

         return existingUser;
      }

      // Create new user account for teacher
      const userId = randomUUID();
      const hashedPassword = await Authenticate.hash('guru123'); // Default password

      const userData = {
         id: userId,
         name: teacher.nama,
         email: teacher.email,
         phone: teacher.phone || null,
         password: hashedPassword,
         role: 'teacher',
         teacher_id: teacher.id,
         is_verified: true,
         is_admin: false,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      };

      await DB.transaction(async (trx) => {
         // Insert new user
         await trx.from("users").insert(userData);

         // Update teacher with user_id
         await trx.from("teachers")
            .where("id", teacher.id)
            .update({
               user_id: userId,
               updated_at: Date.now()
            });
      });

      return userData;
   }

   /**
    * Process authentication and redirect based on user role
    */
   private async processRoleBasedAuth(user: any, request: Request, response: Response) {
      const token = randomUUID();

      await DB.table("sessions").insert({
         id: token,
         user_id: user.id,
         user_agent: request.headers["user-agent"],
      });

      // Set cookie with 60-day expiration
      response.cookie("auth_id", token, 1000 * 60 * 60 * 24 * 60);

      // Redirect based on role
      switch (user.role) {
         case 'student':
            return response.redirect("/dashboard/student");
         case 'teacher':
            return response.redirect("/dashboard/teacher");
         case 'parent':
            return response.redirect("/dashboard/parent");
         case 'admin':
            return response.redirect("/dashboard/admin");
         default:
            return response.redirect("/");
      }
   }

   /**
    * Register new user with role
    */
   public processRegister = async (request: Request, response: Response) => {
      let { email, password, name, role, student_id, teacher_id } = await request.json();

      email = email.toLowerCase();

      try {
         const user = {
            id: randomUUID(),
            email: email,
            name,
            password: await Authenticate.hash(password),
            role: role || 'student',
            student_id: role === 'student' ? student_id : null,
            teacher_id: role === 'teacher' ? teacher_id : null,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf(),
         };

         await DB.table("users").insert(user);

         return this.processRoleBasedAuth(user, request, response);
      } catch (error) {
         console.log(error);
         return response
            .cookie("error", "Email sudah terdaftar", 3000)
            .redirect("/register");
      }
   }

   /**
    * Get dashboard data based on user role
    */
   public getDashboardData = async (request: Request, response: Response) => {
      const user = request.user;

      switch (user.role) {
         case 'student':
            return this.getStudentDashboard(user, response);
         case 'teacher':
            return this.getTeacherDashboard(user, response);
         case 'parent':
            return this.getParentDashboard(user, response);
         case 'admin':
            return this.getAdminDashboard(user, response);
         default:
            return response.redirect("/");
      }
   }

   private async getStudentDashboard(user: any, response: Response) {
      // Determine student_id: either from direct student login or from user.student_id
      const studentId = user.student_data ? user.id : user.student_id;
      const studentKelas = user.kelas || user.student_data?.kelas;

      console.log("📊 Loading student dashboard for:", { studentId, studentKelas, userName: user.name });

      if (!studentId) {
         console.error("❌ No student_id found for user:", user);
         return response.status(400).json({ error: "Student record not found" });
      }

      // Get student full data if not already loaded
      let studentData = user.student_data;
      if (!studentData && user.student_id) {
         studentData = await DB.from("students")
            .where("id", user.student_id)
            .first();
      }

      // Get recent attendance records
      console.log("🔍 Querying attendance with starts_at/expires_at (NOT start_time/end_time)");
      const attendance = await DB.from("attendance_records")
         .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
         .leftJoin("subjects", "attendance_sessions.subject_id", "subjects.id")
         .where("attendance_records.student_id", studentId)
         .orderBy("attendance_sessions.attendance_date", "desc")
         .orderBy("attendance_sessions.created_at", "desc")
         .limit(10)
         .select(
            "attendance_records.*",
            "attendance_sessions.attendance_date",
            "attendance_sessions.starts_at",
            "attendance_sessions.expires_at",
            "subjects.nama as subject_name"
         );

      console.log("✅ Found attendance records:", attendance.length);

      // Get attendance statistics (last 30 days)
      const thirtyDaysAgo = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
      const attendanceStats = await DB.from("attendance_records")
         .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
         .where("attendance_records.student_id", studentId)
         .where("attendance_sessions.attendance_date", ">=", thirtyDaysAgo)
         .select("attendance_records.status")
         .count("* as count")
         .groupBy("attendance_records.status");

      console.log("📊 Attendance stats:", attendanceStats);

      // Get class record first (used for schedules and exams)
      let classRecord = null;
      if (studentKelas) {
         classRecord = await DB.from("classes")
            .where("name", studentKelas)
            .orWhere("id", studentKelas)
            .first();
         
         if (classRecord) {
            console.log("📚 Found class record:", classRecord.name);
         } else {
            console.log("⚠️ Class record not found for:", studentKelas);
         }
      }

      // Get subject schedules for student's class
      let schedules = [];
      if (classRecord) {
         schedules = await DB.from("subject_classes")
            .join("subjects", "subject_classes.subject_id", "subjects.id")
            .join("users", "subject_classes.teacher_id", "users.id")
            .leftJoin("teachers", "users.teacher_id", "teachers.id")
            .where("subject_classes.class_id", classRecord.id)
            .where("subject_classes.is_active", true)
            .select(
               "subject_classes.*",
               "subjects.nama as subject_name",
               "subjects.kode as subject_code",
               "users.name as teacher_name",
               "teachers.nama as teacher_full_name"
            )
            .orderBy("subject_classes.day")
            .orderBy("subject_classes.start_time");
      }

      console.log("📅 Found schedules:", schedules.length);

      // Get upcoming exams for student's class
      let exams = [];
      if (classRecord) {
         exams = await DB.from("exams")
            .leftJoin("users", "exams.teacher_id", "users.id")
            .where("exams.class_id", classRecord.id)
            .where("exams.status", "active")
            .where("exams.start_time", ">", new Date())
            .orderBy("exams.start_time", "asc")
            .limit(5)
            .select(
               "exams.*",
               "users.name as teacher_name"
            );
      }

      console.log("📝 Found upcoming exams:", exams.length);

      return response.inertia("dashboard/student", {
         user,
         studentData,
         attendance,
         attendanceStats,
         schedules,
         exams
      });
   }

   private async getTeacherDashboard(user: any, response: Response) {
      // Get teacher record first
      const teacher = await DB.from('teachers')
         .where('user_id', user.id)
         .where('is_active', true)
         .first();

      if (!teacher) {
         return response.status(404).json({ error: 'Teacher record not found' });
      }

      // Get teacher subjects for attendance
      const teacherSubjects = await TeacherService.getTeacherSubjects(user.id);

      // Get weekly schedule
      const weeklySchedule = await TeacherService.getTeacherWeeklySchedule(user.id);

      // Get current active schedule (for overview card)
      const currentSchedule = await TeacherService.getCurrentActiveSchedule(user.id);

      // Get recent journals (use teacher.id, not user.id)
      const journals = await DB.from("teacher_journals")
         .where("teacher_id", teacher.id)
         .orderBy("created_at", "desc")
         .limit(5);

      // Get active exams (use teacher.id, not user.id)
      const exams = await DB.from("exams")
         .where("teacher_id", teacher.id)
         .where("status", "active")
         .orderBy("start_time", "asc");

      return response.inertia("dashboard/teacher", {
         user,
         teacherSubjects,
         weeklySchedule,
         currentSchedule,
         journals,
         exams
      });
   }

   private async getParentDashboard(user: any, response: Response) {
      // Get children
      const children = await DB.from("parent_student_relations")
         .join("users", "parent_student_relations.student_id", "users.id")
         .where("parent_student_relations.parent_id", user.id)
         .select("users.*", "parent_student_relations.relationship");

      // Get children's attendance summary
      const attendanceData = [];
      for (const child of children) {
         const attendance = await DB.from("attendance_records")
            .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
            .where("attendance_records.student_id", child.id)
            .where("attendance_sessions.attendance_date", ">=", dayjs().subtract(30, 'days').format('YYYY-MM-DD'))
            .select("attendance_records.status")
            .groupBy("attendance_records.status")
            .count("* as count");

         attendanceData.push({
            child_id: child.id,
            child_name: child.name,
            attendance
         });
      }

      return response.inertia("dashboard/parent", {
         user,
         children,
         attendanceData
      });
   }

   private async getAdminDashboard(user: any, response: Response) {
      // Get system statistics with real-time data from appropriate tables
      const stats = {
         total_students: await DB.from("students").where("is_active", true).count("* as count").first(),
         total_teachers: await DB.from("teachers").where("is_active", true).count("* as count").first(),
         total_parents: await DB.from("parents").where("is_active", true).count("* as count").first(),
         total_classes: await DB.from("students")
            .where("is_active", true)
            .whereNotNull("kelas")
            .where("kelas", "!=", "")
            .countDistinct("kelas as count")
            .first(),
      };

      // Get version from package.json
      let appVersion = "1.0.0"; // fallback version
      try {
         const packageJsonPath = path.join(process.cwd(), "package.json");
         const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
         appVersion = packageJson.version || "1.0.0";
      } catch (error) {
         console.warn("Could not read version from package.json:", error);
      }

      return response.inertia("dashboard/admin", {
         user,
         stats,
         appVersion
      });
   }
}

export default new SchoolAuthController();