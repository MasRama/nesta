"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const ExcelService_1 = __importDefault(require("./ExcelService"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
class ExamService {
    async createExamFromExcel(fileBuffer, teacherId, classId, examConfig) {
        const parsedData = await ExcelService_1.default.parseExamQuestions(fileBuffer);
        const validation = ExcelService_1.default.validateQuestionFormat(parsedData.questions);
        if (!validation.isValid) {
            throw new Error(`Invalid questions format: ${validation.errors.join(', ')}`);
        }
        const examId = (0, crypto_1.randomUUID)();
        const exam = {
            id: examId,
            teacher_id: teacherId,
            class_id: classId,
            title: examConfig.title || parsedData.metadata.title || 'Untitled Exam',
            description: examConfig.description || parsedData.metadata.description,
            duration_minutes: examConfig.duration_minutes || parsedData.metadata.duration_minutes || 60,
            randomize_questions: examConfig.randomize_questions || false,
            randomize_options: examConfig.randomize_options || false,
            start_time: new Date(examConfig.start_time),
            end_time: new Date(examConfig.end_time),
            status: 'draft',
            max_attempts: examConfig.max_attempts || 1,
            pass_score: examConfig.pass_score,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        await DB_1.default.table("exams").insert(exam);
        const questions = parsedData.questions.map((question, index) => ({
            ...question,
            exam_id: examId,
            order_index: index,
            options: JSON.stringify(question.options),
            created_at: (0, dayjs_1.default)().valueOf()
        }));
        await DB_1.default.table("exam_questions").insert(questions);
        return exam;
    }
    async startExamAttempt(examId, studentId) {
        const exam = await DB_1.default.from("exams")
            .where("id", examId)
            .where("status", "active")
            .first();
        if (!exam) {
            throw new Error("Exam not found or not active");
        }
        const now = new Date();
        if (now < new Date(exam.start_time) || now > new Date(exam.end_time)) {
            throw new Error("Exam is not available at this time");
        }
        const enrollment = await DB_1.default.from("student_classes")
            .where("student_id", studentId)
            .where("class_id", exam.class_id)
            .where("is_active", true)
            .first();
        if (!enrollment) {
            throw new Error("You are not enrolled in this class");
        }
        const previousAttempts = await DB_1.default.from("exam_attempts")
            .where("exam_id", examId)
            .where("student_id", studentId)
            .count("* as count")
            .first();
        if (previousAttempts.count >= exam.max_attempts) {
            throw new Error("Maximum attempts reached");
        }
        let questions = await DB_1.default.from("exam_questions")
            .where("exam_id", examId)
            .orderBy("order_index", "asc");
        let questionOrder = questions.map((_, index) => index);
        if (exam.randomize_questions) {
            questionOrder = this.shuffleArray([...questionOrder]);
            questions = questionOrder.map(index => questions[index]);
        }
        if (exam.randomize_options) {
            questions = questions.map(question => {
                const options = JSON.parse(question.options);
                const correctAnswer = options[question.correct_answer_index];
                const shuffledOptions = this.shuffleArray([...options]);
                const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
                return {
                    ...question,
                    options: JSON.stringify(shuffledOptions),
                    correct_answer_index: newCorrectIndex
                };
            });
        }
        const attempt = {
            id: (0, crypto_1.randomUUID)(),
            exam_id: examId,
            student_id: studentId,
            started_at: now,
            answers: [],
            question_order: exam.randomize_questions ? questionOrder : null,
            status: 'in_progress',
            attempt_number: previousAttempts.count + 1,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        await DB_1.default.table("exam_attempts").insert(attempt);
        const studentQuestions = questions.map(question => ({
            id: question.id,
            question_text: question.question_text,
            options: JSON.parse(question.options),
            points: question.points
        }));
        return { attempt, questions: studentQuestions };
    }
    async submitAnswer(attemptId, questionId, answerIndex) {
        const attempt = await DB_1.default.from("exam_attempts")
            .where("id", attemptId)
            .where("status", "in_progress")
            .first();
        if (!attempt) {
            throw new Error("Attempt not found or already submitted");
        }
        const exam = await DB_1.default.from("exams").where("id", attempt.exam_id).first();
        const timeLimit = new Date(attempt.started_at).getTime() + (exam.duration_minutes * 60 * 1000);
        if (new Date().getTime() > timeLimit) {
            await this.submitExam(attemptId);
            throw new Error("Time limit exceeded");
        }
        const currentAnswers = attempt.answers ? JSON.parse(attempt.answers) : [];
        const existingAnswerIndex = currentAnswers.findIndex((a) => a.question_id === questionId);
        const answerData = { question_id: questionId, answer_index: answerIndex, answered_at: new Date() };
        if (existingAnswerIndex >= 0) {
            currentAnswers[existingAnswerIndex] = answerData;
        }
        else {
            currentAnswers.push(answerData);
        }
        await DB_1.default.from("exam_attempts")
            .where("id", attemptId)
            .update({
            answers: JSON.stringify(currentAnswers),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        return true;
    }
    async submitExam(attemptId) {
        const attempt = await DB_1.default.from("exam_attempts")
            .where("id", attemptId)
            .first();
        if (!attempt) {
            throw new Error("Attempt not found");
        }
        if (attempt.status !== 'in_progress') {
            throw new Error("Attempt already submitted");
        }
        const exam = await DB_1.default.from("exams").where("id", attempt.exam_id).first();
        const questions = await DB_1.default.from("exam_questions").where("exam_id", attempt.exam_id);
        const answers = attempt.answers ? JSON.parse(attempt.answers) : [];
        let totalScore = 0;
        let maxScore = 0;
        questions.forEach(question => {
            maxScore += question.points;
            const studentAnswer = answers.find((a) => a.question_id === question.id);
            if (studentAnswer && studentAnswer.answer_index === question.correct_answer_index) {
                totalScore += question.points;
            }
        });
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        const passed = exam.pass_score ? percentage >= exam.pass_score : true;
        await DB_1.default.from("exam_attempts")
            .where("id", attemptId)
            .update({
            submitted_at: new Date(),
            score: totalScore,
            percentage: percentage,
            status: 'submitted',
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        return { score: totalScore, percentage, passed };
    }
    async getExamResults(examId) {
        return DB_1.default.from("exam_attempts")
            .join("users", "exam_attempts.student_id", "users.id")
            .where("exam_attempts.exam_id", examId)
            .where("exam_attempts.status", "submitted")
            .orderBy("exam_attempts.percentage", "desc")
            .select("exam_attempts.*", "users.name as student_name", "users.student_id as student_number");
    }
    async getStudentExams(studentId) {
        return DB_1.default.from("exams")
            .leftJoin("exam_attempts", function () {
            this.on("exams.id", "exam_attempts.exam_id")
                .andOn("exam_attempts.student_id", DB_1.default.raw("?", [studentId]));
        })
            .join("classes", "exams.class_id", "classes.id")
            .join("users", "exams.teacher_id", "users.id")
            .whereIn("exams.class_id", function () {
            this.select("class_id")
                .from("student_classes")
                .where("student_id", studentId)
                .where("is_active", true);
        })
            .orderBy("exams.start_time", "desc")
            .select("exams.*", "exam_attempts.score", "exam_attempts.percentage", "exam_attempts.status as attempt_status", "exam_attempts.attempt_number", "classes.name as class_name", "users.name as teacher_name");
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    async activateExam(examId) {
        const result = await DB_1.default.from("exams")
            .where("id", examId)
            .update({
            status: 'active',
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        return result > 0;
    }
    async getExamById(examId) {
        return DB_1.default.from("exams")
            .join("classes", "exams.class_id", "classes.id")
            .join("users", "exams.teacher_id", "users.id")
            .where("exams.id", examId)
            .select("exams.*", "classes.name as class_name", "users.name as teacher_name")
            .first();
    }
}
exports.default = new ExamService();
//# sourceMappingURL=ExamService.js.map