import DB from "../services/DB";
import Authenticate from "../services/Authenticate";
import TeacherService from "../services/TeacherService";
import { Response, Request } from "../../type";
import { randomUUID, pbkdf2Sync } from "crypto";
import dayjs from "dayjs";
import * as fs from "fs";
import * as path from "path";

class SchoolAuthController {
   /**
    * Role-based login process
    * Redirects users to appropriate dashboards based on their role
    */
   public processLogin = async (request: Request, response: Response) => {
      let body = await request.json();
      let { email, password, phone } = body;

      let user;

      // First, try to find user in users table
      if (email && email.includes("@")) {
         user = await DB.from("users").where("email", email).first();
      } else if (phone) {
         user = await DB.from("users").where("phone", phone).first();
      }

      if (user) {
         const password_match = await Authenticate.compare(password, user.password);

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
         const teacher = await DB.from("teachers")
            .where("email", email)
            .where("is_active", true)
            .first();

         if (teacher) {
            const password_match = this.compareTeacherPassword(password, teacher.password);

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
      // Get student's classes
      const classes = await DB.from("student_classes")
         .join("classes", "student_classes.class_id", "classes.id")
         .where("student_classes.student_id", user.id)
         .where("student_classes.is_active", true)
         .select("classes.*");

      // Get recent attendance
      const attendance = await DB.from("attendance_records")
         .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
         .join("classes", "attendance_sessions.class_id", "classes.id")
         .where("attendance_records.student_id", user.id)
         .orderBy("attendance_sessions.attendance_date", "desc")
         .limit(10)
         .select("attendance_records.*", "classes.name as class_name", "attendance_sessions.attendance_date");

      // Get upcoming exams
      const exams = await DB.from("exams")
         .whereIn("class_id", classes.map(c => c.id))
         .where("status", "active")
         .where("start_time", ">", new Date())
         .orderBy("start_time", "asc")
         .limit(5);

      return response.inertia("dashboard/student", {
         user,
         classes,
         attendance,
         exams
      });
   }

   private async getTeacherDashboard(user: any, response: Response) {
      // Get teacher's classes and subjects based on subject_classes assignments
      const classes = await TeacherService.getTeacherClassesAndSubjects(user.id);

      // Get current teaching schedule
      const currentSchedule = await TeacherService.getCurrentTeachingSchedule(user.id);

      // Get recent journals
      const journals = await DB.from("teacher_journals")
         .where("teacher_id", user.id)
         .orderBy("created_at", "desc")
         .limit(5);

      // Get active exams
      const exams = await DB.from("exams")
         .where("teacher_id", user.id)
         .where("status", "active")
         .orderBy("start_time", "asc");

      return response.inertia("dashboard/teacher", {
         user,
         classes,
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