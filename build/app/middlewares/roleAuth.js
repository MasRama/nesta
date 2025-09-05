"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoleAuth {
    static require(allowedRoles) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        return async (request, response, next) => {
            if (!request.user) {
                return response.redirect("/login");
            }
            if (!roles.includes(request.user.role)) {
                return response.status(403).json({
                    error: "Unauthorized access. Insufficient permissions."
                });
            }
            next();
        };
    }
    static student() {
        return this.require('student');
    }
    static teacher() {
        return this.require('teacher');
    }
    static parent() {
        return this.require('parent');
    }
    static admin() {
        return this.require('admin');
    }
    static teacherOrAdmin() {
        return this.require(['teacher', 'admin']);
    }
    static parentOrAdmin() {
        return this.require(['parent', 'admin']);
    }
    static async canAccessStudent(request, studentId) {
        const user = request.user;
        if (user.role === 'admin') {
            return true;
        }
        if (user.role === 'student' && user.id === studentId) {
            return true;
        }
        if (user.role === 'parent') {
            const DB = require('../services/DB').default;
            const relation = await DB.from("parent_student_relations")
                .where("parent_id", user.id)
                .where("student_id", studentId)
                .first();
            return !!relation;
        }
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
    static async canAccessClass(request, classId) {
        const user = request.user;
        if (user.role === 'admin') {
            return true;
        }
        if (user.role === 'teacher') {
            const DB = require('../services/DB').default;
            const teacherClass = await DB.from("classes")
                .where("id", classId)
                .where("teacher_id", user.id)
                .first();
            return !!teacherClass;
        }
        if (user.role === 'student') {
            const DB = require('../services/DB').default;
            const studentClass = await DB.from("student_classes")
                .where("student_id", user.id)
                .where("class_id", classId)
                .where("is_active", true)
                .first();
            return !!studentClass;
        }
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
exports.default = RoleAuth;
//# sourceMappingURL=roleAuth.js.map