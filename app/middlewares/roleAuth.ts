import { Request, Response } from "../../type";

/**
 * Role-based authorization middleware
 * Checks if user has required role(s) to access protected routes
 */
class RoleAuth {
   /**
    * Create middleware that checks for specific roles
    * @param allowedRoles - Array of roles that can access the route
    */
   static require(allowedRoles: string | string[]) {
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      return async (request: Request, response: Response, next: Function) => {
         // Check if user is authenticated
         if (!request.user) {
            return response.redirect("/login");
         }

         // Check if user has required role
         if (!roles.includes(request.user.role)) {
            return response.status(403).json({ 
               error: "Unauthorized access. Insufficient permissions." 
            });
         }

         next();
      };
   }

   /**
    * Middleware for student-only routes
    */
   static student() {
      return this.require('student');
   }

   /**
    * Middleware for teacher-only routes
    */
   static teacher() {
      return this.require('teacher');
   }

   /**
    * Middleware for parent-only routes
    */
   static parent() {
      return this.require('parent');
   }

   /**
    * Middleware for admin-only routes
    */
   static admin() {
      return this.require('admin');
   }

   /**
    * Middleware for teacher and admin routes
    */
   static teacherOrAdmin() {
      return this.require(['teacher', 'admin']);
   }

   /**
    * Middleware for parent and admin routes (for accessing student data)
    */
   static parentOrAdmin() {
      return this.require(['parent', 'admin']);
   }

   /**
    * Check if user can access specific student data
    * Used for parent-student relationship validation
    */
   static async canAccessStudent(request: Request, studentId: string): Promise<boolean> {
      const user = request.user;

      // Admin can access any student
      if (user.role === 'admin') {
         return true;
      }

      // Student can access their own data
      if (user.role === 'student' && user.id === studentId) {
         return true;
      }

      // Parent can access their children's data
      if (user.role === 'parent') {
         const DB = require('../services/DB').default;
         const relation = await DB.from("parent_student_relations")
            .where("parent_id", user.id)
            .where("student_id", studentId)
            .first();
         
         return !!relation;
      }

      // Teacher can access students in their classes
      if (user.role === 'teacher') {
         const DB = require('../services/DB').default;
         const studentClass = await DB.from("student_classes")
            .join("classes", "student_classes.class_id", "classes.id")
            .where("student_classes.student_id", studentId)
            .where("classes.teacher_id", user.id)
            .where("student_classes.is_active", true)
            .first();
         
         return !!studentClass;
      }

      return false;
   }

   /**
    * Check if user can access specific class data
    */
   static async canAccessClass(request: Request, classId: string): Promise<boolean> {
      const user = request.user;

      // Admin can access any class
      if (user.role === 'admin') {
         return true;
      }

      // Teacher can access classes they teach
      if (user.role === 'teacher') {
         const DB = require('../services/DB').default;
         const teacherClass = await DB.from("classes")
            .where("id", classId)
            .where("teacher_id", user.id)
            .first();
         
         return !!teacherClass;
      }

      // Student can access classes they're enrolled in
      if (user.role === 'student') {
         const DB = require('../services/DB').default;
         const studentClass = await DB.from("student_classes")
            .where("student_id", user.id)
            .where("class_id", classId)
            .where("is_active", true)
            .first();
         
         return !!studentClass;
      }

      // Parent can access classes their children are in
      if (user.role === 'parent') {
         const DB = require('../services/DB').default;
         const parentClass = await DB.from("parent_student_relations")
            .join("student_classes", "parent_student_relations.student_id", "student_classes.student_id")
            .where("parent_student_relations.parent_id", user.id)
            .where("student_classes.class_id", classId)
            .where("student_classes.is_active", true)
            .first();
         
         return !!parentClass;
      }

      return false;
   }
}

export default RoleAuth;