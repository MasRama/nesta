import { Response, Request } from "../../type";
import ExamService from "../services/ExamService";
import ExcelService from "../services/ExcelService";
import RoleAuth from "../middlewares/roleAuth";
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

// Configure multer for Excel file uploads
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'public/uploads/exams/');
   },
   filename: (req, file, cb) => {
      const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
   }
});

const upload = multer({ 
   storage,
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
   fileFilter: (req, file, cb) => {
      // Allow only Excel files
      const allowedTypes = /xlsx|xls/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype.includes('sheet') || file.mimetype.includes('excel');
      
      if (mimetype && extname) {
         return cb(null, true);
      } else {
         cb(new Error('Only Excel files are allowed'));
      }
   }
});

class ExamController {
   /**
    * Display exam creation form
    */
   public async createPage(request: Request, response: Response) {
      if (request.user.role !== 'teacher') {
         return response.status(403).json({ error: "Only teachers can create exams" });
      }

      // Get teacher's classes
      const DB = require('../services/DB').default;
      const classes = await DB.from("classes")
         .where("teacher_id", request.user.id)
         .select("*");

      return response.inertia("exam/create", { classes });
   }

   /**
    * Import questions from Excel and create exam
    */
   public async importExcel(request: Request, response: Response) {
      try {
         if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can create exams" });
         }

         upload.single('excel_file')(request as any, response as any, async (err) => {
            if (err) {
               return response.status(400).json({ error: err.message });
            }

            const file = (request as any).file as Express.Multer.File;
            if (!file) {
               return response.status(400).json({ error: "Excel file is required" });
            }

            try {
               const examConfig = JSON.parse((request as any).body.exam_config || '{}');
               
               // Validate required fields
               if (!examConfig.class_id || !examConfig.start_time || !examConfig.end_time) {
                  return response.status(400).json({ 
                     error: "Class ID, start time, and end time are required" 
                  });
               }

               // Check if teacher can access this class
               const canAccess = await RoleAuth.canAccessClass(request, examConfig.class_id);
               if (!canAccess) {
                  return response.status(403).json({ error: "Unauthorized access to class" });
               }

               const fileBuffer = require('fs').readFileSync(file.path);
               const exam = await ExamService.createExamFromExcel(
                  fileBuffer, 
                  request.user.id, 
                  examConfig.class_id, 
                  examConfig
               );

               // Clean up uploaded file
               require('fs').unlinkSync(file.path);

               return response.json({ 
                  message: "Exam created successfully from Excel file", 
                  exam 
               });
            } catch (error) {
               // Clean up uploaded file on error
               if (file.path) {
                  require('fs').unlinkSync(file.path);
               }
               throw error;
            }
         });
      } catch (error) {
         console.error("Error importing Excel:", error);
         return response.status(500).json({ error: error.message || "Failed to import Excel file" });
      }
   }

   /**
    * Download Excel template for questions
    */
   public async downloadTemplate(request: Request, response: Response) {
      try {
         const template = ExcelService.generateExamTemplate();
         
         response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
         response.setHeader('Content-Disposition', 'attachment; filename="exam_template.xlsx"');
         
         return response.send(template);
      } catch (error) {
         console.error("Error generating template:", error);
         return response.status(500).json({ error: "Failed to generate template" });
      }
   }

   /**
    * Start exam attempt for student
    */
   public async startAttempt(request: Request, response: Response) {
      try {
         const { exam_id } = request.params;

         if (request.user.role !== 'student') {
            return response.status(403).json({ error: "Only students can take exams" });
         }

         const result = await ExamService.startExamAttempt(exam_id, request.user.id);

         return response.json({
            message: "Exam attempt started successfully",
            attempt: result.attempt,
            questions: result.questions
         });
      } catch (error) {
         console.error("Error starting exam attempt:", error);
         return response.status(400).json({ error: error.message || "Failed to start exam" });
      }
   }

   /**
    * Submit answer for exam question
    */
   public async submitAnswer(request: Request, response: Response) {
      try {
         const { attempt_id } = request.params;
         const { question_id, answer_index } = await request.json();

         if (request.user.role !== 'student') {
            return response.status(403).json({ error: "Only students can submit answers" });
         }

         const success = await ExamService.submitAnswer(attempt_id, question_id, answer_index);

         if (success) {
            return response.json({ message: "Answer submitted successfully" });
         } else {
            return response.status(400).json({ error: "Failed to submit answer" });
         }
      } catch (error) {
         console.error("Error submitting answer:", error);
         return response.status(400).json({ error: error.message || "Failed to submit answer" });
      }
   }

   /**
    * Submit complete exam
    */
   public async submitExam(request: Request, response: Response) {
      try {
         const { attempt_id } = request.params;

         if (request.user.role !== 'student') {
            return response.status(403).json({ error: "Only students can submit exams" });
         }

         const result = await ExamService.submitExam(attempt_id);

         return response.json({
            message: "Exam submitted successfully",
            score: result.score,
            percentage: result.percentage,
            passed: result.passed
         });
      } catch (error) {
         console.error("Error submitting exam:", error);
         return response.status(400).json({ error: error.message || "Failed to submit exam" });
      }
   }

   /**
    * Get exam results for teacher
    */
   public async getResults(request: Request, response: Response) {
      try {
         const { exam_id } = request.params;

         // Check if teacher owns this exam or is admin
         const exam = await ExamService.getExamById(exam_id);
         if (!exam) {
            return response.status(404).json({ error: "Exam not found" });
         }

         if (exam.teacher_id !== request.user.id && request.user.role !== 'admin') {
            return response.status(403).json({ error: "Unauthorized access to exam results" });
         }

         const results = await ExamService.getExamResults(exam_id);

         return response.json({ exam, results });
      } catch (error) {
         console.error("Error getting exam results:", error);
         return response.status(500).json({ error: "Failed to get exam results" });
      }
   }

   /**
    * Get exams for student
    */
   public async getStudentExams(request: Request, response: Response) {
      try {
         const student_id = request.user.role === 'student' ? request.user.id : request.params.student_id;

         // Check permissions for accessing student data
         if (request.user.id !== student_id) {
            const canAccess = await RoleAuth.canAccessStudent(request, student_id);
            if (!canAccess) {
               return response.status(403).json({ error: "Unauthorized access to student data" });
            }
         }

         const exams = await ExamService.getStudentExams(student_id);

         return response.json({ exams });
      } catch (error) {
         console.error("Error getting student exams:", error);
         return response.status(500).json({ error: "Failed to get student exams" });
      }
   }

   /**
    * Activate exam (make it available for students)
    */
   public async activateExam(request: Request, response: Response) {
      try {
         const { exam_id } = request.params;

         // Check if teacher owns this exam
         const exam = await ExamService.getExamById(exam_id);
         if (!exam) {
            return response.status(404).json({ error: "Exam not found" });
         }

         if (exam.teacher_id !== request.user.id && request.user.role !== 'admin') {
            return response.status(403).json({ error: "Unauthorized access to exam" });
         }

         const success = await ExamService.activateExam(exam_id);

         if (success) {
            return response.json({ message: "Exam activated successfully" });
         } else {
            return response.status(404).json({ error: "Exam not found" });
         }
      } catch (error) {
         console.error("Error activating exam:", error);
         return response.status(500).json({ error: "Failed to activate exam" });
      }
   }

   /**
    * Get exam details
    */
   public async getExamDetails(request: Request, response: Response) {
      try {
         const { exam_id } = request.params;

         const exam = await ExamService.getExamById(exam_id);
         if (!exam) {
            return response.status(404).json({ error: "Exam not found" });
         }

         // Check access permissions
         const canAccess = await RoleAuth.canAccessClass(request, exam.class_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to exam" });
         }

         return response.json({ exam });
      } catch (error) {
         console.error("Error getting exam details:", error);
         return response.status(500).json({ error: "Failed to get exam details" });
      }
   }

   /**
    * Get teacher's exams
    */
   public async getTeacherExams(request: Request, response: Response) {
      try {
         const teacher_id = request.user.role === 'teacher' ? request.user.id : request.params.teacher_id;

         // Check permissions
         if (request.user.id !== teacher_id && request.user.role !== 'admin') {
            return response.status(403).json({ error: "Unauthorized access" });
         }

         const DB = require('../services/DB').default;
         const exams = await DB.from("exams")
            .join("classes", "exams.class_id", "classes.id")
            .where("exams.teacher_id", teacher_id)
            .orderBy("exams.created_at", "desc")
            .select(
               "exams.*",
               "classes.name as class_name",
               "classes.grade_level"
            );

         return response.json({ exams });
      } catch (error) {
         console.error("Error getting teacher exams:", error);
         return response.status(500).json({ error: "Failed to get teacher exams" });
      }
   }
}

export default new ExamController();