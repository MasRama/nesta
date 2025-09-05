"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExamService_1 = __importDefault(require("../services/ExamService"));
const ExcelService_1 = __importDefault(require("../services/ExcelService"));
const roleAuth_1 = __importDefault(require("../middlewares/roleAuth"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/exams/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, crypto_1.randomUUID)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /xlsx|xls/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype.includes('sheet') || file.mimetype.includes('excel');
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});
class ExamController {
    async createPage(request, response) {
        if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can create exams" });
        }
        const DB = require('../services/DB').default;
        const classes = await DB.from("classes")
            .where("teacher_id", request.user.id)
            .select("*");
        return response.inertia("exam/create", { classes });
    }
    async importExcel(request, response) {
        try {
            if (request.user.role !== 'teacher') {
                return response.status(403).json({ error: "Only teachers can create exams" });
            }
            upload.single('excel_file')(request, response, async (err) => {
                if (err) {
                    return response.status(400).json({ error: err.message });
                }
                const file = request.file;
                if (!file) {
                    return response.status(400).json({ error: "Excel file is required" });
                }
                try {
                    const examConfig = JSON.parse(request.body.exam_config || '{}');
                    if (!examConfig.class_id || !examConfig.start_time || !examConfig.end_time) {
                        return response.status(400).json({
                            error: "Class ID, start time, and end time are required"
                        });
                    }
                    const canAccess = await roleAuth_1.default.canAccessClass(request, examConfig.class_id);
                    if (!canAccess) {
                        return response.status(403).json({ error: "Unauthorized access to class" });
                    }
                    const fileBuffer = require('fs').readFileSync(file.path);
                    const exam = await ExamService_1.default.createExamFromExcel(fileBuffer, request.user.id, examConfig.class_id, examConfig);
                    require('fs').unlinkSync(file.path);
                    return response.json({
                        message: "Exam created successfully from Excel file",
                        exam
                    });
                }
                catch (error) {
                    if (file.path) {
                        require('fs').unlinkSync(file.path);
                    }
                    throw error;
                }
            });
        }
        catch (error) {
            console.error("Error importing Excel:", error);
            return response.status(500).json({ error: error.message || "Failed to import Excel file" });
        }
    }
    async downloadTemplate(request, response) {
        try {
            const template = ExcelService_1.default.generateExamTemplate();
            response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            response.setHeader('Content-Disposition', 'attachment; filename="exam_template.xlsx"');
            return response.send(template);
        }
        catch (error) {
            console.error("Error generating template:", error);
            return response.status(500).json({ error: "Failed to generate template" });
        }
    }
    async startAttempt(request, response) {
        try {
            const { exam_id } = request.params;
            if (request.user.role !== 'student') {
                return response.status(403).json({ error: "Only students can take exams" });
            }
            const result = await ExamService_1.default.startExamAttempt(exam_id, request.user.id);
            return response.json({
                message: "Exam attempt started successfully",
                attempt: result.attempt,
                questions: result.questions
            });
        }
        catch (error) {
            console.error("Error starting exam attempt:", error);
            return response.status(400).json({ error: error.message || "Failed to start exam" });
        }
    }
    async submitAnswer(request, response) {
        try {
            const { attempt_id } = request.params;
            const { question_id, answer_index } = await request.json();
            if (request.user.role !== 'student') {
                return response.status(403).json({ error: "Only students can submit answers" });
            }
            const success = await ExamService_1.default.submitAnswer(attempt_id, question_id, answer_index);
            if (success) {
                return response.json({ message: "Answer submitted successfully" });
            }
            else {
                return response.status(400).json({ error: "Failed to submit answer" });
            }
        }
        catch (error) {
            console.error("Error submitting answer:", error);
            return response.status(400).json({ error: error.message || "Failed to submit answer" });
        }
    }
    async submitExam(request, response) {
        try {
            const { attempt_id } = request.params;
            if (request.user.role !== 'student') {
                return response.status(403).json({ error: "Only students can submit exams" });
            }
            const result = await ExamService_1.default.submitExam(attempt_id);
            return response.json({
                message: "Exam submitted successfully",
                score: result.score,
                percentage: result.percentage,
                passed: result.passed
            });
        }
        catch (error) {
            console.error("Error submitting exam:", error);
            return response.status(400).json({ error: error.message || "Failed to submit exam" });
        }
    }
    async getResults(request, response) {
        try {
            const { exam_id } = request.params;
            const exam = await ExamService_1.default.getExamById(exam_id);
            if (!exam) {
                return response.status(404).json({ error: "Exam not found" });
            }
            if (exam.teacher_id !== request.user.id && request.user.role !== 'admin') {
                return response.status(403).json({ error: "Unauthorized access to exam results" });
            }
            const results = await ExamService_1.default.getExamResults(exam_id);
            return response.json({ exam, results });
        }
        catch (error) {
            console.error("Error getting exam results:", error);
            return response.status(500).json({ error: "Failed to get exam results" });
        }
    }
    async getStudentExams(request, response) {
        try {
            const student_id = request.user.role === 'student' ? request.user.id : request.params.student_id;
            if (request.user.id !== student_id) {
                const canAccess = await roleAuth_1.default.canAccessStudent(request, student_id);
                if (!canAccess) {
                    return response.status(403).json({ error: "Unauthorized access to student data" });
                }
            }
            const exams = await ExamService_1.default.getStudentExams(student_id);
            return response.json({ exams });
        }
        catch (error) {
            console.error("Error getting student exams:", error);
            return response.status(500).json({ error: "Failed to get student exams" });
        }
    }
    async activateExam(request, response) {
        try {
            const { exam_id } = request.params;
            const exam = await ExamService_1.default.getExamById(exam_id);
            if (!exam) {
                return response.status(404).json({ error: "Exam not found" });
            }
            if (exam.teacher_id !== request.user.id && request.user.role !== 'admin') {
                return response.status(403).json({ error: "Unauthorized access to exam" });
            }
            const success = await ExamService_1.default.activateExam(exam_id);
            if (success) {
                return response.json({ message: "Exam activated successfully" });
            }
            else {
                return response.status(404).json({ error: "Exam not found" });
            }
        }
        catch (error) {
            console.error("Error activating exam:", error);
            return response.status(500).json({ error: "Failed to activate exam" });
        }
    }
    async getExamDetails(request, response) {
        try {
            const { exam_id } = request.params;
            const exam = await ExamService_1.default.getExamById(exam_id);
            if (!exam) {
                return response.status(404).json({ error: "Exam not found" });
            }
            const canAccess = await roleAuth_1.default.canAccessClass(request, exam.class_id);
            if (!canAccess) {
                return response.status(403).json({ error: "Unauthorized access to exam" });
            }
            return response.json({ exam });
        }
        catch (error) {
            console.error("Error getting exam details:", error);
            return response.status(500).json({ error: "Failed to get exam details" });
        }
    }
    async getTeacherExams(request, response) {
        try {
            const teacher_id = request.user.role === 'teacher' ? request.user.id : request.params.teacher_id;
            if (request.user.id !== teacher_id && request.user.role !== 'admin') {
                return response.status(403).json({ error: "Unauthorized access" });
            }
            const DB = require('../services/DB').default;
            const exams = await DB.from("exams")
                .join("classes", "exams.class_id", "classes.id")
                .where("exams.teacher_id", teacher_id)
                .orderBy("exams.created_at", "desc")
                .select("exams.*", "classes.name as class_name", "classes.grade_level");
            return response.json({ exams });
        }
        catch (error) {
            console.error("Error getting teacher exams:", error);
            return response.status(500).json({ error: "Failed to get teacher exams" });
        }
    }
}
exports.default = new ExamController();
//# sourceMappingURL=ExamController.js.map