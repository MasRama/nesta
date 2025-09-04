import { Response, Request } from "../../type";
import JournalService from "../services/JournalService";
import RoleAuth from "../middlewares/roleAuth";
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

// Configure multer for file uploads
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'public/uploads/journals/');
   },
   filename: (req, file, cb) => {
      const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
   }
});

const upload = multer({ 
   storage,
   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
   fileFilter: (req, file, cb) => {
      // Allow images and documents
      const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
         return cb(null, true);
      } else {
         cb(new Error('Only images and documents are allowed'));
      }
   }
});

class JournalController {
   /**
    * Display journal creation form
    */
   public async createPage(request: Request, response: Response) {
      // Only teachers can create journals
      if (request.user.role !== 'teacher') {
         return response.status(403).json({ error: "Only teachers can create journals" });
      }

      // Get teacher's classes
      const DB = require('../services/DB').default;
      const classes = await DB.from("classes")
         .where("teacher_id", request.user.id)
         .select("*");

      return response.inertia("journal/create", { classes });
   }

   /**
    * Create new journal entry
    */
   public async create(request: Request, response: Response) {
      try {
         const data = await request.json();
         
         if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can create journals" });
         }

         // Check if teacher can access this class
         const canAccess = await RoleAuth.canAccessClass(request, data.class_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to class" });
         }

         const journal = await JournalService.createJournal({
            teacher_id: request.user.id,
            class_id: data.class_id,
            title: data.title,
            content: data.content,
            journal_date: data.journal_date,
            status: data.status || 'draft',
            tags: data.tags
         });

         return response.json({ 
            message: "Journal created successfully", 
            journal 
         });
      } catch (error) {
         console.error("Error creating journal:", error);
         return response.status(500).json({ error: "Failed to create journal" });
      }
   }

   /**
    * Display journal edit form
    */
   public async editPage(request: Request, response: Response) {
      try {
         const { journal_id } = request.params;

         const journal = await JournalService.getJournalById(journal_id);
         
         if (!journal) {
            return response.status(404).json({ error: "Journal not found" });
         }

         // Check if teacher owns this journal
         if (journal.teacher_id !== request.user.id && request.user.role !== 'admin') {
            return response.status(403).json({ error: "Unauthorized access to journal" });
         }

         // Get teacher's classes
         const DB = require('../services/DB').default;
         const classes = await DB.from("classes")
            .where("teacher_id", request.user.id)
            .select("*");

         return response.inertia("journal/edit", { journal, classes });
      } catch (error) {
         console.error("Error loading journal:", error);
         return response.status(500).json({ error: "Failed to load journal" });
      }
   }

   /**
    * Update journal entry
    */
   public async update(request: Request, response: Response) {
      try {
         const { journal_id } = request.params;
         const data = await request.json();

         // Check journal ownership
         const journal = await JournalService.getJournalById(journal_id);
         if (!journal || (journal.teacher_id !== request.user.id && request.user.role !== 'admin')) {
            return response.status(403).json({ error: "Unauthorized access to journal" });
         }

         const success = await JournalService.updateJournal(journal_id, data);

         if (success) {
            return response.json({ message: "Journal updated successfully" });
         } else {
            return response.status(404).json({ error: "Journal not found" });
         }
      } catch (error) {
         console.error("Error updating journal:", error);
         return response.status(500).json({ error: "Failed to update journal" });
      }
   }

   /**
    * Upload media files for journal
    */
   public async uploadMedia(request: Request, response: Response) {
      try {
         const { journal_id } = request.params;

         // Check journal ownership
         const journal = await JournalService.getJournalById(journal_id);
         if (!journal || (journal.teacher_id !== request.user.id && request.user.role !== 'admin')) {
            return response.status(403).json({ error: "Unauthorized access to journal" });
         }

         // Handle file upload
         upload.array('files', 5)(request as any, response as any, async (err) => {
            if (err) {
               return response.status(400).json({ error: err.message });
            }

            const files = (request as any).files as Express.Multer.File[];
            if (!files || files.length === 0) {
               return response.status(400).json({ error: "No files uploaded" });
            }

            const filePaths = files.map(file => `/uploads/journals/${file.filename}`);
            
            const success = await JournalService.addMediaFiles(journal_id, filePaths);

            if (success) {
               return response.json({ 
                  message: "Files uploaded successfully", 
                  files: filePaths 
               });
            } else {
               return response.status(500).json({ error: "Failed to save file references" });
            }
         });
      } catch (error) {
         console.error("Error uploading media:", error);
         return response.status(500).json({ error: "Failed to upload media" });
      }
   }

   /**
    * Get journals by teacher
    */
   public async getTeacherJournals(request: Request, response: Response) {
      try {
         const { teacher_id } = request.params;
         const { limit = 10, offset = 0 } = request.query;

         // Check if user can access teacher's journals
         if (request.user.id !== teacher_id && request.user.role !== 'admin') {
            return response.status(403).json({ error: "Unauthorized access" });
         }

         const journals = await JournalService.getJournalsByTeacher(
            teacher_id, 
            parseInt(limit as string), 
            parseInt(offset as string)
         );

         return response.json({ journals });
      } catch (error) {
         console.error("Error getting teacher journals:", error);
         return response.status(500).json({ error: "Failed to get journals" });
      }
   }

   /**
    * Get journals by class
    */
   public async getClassJournals(request: Request, response: Response) {
      try {
         const { class_id } = request.params;
         const { limit = 10, offset = 0 } = request.query;

         // Check if user can access this class
         const canAccess = await RoleAuth.canAccessClass(request, class_id);
         if (!canAccess) {
            return response.status(403).json({ error: "Unauthorized access to class" });
         }

         const journals = await JournalService.getJournalsByClass(
            class_id, 
            parseInt(limit as string), 
            parseInt(offset as string)
         );

         return response.json({ journals });
      } catch (error) {
         console.error("Error getting class journals:", error);
         return response.status(500).json({ error: "Failed to get journals" });
      }
   }

   /**
    * Publish journal
    */
   public async publish(request: Request, response: Response) {
      try {
         const { journal_id } = request.params;

         // Check journal ownership
         const journal = await JournalService.getJournalById(journal_id);
         if (!journal || (journal.teacher_id !== request.user.id && request.user.role !== 'admin')) {
            return response.status(403).json({ error: "Unauthorized access to journal" });
         }

         const success = await JournalService.publishJournal(journal_id);

         if (success) {
            return response.json({ message: "Journal published successfully" });
         } else {
            return response.status(404).json({ error: "Journal not found" });
         }
      } catch (error) {
         console.error("Error publishing journal:", error);
         return response.status(500).json({ error: "Failed to publish journal" });
      }
   }

   /**
    * Delete journal
    */
   public async delete(request: Request, response: Response) {
      try {
         const { journal_id } = request.params;

         // Check journal ownership
         const journal = await JournalService.getJournalById(journal_id);
         if (!journal || (journal.teacher_id !== request.user.id && request.user.role !== 'admin')) {
            return response.status(403).json({ error: "Unauthorized access to journal" });
         }

         const success = await JournalService.deleteJournal(journal_id);

         if (success) {
            return response.json({ message: "Journal deleted successfully" });
         } else {
            return response.status(404).json({ error: "Journal not found" });
         }
      } catch (error) {
         console.error("Error deleting journal:", error);
         return response.status(500).json({ error: "Failed to delete journal" });
      }
   }

   /**
    * Search journals
    */
   public async search(request: Request, response: Response) {
      try {
         const { query, class_id, teacher_id } = request.query;

         // Apply access control based on user role
         let searchTeacherId = teacher_id as string;
         let searchClassId = class_id as string;

         if (request.user.role === 'teacher') {
            // Teachers can only search their own journals
            searchTeacherId = request.user.id;
         } else if (request.user.role === 'student' || request.user.role === 'parent') {
            // Students and parents can only see published journals from their classes
            if (searchClassId) {
               const canAccess = await RoleAuth.canAccessClass(request, searchClassId);
               if (!canAccess) {
                  return response.status(403).json({ error: "Unauthorized access to class" });
               }
            }
         }

         const journals = await JournalService.searchJournals(
            query as string, 
            searchClassId, 
            searchTeacherId
         );

         return response.json({ journals });
      } catch (error) {
         console.error("Error searching journals:", error);
         return response.status(500).json({ error: "Failed to search journals" });
      }
   }
}

export default new JournalController();