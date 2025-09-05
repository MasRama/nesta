"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JournalService_1 = __importDefault(require("../services/JournalService"));
const roleAuth_1 = __importDefault(require("../middlewares/roleAuth"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/journals/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, crypto_1.randomUUID)()}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});
class JournalController {
    async createPage(request, response) {
        if (request.user.role !== 'teacher') {
            return response.status(403).json({ error: "Only teachers can create journals" });
        }
        const DB = require('../services/DB').default;
        const classes = await DB.from("classes")
            .where("teacher_id", request.user.id)
            .select("*");
        return response.inertia("journal/create", { classes });
    }
    async create(request, response) {
        try {
            const data = await request.json();
            if (request.user.role !== 'teacher') {
                return response.status(403).json({ error: "Only teachers can create journals" });
            }
            const canAccess = await roleAuth_1.default.canAccessClass(request, data.class_id);
            if (!canAccess) {
                return response.status(403).json({ error: "Unauthorized access to class" });
            }
            const journal = await JournalService_1.default.createJournal({
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
        }
        catch (error) {
            console.error("Error creating journal:", error);
            return response.status(500).json({ error: "Failed to create journal" });
        }
    }
    async editPage(request, response) {
        try {
            const { journal_id } = request.params;
            const journal = await JournalService_1.default.getJournalById(journal_id);
            if (!journal) {
                return response.status(404).json({ error: "Journal not found" });
            }
            if (journal.teacher_id !== request.user.id && request.user.role !== 'admin') {
                return response.status(403).json({ error: "Unauthorized access to journal" });
            }
            const DB = require('../services/DB').default;
            const classes = await DB.from("classes")
                .where("teacher_id", request.user.id)
                .select("*");
            return response.inertia("journal/edit", { journal, classes });
        }
        catch (error) {
            console.error("Error loading journal:", error);
            return response.status(500).json({ error: "Failed to load journal" });
        }
    }
    async update(request, response) {
        try {
            const { journal_id } = request.params;
            const data = await request.json();
            const journal = await JournalService_1.default.getJournalById(journal_id);
            if (!journal || (journal.teacher_id !== request.user.id && request.user.role !== 'admin')) {
                return response.status(403).json({ error: "Unauthorized access to journal" });
            }
            const success = await JournalService_1.default.updateJournal(journal_id, data);
            if (success) {
                return response.json({ message: "Journal updated successfully" });
            }
            else {
                return response.status(404).json({ error: "Journal not found" });
            }
        }
        catch (error) {
            console.error("Error updating journal:", error);
            return response.status(500).json({ error: "Failed to update journal" });
        }
    }
    async uploadMedia(request, response) {
        try {
            const { journal_id } = request.params;
            const journal = await JournalService_1.default.getJournalById(journal_id);
            if (!journal || (journal.teacher_id !== request.user.id && request.user.role !== 'admin')) {
                return response.status(403).json({ error: "Unauthorized access to journal" });
            }
            upload.array('files', 5)(request, response, async (err) => {
                if (err) {
                    return response.status(400).json({ error: err.message });
                }
                const files = request.files;
                if (!files || files.length === 0) {
                    return response.status(400).json({ error: "No files uploaded" });
                }
                const filePaths = files.map(file => `/uploads/journals/${file.filename}`);
                const success = await JournalService_1.default.addMediaFiles(journal_id, filePaths);
                if (success) {
                    return response.json({
                        message: "Files uploaded successfully",
                        files: filePaths
                    });
                }
                else {
                    return response.status(500).json({ error: "Failed to save file references" });
                }
            });
        }
        catch (error) {
            console.error("Error uploading media:", error);
            return response.status(500).json({ error: "Failed to upload media" });
        }
    }
    async getTeacherJournals(request, response) {
        try {
            const { teacher_id } = request.params;
            const { limit = 10, offset = 0 } = request.query;
            if (request.user.id !== teacher_id && request.user.role !== 'admin') {
                return response.status(403).json({ error: "Unauthorized access" });
            }
            const journals = await JournalService_1.default.getJournalsByTeacher(teacher_id, parseInt(limit), parseInt(offset));
            return response.json({ journals });
        }
        catch (error) {
            console.error("Error getting teacher journals:", error);
            return response.status(500).json({ error: "Failed to get journals" });
        }
    }
    async getClassJournals(request, response) {
        try {
            const { class_id } = request.params;
            const { limit = 10, offset = 0 } = request.query;
            const canAccess = await roleAuth_1.default.canAccessClass(request, class_id);
            if (!canAccess) {
                return response.status(403).json({ error: "Unauthorized access to class" });
            }
            const journals = await JournalService_1.default.getJournalsByClass(class_id, parseInt(limit), parseInt(offset));
            return response.json({ journals });
        }
        catch (error) {
            console.error("Error getting class journals:", error);
            return response.status(500).json({ error: "Failed to get journals" });
        }
    }
    async publish(request, response) {
        try {
            const { journal_id } = request.params;
            const journal = await JournalService_1.default.getJournalById(journal_id);
            if (!journal || (journal.teacher_id !== request.user.id && request.user.role !== 'admin')) {
                return response.status(403).json({ error: "Unauthorized access to journal" });
            }
            const success = await JournalService_1.default.publishJournal(journal_id);
            if (success) {
                return response.json({ message: "Journal published successfully" });
            }
            else {
                return response.status(404).json({ error: "Journal not found" });
            }
        }
        catch (error) {
            console.error("Error publishing journal:", error);
            return response.status(500).json({ error: "Failed to publish journal" });
        }
    }
    async delete(request, response) {
        try {
            const { journal_id } = request.params;
            const journal = await JournalService_1.default.getJournalById(journal_id);
            if (!journal || (journal.teacher_id !== request.user.id && request.user.role !== 'admin')) {
                return response.status(403).json({ error: "Unauthorized access to journal" });
            }
            const success = await JournalService_1.default.deleteJournal(journal_id);
            if (success) {
                return response.json({ message: "Journal deleted successfully" });
            }
            else {
                return response.status(404).json({ error: "Journal not found" });
            }
        }
        catch (error) {
            console.error("Error deleting journal:", error);
            return response.status(500).json({ error: "Failed to delete journal" });
        }
    }
    async search(request, response) {
        try {
            const { query, class_id, teacher_id } = request.query;
            let searchTeacherId = teacher_id;
            let searchClassId = class_id;
            if (request.user.role === 'teacher') {
                searchTeacherId = request.user.id;
            }
            else if (request.user.role === 'student' || request.user.role === 'parent') {
                if (searchClassId) {
                    const canAccess = await roleAuth_1.default.canAccessClass(request, searchClassId);
                    if (!canAccess) {
                        return response.status(403).json({ error: "Unauthorized access to class" });
                    }
                }
            }
            const journals = await JournalService_1.default.searchJournals(query, searchClassId, searchTeacherId);
            return response.json({ journals });
        }
        catch (error) {
            console.error("Error searching journals:", error);
            return response.status(500).json({ error: "Failed to search journals" });
        }
    }
}
exports.default = new JournalController();
//# sourceMappingURL=JournalController.js.map