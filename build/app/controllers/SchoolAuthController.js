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
const TeacherService_1 = __importDefault(require("../services/TeacherService"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SchoolAuthController {
    constructor() {
        this.processLogin = async (request, response) => {
            let body = await request.json();
            let { email, password, phone } = body;
            console.log("🔐 Login attempt:", { email, phone, hasPassword: !!password });
            let user;
            if (email && email.endsWith("@spensagi.id")) {
                console.log("📚 Detected student login format");
                const nipd = email.replace("@spensagi.id", "");
                console.log("🔍 Looking for student with NIPD:", nipd);
                const student = await DB_1.default.from("students")
                    .where("nipd", nipd)
                    .where("is_active", true)
                    .first();
                console.log("👨‍🎓 Student found:", student ? `Yes (${student.nama})` : "No");
                if (student) {
                    if (password === nipd) {
                        console.log("✅ Student password correct, logging in...");
                        return Authenticate_1.default.processStudent(student, request, response);
                    }
                    else {
                        console.log("❌ Student password incorrect");
                        return response
                            .cookie("error", "Password salah", 3000)
                            .redirect("/login");
                    }
                }
                console.log("⚠️ Student not found, checking other tables...");
            }
            if (email && email.includes("@")) {
                console.log("🔍 Looking for user with email:", email);
                user = await DB_1.default.from("users").where("email", email).first();
                console.log("👤 User found in users table:", user ? "Yes" : "No");
            }
            else if (phone) {
                console.log("🔍 Looking for user with phone:", phone);
                user = await DB_1.default.from("users").where("phone", phone).first();
                console.log("👤 User found in users table:", user ? "Yes" : "No");
            }
            if (user) {
                const password_match = await Authenticate_1.default.compare(password, user.password);
                console.log("🔑 Password match:", password_match);
                if (password_match) {
                    return this.processRoleBasedAuth(user, request, response);
                }
                else {
                    return response
                        .cookie("error", "Password salah", 3000)
                        .redirect("/login");
                }
            }
            if (email && email.includes("@")) {
                console.log("🔍 Looking for teacher with email:", email);
                const teacher = await DB_1.default.from("teachers")
                    .where("email", email)
                    .where("is_active", true)
                    .first();
                console.log("👨‍🏫 Teacher found:", teacher ? "Yes" : "No");
                if (teacher) {
                    const password_match = this.compareTeacherPassword(password, teacher.password);
                    console.log("🔑 Teacher password match:", password_match);
                    if (password_match) {
                        const userAccount = await this.getOrCreateUserForTeacher(teacher);
                        return this.processRoleBasedAuth(userAccount, request, response);
                    }
                    else {
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
    compareTeacherPassword(password, hashedPassword) {
        const salt = 'netsa_teacher_salt';
        const hash = (0, crypto_1.pbkdf2Sync)(password, salt, 10000, 64, 'sha512').toString('hex');
        return hash === hashedPassword;
    }
    async getOrCreateUserForTeacher(teacher) {
        if (teacher.user_id) {
            const existingUser = await DB_1.default.from("users").where("id", teacher.user_id).first();
            if (existingUser) {
                return existingUser;
            }
        }
        const existingUser = await DB_1.default.from("users").where("email", teacher.email).first();
        if (existingUser && existingUser.role === 'teacher') {
            await DB_1.default.from("teachers")
                .where("id", teacher.id)
                .update({
                user_id: existingUser.id,
                updated_at: Date.now()
            });
            return existingUser;
        }
        const userId = (0, crypto_1.randomUUID)();
        const hashedPassword = await Authenticate_1.default.hash('guru123');
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
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        await DB_1.default.transaction(async (trx) => {
            await trx.from("users").insert(userData);
            await trx.from("teachers")
                .where("id", teacher.id)
                .update({
                user_id: userId,
                updated_at: Date.now()
            });
        });
        return userData;
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
        const studentId = user.student_data ? user.id : user.student_id;
        const studentKelas = user.kelas || user.student_data?.kelas;
        console.log("📊 Loading student dashboard for:", { studentId, studentKelas, userName: user.name });
        if (!studentId) {
            console.error("❌ No student_id found for user:", user);
            return response.status(400).json({ error: "Student record not found" });
        }
        let studentData = user.student_data;
        if (!studentData && user.student_id) {
            studentData = await DB_1.default.from("students")
                .where("id", user.student_id)
                .first();
        }
        console.log("🔍 Querying attendance with starts_at/expires_at (NOT start_time/end_time)");
        const attendance = await DB_1.default.from("attendance_records")
            .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
            .leftJoin("subjects", "attendance_sessions.subject_id", "subjects.id")
            .where("attendance_records.student_id", studentId)
            .orderBy("attendance_sessions.attendance_date", "desc")
            .orderBy("attendance_sessions.created_at", "desc")
            .limit(10)
            .select("attendance_records.*", "attendance_sessions.attendance_date", "attendance_sessions.starts_at", "attendance_sessions.expires_at", "subjects.nama as subject_name");
        console.log("✅ Found attendance records:", attendance.length);
        const thirtyDaysAgo = (0, dayjs_1.default)().subtract(30, 'days').format('YYYY-MM-DD');
        const attendanceStats = await DB_1.default.from("attendance_records")
            .join("attendance_sessions", "attendance_records.attendance_session_id", "attendance_sessions.id")
            .where("attendance_records.student_id", studentId)
            .where("attendance_sessions.attendance_date", ">=", thirtyDaysAgo)
            .select("attendance_records.status")
            .count("* as count")
            .groupBy("attendance_records.status");
        console.log("📊 Attendance stats:", attendanceStats);
        let classRecord = null;
        if (studentKelas) {
            classRecord = await DB_1.default.from("classes")
                .where("name", studentKelas)
                .orWhere("id", studentKelas)
                .first();
            if (classRecord) {
                console.log("📚 Found class record:", classRecord.name);
            }
            else {
                console.log("⚠️ Class record not found for:", studentKelas);
            }
        }
        let schedules = [];
        if (classRecord) {
            schedules = await DB_1.default.from("subject_classes")
                .join("subjects", "subject_classes.subject_id", "subjects.id")
                .join("users", "subject_classes.teacher_id", "users.id")
                .leftJoin("teachers", "users.teacher_id", "teachers.id")
                .where("subject_classes.class_id", classRecord.id)
                .where("subject_classes.is_active", true)
                .select("subject_classes.*", "subjects.nama as subject_name", "subjects.kode as subject_code", "users.name as teacher_name", "teachers.nama as teacher_full_name")
                .orderBy("subject_classes.day")
                .orderBy("subject_classes.start_time");
        }
        console.log("📅 Found schedules:", schedules.length);
        let exams = [];
        if (classRecord) {
            exams = await DB_1.default.from("exams")
                .leftJoin("users", "exams.teacher_id", "users.id")
                .where("exams.class_id", classRecord.id)
                .where("exams.status", "active")
                .where("exams.start_time", ">", new Date())
                .orderBy("exams.start_time", "asc")
                .limit(5)
                .select("exams.*", "users.name as teacher_name");
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
    async getTeacherDashboard(user, response) {
        const teacher = await DB_1.default.from('teachers')
            .where('user_id', user.id)
            .where('is_active', true)
            .first();
        if (!teacher) {
            return response.status(404).json({ error: 'Teacher record not found' });
        }
        const teacherSubjects = await TeacherService_1.default.getTeacherSubjects(user.id);
        const weeklySchedule = await TeacherService_1.default.getTeacherWeeklySchedule(user.id);
        const currentSchedule = await TeacherService_1.default.getCurrentActiveSchedule(user.id);
        const journals = await DB_1.default.from("teacher_journals")
            .where("teacher_id", teacher.id)
            .orderBy("created_at", "desc")
            .limit(5);
        const exams = await DB_1.default.from("exams")
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