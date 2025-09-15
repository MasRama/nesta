"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../services/DB"));
const Authenticate_1 = __importDefault(require("../services/Authenticate"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SchoolAuthController {
    constructor() {
        this.processLogin = async (request, response) => {
            let body = await request.json();
            let { email, password, phone } = body;
            let user;
            if (email && email.includes("@")) {
                user = await DB_1.default.from("users").where("email", email).first();
            }
            else if (phone) {
                user = await DB_1.default.from("users").where("phone", phone).first();
            }
            if (user) {
                const password_match = await Authenticate_1.default.compare(password, user.password);
                if (password_match) {
                    return this.processRoleBasedAuth(user, request, response);
                }
                else {
                    return response
                        .cookie("error", "Password salah", 3000)
                        .redirect("/login");
                }
            }
            else {
                return response
                    .cookie("error", "Email/No.HP tidak terdaftar", 3000)
                    .redirect("/login");
            }
        };
        this.processRegister = async (request, response) => {
            let { email, password, name, role, student_id, teacher_id } = await request.json();
            email = email.toLowerCase();
            try {
                const user = {
                    id: (0, crypto_1.randomUUID)(),
                    email: email,
                    name,
                    password: await Authenticate_1.default.hash(password),
                    role: role || 'student',
                    student_id: role === 'student' ? student_id : null,
                    teacher_id: role === 'teacher' ? teacher_id : null,
                    created_at: (0, dayjs_1.default)().valueOf(),
                    updated_at: (0, dayjs_1.default)().valueOf(),
                };
                await DB_1.default.table("users").insert(user);
                return this.processRoleBasedAuth(user, request, response);
            }
            catch (error) {
                console.log(error);
                return response
                    .cookie("error", "Email sudah terdaftar", 3000)
                    .redirect("/register");
            }
        };
        this.getDashboardData = async (request, response) => {
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
        };
    }
    async processRoleBasedAuth(user, request, response) {
        const token = (0, crypto_1.randomUUID)();
        await DB_1.default.table("sessions").insert({
            id: token,
            user_id: user.id,
            user_agent: request.headers["user-agent"],
        });
        response.cookie("auth_id", token, 1000 * 60 * 60 * 24 * 60);
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
    async getStudentDashboard(user, response) {
        const classes = await DB_1.default.from("student_classes")
            .join("classes", "student_classes.class_id", "classes.id")
            .where("student_classes.student_id", user.id)
            .where("student_classes.is_active", true)
            .select("classes.*");
        const attendance = await DB_1.default.from("attendance_records")
            .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
            .join("classes", "attendance_sessions.class_id", "classes.id")
            .where("attendance_records.student_id", user.id)
            .orderBy("attendance_sessions.attendance_date", "desc")
            .limit(10)
            .select("attendance_records.*", "classes.name as class_name", "attendance_sessions.attendance_date");
        const exams = await DB_1.default.from("exams")
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
    async getTeacherDashboard(user, response) {
        const classes = await DB_1.default.from("classes")
            .where("teacher_id", user.id)
            .select("*");
        const journals = await DB_1.default.from("teacher_journals")
            .where("teacher_id", user.id)
            .orderBy("created_at", "desc")
            .limit(5);
        const exams = await DB_1.default.from("exams")
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
    async getParentDashboard(user, response) {
        const children = await DB_1.default.from("parent_student_relations")
            .join("users", "parent_student_relations.student_id", "users.id")
            .where("parent_student_relations.parent_id", user.id)
            .select("users.*", "parent_student_relations.relationship");
        const attendanceData = [];
        for (const child of children) {
            const attendance = await DB_1.default.from("attendance_records")
                .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
                .where("attendance_records.student_id", child.id)
                .where("attendance_sessions.attendance_date", ">=", (0, dayjs_1.default)().subtract(30, 'days').format('YYYY-MM-DD'))
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
    async getAdminDashboard(user, response) {
        const stats = {
            total_students: await DB_1.default.from("students").where("is_active", true).count("* as count").first(),
            total_teachers: await DB_1.default.from("teachers").where("is_active", true).count("* as count").first(),
            total_parents: await DB_1.default.from("parents").where("is_active", true).count("* as count").first(),
            total_classes: await DB_1.default.from("students")
                .where("is_active", true)
                .whereNotNull("kelas")
                .where("kelas", "!=", "")
                .countDistinct("kelas as count")
                .first(),
        };
        let appVersion = "1.0.0";
        try {
            const packageJsonPath = path.join(process.cwd(), "package.json");
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
            appVersion = packageJson.version || "1.0.0";
        }
        catch (error) {
            console.warn("Could not read version from package.json:", error);
        }
        return response.inertia("dashboard/admin", {
            user,
            stats,
            appVersion
        });
    }
}
exports.default = new SchoolAuthController();
//# sourceMappingURL=SchoolAuthController.js.map