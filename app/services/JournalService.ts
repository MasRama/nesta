/**
 * Journal Service
 * Handles teacher journal creation, media uploads, and management
 */

import DB from "./DB";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

interface Journal {
   id: string;
   teacher_id: string;
   class_id: string;
   title: string;
   content: string;
   media_files?: string[];
   journal_date: string;
   status: 'draft' | 'published';
   tags?: string[];
}

interface CreateJournalData {
   teacher_id: string;
   class_id: string;
   title: string;
   content: string;
   journal_date?: string;
   status?: 'draft' | 'published';
   tags?: string[];
}

class JournalService {
   /**
    * Create a new journal entry
    */
   async createJournal(data: CreateJournalData): Promise<Journal> {
      const journal = {
         id: randomUUID(),
         teacher_id: data.teacher_id,
         class_id: data.class_id,
         title: data.title,
         content: data.content,
         media_files: [],
         journal_date: data.journal_date || dayjs().format('YYYY-MM-DD'),
         status: data.status || 'draft' as const,
         tags: data.tags || [],
         created_at: dayjs().valueOf(),
         updated_at: dayjs().valueOf()
      };

      await DB.table("teacher_journals").insert(journal);
      return journal;
   }

   /**
    * Update existing journal
    */
   async updateJournal(journalId: string, data: Partial<CreateJournalData>): Promise<boolean> {
      const updateData = {
         ...data,
         updated_at: dayjs().valueOf()
      };

      const result = await DB.from("teacher_journals")
         .where("id", journalId)
         .update(updateData);

      return result > 0;
   }

   /**
    * Add media files to journal
    */
   async addMediaFiles(journalId: string, filePaths: string[]): Promise<boolean> {
      const journal = await DB.from("teacher_journals")
         .where("id", journalId)
         .first();

      if (!journal) {
         throw new Error("Journal not found");
      }

      const currentMedia = journal.media_files ? JSON.parse(journal.media_files) : [];
      const updatedMedia = [...currentMedia, ...filePaths];

      const result = await DB.from("teacher_journals")
         .where("id", journalId)
         .update({ 
            media_files: JSON.stringify(updatedMedia),
            updated_at: dayjs().valueOf()
         });

      return result > 0;
   }

   /**
    * Remove media file from journal
    */
   async removeMediaFile(journalId: string, filePath: string): Promise<boolean> {
      const journal = await DB.from("teacher_journals")
         .where("id", journalId)
         .first();

      if (!journal) {
         throw new Error("Journal not found");
      }

      const currentMedia = journal.media_files ? JSON.parse(journal.media_files) : [];
      const updatedMedia = currentMedia.filter((path: string) => path !== filePath);

      const result = await DB.from("teacher_journals")
         .where("id", journalId)
         .update({ 
            media_files: JSON.stringify(updatedMedia),
            updated_at: dayjs().valueOf()
         });

      return result > 0;
   }

   /**
    * Get journals by teacher
    */
   async getJournalsByTeacher(teacherId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
      return DB.from("teacher_journals")
         .join("classes", "teacher_journals.class_id", "classes.id")
         .where("teacher_journals.teacher_id", teacherId)
         .orderBy("teacher_journals.journal_date", "desc")
         .offset(offset)
         .limit(limit)
         .select(
            "teacher_journals.*",
            "classes.name as class_name",
            "classes.grade_level"
         );
   }

   /**
    * Get journals by class
    */
   async getJournalsByClass(classId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
      return DB.from("teacher_journals")
         .join("users", "teacher_journals.teacher_id", "users.id")
         .where("teacher_journals.class_id", classId)
         .where("teacher_journals.status", "published")
         .orderBy("teacher_journals.journal_date", "desc")
         .offset(offset)
         .limit(limit)
         .select(
            "teacher_journals.*",
            "users.name as teacher_name"
         );
   }

   /**
    * Get journal by ID
    */
   async getJournalById(journalId: string): Promise<any> {
      return DB.from("teacher_journals")
         .join("users", "teacher_journals.teacher_id", "users.id")
         .join("classes", "teacher_journals.class_id", "classes.id")
         .where("teacher_journals.id", journalId)
         .select(
            "teacher_journals.*",
            "users.name as teacher_name",
            "classes.name as class_name",
            "classes.grade_level"
         )
         .first();
   }

   /**
    * Publish journal
    */
   async publishJournal(journalId: string): Promise<boolean> {
      const result = await DB.from("teacher_journals")
         .where("id", journalId)
         .update({ 
            status: 'published',
            updated_at: dayjs().valueOf()
         });

      return result > 0;
   }

   /**
    * Delete journal
    */
   async deleteJournal(journalId: string): Promise<boolean> {
      const result = await DB.from("teacher_journals")
         .where("id", journalId)
         .delete();

      return result > 0;
   }

   /**
    * Search journals
    */
   async searchJournals(query: string, classId?: string, teacherId?: string): Promise<any[]> {
      let dbQuery = DB.from("teacher_journals")
         .join("users", "teacher_journals.teacher_id", "users.id")
         .join("classes", "teacher_journals.class_id", "classes.id")
         .where("teacher_journals.status", "published");

      if (query) {
         dbQuery = dbQuery.where(function() {
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
         .select(
            "teacher_journals.*",
            "users.name as teacher_name",
            "classes.name as class_name",
            "classes.grade_level"
         );
   }

   /**
    * Get journal statistics for teacher
    */
   async getTeacherJournalStats(teacherId: string): Promise<any> {
      const stats = await DB.from("teacher_journals")
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

export default new JournalService();