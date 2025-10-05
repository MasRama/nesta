"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../services/DB"));
exports.default = async (request, response) => {
    if (request.cookies.auth_id) {
        const session = await DB_1.default.from("sessions").where("id", request.cookies.auth_id).first();
        if (session) {
            if (session.student_id) {
                const student = await DB_1.default.from("students")
                    .where("id", session.student_id)
                    .select(["id", "nipd", "nama", "kelas", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama", "is_active"])
                    .first();
                if (student && student.is_active) {
                    request.user = {
                        id: student.id,
                        name: student.nama,
                        email: `${student.nipd}@spensagi.id`,
                        role: 'student',
                        nipd: student.nipd,
                        kelas: student.kelas,
                        student_data: student
                    };
                    request.share = {
                        "user": request.user,
                    };
                }
                else {
                    response.cookie("auth_id", "", 0).redirect("/login");
                }
            }
            else if (session.user_id) {
                const user = await DB_1.default.from("users")
                    .where("id", session.user_id)
                    .select(["id", "name", "email", "phone", "is_admin", "is_verified", "role", "student_id", "teacher_id", "profile_image"])
                    .first();
                if (user) {
                    request.user = user;
                    request.share = {
                        "user": request.user,
                    };
                }
                else {
                    response.cookie("auth_id", "", 0).redirect("/login");
                }
            }
            else {
                response.cookie("auth_id", "", 0).redirect("/login");
            }
        }
        else {
            response.cookie("auth_id", "", 0).redirect("/login");
        }
    }
    else {
        response.cookie("auth_id", "", 0).redirect("/login");
    }
};
//# sourceMappingURL=auth.js.map