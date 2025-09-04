import DB from "../services/DB";
import Authenticate from "../services/Authenticate";
import { Response, Request } from "../../type"; 
import { randomUUID } from "crypto";
import dayjs from "dayjs";

class SchoolAuthController {
   /**
    * Role-based login process
    * Redirects users to appropriate dashboards based on their role
    */
   public async processLogin(request: Request, response: Response) {
      let body = await request.json();
      let { email, password, phone } = body;

      let user;

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
      } else {
         return response 
            .cookie("error", "Email/No.HP tidak terdaftar", 3000)
            .redirect("/login");
      }
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
   public async processRegister(request: Request, response: Response) {
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
   public async getDashboardData(request: Request, response: Response) {
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
      // Get teacher's classes
      const classes = await DB.from("classes")
         .where("teacher_id", user.id)
         .select("*");

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
      // Get system statistics
      const stats = {
         total_students: await DB.from("users").where("role", "student").count("* as count").first(),
         total_teachers: await DB.from("users").where("role", "teacher").count("* as count").first(),
         total_parents: await DB.from("users").where("role", "parent").count("* as count").first(),
         total_classes: await DB.from("classes").count("* as count").first(),
      };

      return response.inertia("dashboard/admin", {
         user,
         stats
      });
   }
}

export default new SchoolAuthController();