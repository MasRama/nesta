"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
class JournalService {
    async createJournal(data) {
        const journal = {
            id: (0, crypto_1.randomUUID)(),
            teacher_id: data.teacher_id,
            class_id: data.class_id,
            title: data.title,
            content: data.content,
            media_files: [],
            journal_date: data.journal_date || (0, dayjs_1.default)().format('YYYY-MM-DD'),
            status: data.status || 'draft',
            tags: data.tags || [],
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        await DB_1.default.table("teacher_journals").insert(journal);
        return journal;
    }
    async updateJournal(journalId, data) {
        const updateData = {
            ...data,
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        const result = await DB_1.default.from("teacher_journals")
            .where("id", journalId)
            .update(updateData);
        return result > 0;
    }
    async addMediaFiles(journalId, filePaths) {
        const journal = await DB_1.default.from("teacher_journals")
            .where("id", journalId)
            .first();
        if (!journal) {
            throw new Error("Journal not found");
        }
        const currentMedia = journal.media_files ? JSON.parse(journal.media_files) : [];
        const updatedMedia = [...currentMedia, ...filePaths];
        const result = await DB_1.default.from("teacher_journals")
            .where("id", journalId)
            .update({
            media_files: JSON.stringify(updatedMedia),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        return result > 0;
    }
    async removeMediaFile(journalId, filePath) {
        const journal = await DB_1.default.from("teacher_journals")
            .where("id", journalId)
            .first();
        if (!journal) {
            throw new Error("Journal not found");
        }
        const currentMedia = journal.media_files ? JSON.parse(journal.media_files) : [];
        const updatedMedia = currentMedia.filter((path) => path !== filePath);
        const result = await DB_1.default.from("teacher_journals")
            .where("id", journalId)
            .update({
            media_files: JSON.stringify(updatedMedia),
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        return result > 0;
    }
    async getJournalsByTeacher(teacherId, limit = 10, offset = 0) {
        return DB_1.default.from("teacher_journals")
            .join("classes", "teacher_journals.class_id", "classes.id")
            .where("teacher_journals.teacher_id", teacherId)
            .orderBy("teacher_journals.journal_date", "desc")
            .offset(offset)
            .limit(limit)
            .select("teacher_journals.*", "classes.name as class_name", "classes.grade_level");
    }
    async getJournalsByClass(classId, limit = 10, offset = 0) {
        return DB_1.default.from("teacher_journals")
            .join("users", "teacher_journals.teacher_id", "users.id")
            .where("teacher_journals.class_id", classId)
            .where("teacher_journals.status", "published")
            .orderBy("teacher_journals.journal_date", "desc")
            .offset(offset)
            .limit(limit)
            .select("teacher_journals.*", "users.name as teacher_name");
    }
    async getJournalById(journalId) {
        return DB_1.default.from("teacher_journals")
            .join("users", "teacher_journals.teacher_id", "users.id")
            .join("classes", "teacher_journals.class_id", "classes.id")
            .where("teacher_journals.id", journalId)
            .select("teacher_journals.*", "users.name as teacher_name", "classes.name as class_name", "classes.grade_level")
            .first();
    }
    async publishJournal(journalId) {
        const result = await DB_1.default.from("teacher_journals")
            .where("id", journalId)
            .update({
            status: 'published',
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        return result > 0;
    }
    async deleteJournal(journalId) {
        const result = await DB_1.default.from("teacher_journals")
            .where("id", journalId)
            .delete();
        return result > 0;
    }
    async searchJournals(query, classId, teacherId) {
        let dbQuery = DB_1.default.from("teacher_journals")
            .join("users", "teacher_journals.teacher_id", "users.id")
            .join("classes", "teacher_journals.class_id", "classes.id")
            .where("teacher_journals.status", "published");
        if (query) {
            dbQuery = dbQuery.where(function () {
                this.where('teacher_journals.title', 'like', `%${query}%`)
                    .orWhere('teacher_journals.content', 'like', `%${query}%`);
            });
        }
        if (classId) {
            dbQuery = dbQuery.where("teacher_journals.class_id", classId);
        }
        if (teacherId) {
            dbQuery = dbQuery.where("teacher_journals.teacher_id", teacherId);
        }
        return dbQuery
            .orderBy("teacher_journals.journal_date", "desc")
            .select("teacher_journals.*", "users.name as teacher_name", "classes.name as class_name", "classes.grade_level");
    }
    async getTeacherJournalStats(teacherId) {
        const stats = await DB_1.default.from("teacher_journals")
            .where("teacher_id", teacherId)
            .select("status")
            .count("* as count")
            .groupBy("status");
        return stats.reduce((acc, stat) => {
            acc[stat.status] = stat.count;
            return acc;
        }, {});
    }
}
exports.default = new JournalService();
//# sourceMappingURL=JournalService.js.map