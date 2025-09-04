/**
 * Exam Service
 * Handles exam creation, question management, and student exam attempts
 */

import DB from "./DB";
import ExcelService from "./ExcelService";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

interface Exam {
   id: string;
   teacher_id: string;
   class_id: string;
   title: string;
   description?: string;
   duration_minutes: number;
   randomize_questions: boolean;
   randomize_options: boolean;
   start_time: Date;
   end_time: Date;
   status: 'draft' | 'active' | 'completed' | 'cancelled';
   max_attempts: number;
   pass_score?: number;
}

interface ExamAttempt {
   id: string;
   exam_id: string;
   student_id: string;
   started_at: Date;
   submitted_at?: Date;
   answers: any[];
   question_order?: number[];
   score?: number;
   percentage?: number;
   status: 'in_progress' | 'submitted' | 'timed_out';
   attempt_number: number;
}

class ExamService {
   /**
    * Create exam from Excel file
    */
   async createExamFromExcel(fileBuffer: Buffer, teacherId: string, classId: string, examConfig: any): Promise<Exam> {
      const parsedData = await ExcelService.parseExamQuestions(fileBuffer);
      
      // Validate questions
      const validation = ExcelService.validateQuestionFormat(parsedData.questions);
      if (!validation.isValid) {
         throw new Error(`Invalid questions format: ${validation.errors.join(', ')}`);
      }

      const examId = randomUUID();
      
      // Create exam
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
         status: 'draft' as const,
         max_attempts: examConfig.max_attempts || 1,
         pass_score: examConfig.pass_score,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      };

      await DB.table("exams").insert(exam);

      // Insert questions
      const questions = parsedData.questions.map((question, index) => ({
         ...question,
         exam_id: examId,
         order_index: index,
         options: JSON.stringify(question.options),
         created_at: dayjs().valueOf()
      }));

      await DB.table("exam_questions").insert(questions);

      return exam;
   }

   /**
    * Start exam attempt for student
    */
   async startExamAttempt(examId: string, studentId: string): Promise<{ attempt: ExamAttempt, questions: any[] }> {
      // Check if exam exists and is active
      const exam = await DB.from("exams")
         .where("id", examId)
         .where("status", "active")
         .first();

      if (!exam) {
         throw new Error("Exam not found or not active");
      }

      // Check if exam is within time window
      const now = new Date();
      if (now < new Date(exam.start_time) || now > new Date(exam.end_time)) {
         throw new Error("Exam is not available at this time");
      }

      // Check if student is enrolled in the class
      const enrollment = await DB.from("student_classes")
         .where("student_id", studentId)
         .where("class_id", exam.class_id)
         .where("is_active", true)
         .first();

      if (!enrollment) {
         throw new Error("You are not enrolled in this class");
      }

      // Check previous attempts
      const previousAttempts = await DB.from("exam_attempts")
         .where("exam_id", examId)
         .where("student_id", studentId)
         .count("* as count")
         .first();

      if (previousAttempts.count >= exam.max_attempts) {
         throw new Error("Maximum attempts reached");
      }

      // Get questions
      let questions = await DB.from("exam_questions")
         .where("exam_id", examId)
         .orderBy("order_index", "asc");

      // Randomize questions if enabled
      let questionOrder: number[] = questions.map((_, index) => index);
      if (exam.randomize_questions) {
         questionOrder = this.shuffleArray([...questionOrder]);
         questions = questionOrder.map(index => questions[index]);
      }

      // Randomize options if enabled
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

      // Create attempt
      const attempt = {
         id: randomUUID(),
         exam_id: examId,
         student_id: studentId,
         started_at: now,
         answers: [],
         question_order: exam.randomize_questions ? questionOrder : null,
         status: 'in_progress' as const,
         attempt_number: (previousAttempts.count as number) + 1,
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      };

      await DB.table("exam_attempts").insert(attempt);

      // Remove correct answers from questions sent to student
      const studentQuestions = questions.map(question => ({
         id: question.id,
         question_text: question.question_text,
         options: JSON.parse(question.options),
         points: question.points
      }));

      return { attempt, questions: studentQuestions };
   }

   /**
    * Submit exam answer
    */
   async submitAnswer(attemptId: string, questionId: string, answerIndex: number): Promise<boolean> {
      const attempt = await DB.from("exam_attempts")
         .where("id", attemptId)
         .where("status", "in_progress")
         .first();

      if (!attempt) {
         throw new Error("Attempt not found or already submitted");
      }

      // Check if exam is still within time limit
      const exam = await DB.from("exams").where("id", attempt.exam_id).first();
      const timeLimit = new Date(attempt.started_at).getTime() + (exam.duration_minutes * 60 * 1000);
      
      if (new Date().getTime() > timeLimit) {
         // Auto-submit if time is up
         await this.submitExam(attemptId);
         throw new Error("Time limit exceeded");
      }

      const currentAnswers = attempt.answers ? JSON.parse(attempt.answers) : [];
      
      // Update or add answer
      const existingAnswerIndex = currentAnswers.findIndex((a: any) => a.question_id === questionId);
      const answerData = { question_id: questionId, answer_index: answerIndex, answered_at: new Date() };

      if (existingAnswerIndex >= 0) {
         currentAnswers[existingAnswerIndex] = answerData;
      } else {
         currentAnswers.push(answerData);
      }

      await DB.from("exam_attempts")
         .where("id", attemptId)
         .update({
            answers: JSON.stringify(currentAnswers),
            updated_at: dayjs().valueOf()
         });

      return true;
   }

   /**
    * Submit complete exam
    */
   async submitExam(attemptId: string): Promise<{ score: number, percentage: number, passed: boolean }> {
      const attempt = await DB.from("exam_attempts")
         .where("id", attemptId)
         .first();

      if (!attempt) {
         throw new Error("Attempt not found");
      }

      if (attempt.status !== 'in_progress') {
         throw new Error("Attempt already submitted");
      }

      const exam = await DB.from("exams").where("id", attempt.exam_id).first();
      const questions = await DB.from("exam_questions").where("exam_id", attempt.exam_id);
      const answers = attempt.answers ? JSON.parse(attempt.answers) : [];

      // Calculate score
      let totalScore = 0;
      let maxScore = 0;

      questions.forEach(question => {
         maxScore += question.points;
         const studentAnswer = answers.find((a: any) => a.question_id === question.id);
         
         if (studentAnswer && studentAnswer.answer_index === question.correct_answer_index) {
            totalScore += question.points;
         }
      });

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const passed = exam.pass_score ? percentage >= exam.pass_score : true;

      // Update attempt
      await DB.from("exam_attempts")
         .where("id", attemptId)
         .update({
            submitted_at: new Date(),
            score: totalScore,
            percentage: percentage,
            status: 'submitted',
            updated_at: dayjs().valueOf()
         });

      return { score: totalScore, percentage, passed };
   }

   /**
    * Get exam results for teacher
    */
   async getExamResults(examId: string): Promise<any[]> {
      return DB.from("exam_attempts")
         .join("users", "exam_attempts.student_id", "users.id")
         .where("exam_attempts.exam_id", examId)
         .where("exam_attempts.status", "submitted")
         .orderBy("exam_attempts.percentage", "desc")
         .select(
            "exam_attempts.*",
            "users.name as student_name",
            "users.student_id as student_number"
         );
   }

   /**
    * Get student exam history
    */
   async getStudentExams(studentId: string): Promise<any[]> {
      return DB.from("exams")
         .leftJoin("exam_attempts", function() {
            this.on("exams.id", "exam_attempts.exam_id")
                .andOn("exam_attempts.student_id", DB.raw("?", [studentId]));
         })
         .join("classes", "exams.class_id", "classes.id")
         .join("users", "exams.teacher_id", "users.id")
         .whereIn("exams.class_id", function() {
            this.select("class_id")
                .from("student_classes")
                .where("student_id", studentId)
                .where("is_active", true);
         })
         .orderBy("exams.start_time", "desc")
         .select(
            "exams.*",
            "exam_attempts.score",
            "exam_attempts.percentage",
            "exam_attempts.status as attempt_status",
            "exam_attempts.attempt_number",
            "classes.name as class_name",
            "users.name as teacher_name"
         );
   }

   /**
    * Utility function to shuffle array
    */
   private shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
   }

   /**
    * Activate exam
    */
   async activateExam(examId: string): Promise<boolean> {
      const result = await DB.from("exams")
         .where("id", examId)
         .update({ 
            status: 'active',
            updated_at: dayjs().valueOf()
         });

      return result > 0;
   }

   /**
    * Get exam details
    */
   async getExamById(examId: string): Promise<any> {
      return DB.from("exams")
         .join("classes", "exams.class_id", "classes.id")
         .join("users", "exams.teacher_id", "users.id")
         .where("exams.id", examId)
         .select(
            "exams.*",
            "classes.name as class_name",
            "users.name as teacher_name"
         )
         .first();
   }
}

export default new ExamService();