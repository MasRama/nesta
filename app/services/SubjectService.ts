import DB from "./DB";
import { randomUUID } from "crypto";

interface SubjectData {
    kode: string;
    nama: string;
    deskripsi?: string;
}

interface SubjectClassData {
    subject_id: string;
    class_id: string;
    teacher_id?: string;
    jam_per_minggu?: number;
    notes?: string;
}

interface ValidationError {
    row?: number;
    field: string;
    message: string;
    value: any;
}

class SubjectService {
    /**
     * Get all subjects with pagination and filters
     */
    async getSubjects(page: number = 1, limit: number = 10, search?: string) {
        let query = DB.from('subjects').select('*').where('is_active', true);
        
        // Apply search filter
        if (search) {
            query = query.where(function() {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('kode', 'like', `%${search}%`)
                    .orWhere('deskripsi', 'like', `%${search}%`);
            });
        }
        
        // Get total count for pagination
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = (totalResult as any)?.count || 0;
        
        // Apply pagination
        const offset = (page - 1) * limit;
        const subjects = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
        
        return {
            data: subjects,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }
    
    /**
     * Get subject by ID
     */
    async getSubjectById(id: string) {
        return await DB.from('subjects').where('id', id).where('is_active', true).first();
    }
    
    /**
     * Get subject by code
     */
    async getSubjectByCode(kode: string) {
        return await DB.from('subjects').where('kode', kode).first();
    }
    
    /**
     * Create new subject with transaction and duplicate prevention
     */
    async createSubject(data: SubjectData) {
        const id = randomUUID();
        const now = Date.now();

        const subjectData = {
            id,
            ...data,
            is_active: true,
            created_at: now,
            updated_at: now
        };

        // Use transaction to ensure atomicity
        return await DB.transaction(async (trx) => {
            // Double-check for existing subject within transaction
            const existingSubject = await trx.from('subjects')
                .where('kode', data.kode)
                .first();

            if (existingSubject) {
                // If subject already exists, return it (idempotent operation)
                return existingSubject;
            }

            // Insert new subject
            await trx.from('subjects').insert(subjectData);

            // Return the created subject
            return await trx.from('subjects')
                .where('id', id)
                .where('is_active', true)
                .first();
        });
    }
    
    /**
     * Update subject
     */
    async updateSubject(id: string, data: Partial<SubjectData>) {
        const now = Date.now();
        
        await DB.from('subjects')
            .where('id', id)
            .update({
                ...data,
                updated_at: now
            });
            
        return await this.getSubjectById(id);
    }
    
    /**
     * Delete subject (soft delete)
     */
    async deleteSubject(id: string) {
        const now = Date.now();
        return await DB.from('subjects').where('id', id).update({ is_active: false, updated_at: now });
    }
    
    /**
     * Get teachers assigned to a subject
     */
    async getSubjectTeachers(subjectId: string) {
        return await DB.from('teacher_subjects as ts')
            .join('teachers as t', 'ts.teacher_id', 't.id')
            .select('t.*', 'ts.id as assignment_id', 'ts.created_at as assigned_at')
            .where('ts.subject_id', subjectId)
            .where('ts.is_active', true)
            .where('t.is_active', true)
            .orderBy('ts.created_at', 'desc');
    }
    
    /**
     * Get subjects assigned to a teacher
     */
    async getTeacherSubjects(teacherId: string) {
        return await DB.from('teacher_subjects as ts')
            .join('subjects as s', 'ts.subject_id', 's.id')
            .select('s.*', 'ts.id as assignment_id', 'ts.created_at as assigned_at')
            .where('ts.teacher_id', teacherId)
            .where('ts.is_active', true)
            .where('s.is_active', true)
            .orderBy('ts.created_at', 'desc');
    }
    
    /**
     * Assign teacher to subject
     */
    async assignTeacherToSubject(teacherId: string, subjectId: string) {
        const id = randomUUID();
        const now = Date.now();
        
        // Check if assignment already exists
        const existing = await DB.from('teacher_subjects')
            .where('teacher_id', teacherId)
            .where('subject_id', subjectId)
            .first();
            
        if (existing) {
            // Reactivate if exists but inactive
            if (!existing.is_active) {
                await DB.from('teacher_subjects')
                    .where('id', existing.id)
                    .update({ is_active: true, updated_at: now });
                return existing;
            }
            throw new Error('Guru sudah ditugaskan ke mata pelajaran ini');
        }
        
        const assignmentData = {
            id,
            teacher_id: teacherId,
            subject_id: subjectId,
            is_active: true,
            created_at: now,
            updated_at: now
        };
        
        await DB.from('teacher_subjects').insert(assignmentData);
        return assignmentData;
    }
    
    /**
     * Unassign teacher from subject
     */
    async unassignTeacherFromSubject(teacherId: string, subjectId: string) {
        const now = Date.now();
        return await DB.from('teacher_subjects')
            .where('teacher_id', teacherId)
            .where('subject_id', subjectId)
            .update({ is_active: false, updated_at: now });
    }
    
    /**
     * Get all available teachers for assignment
     */
    async getAvailableTeachers() {
        return await DB.from('teachers')
            .select('id', 'nama', 'nip', 'email')
            .where('is_active', true)
            .orderBy('nama', 'asc');
    }

    /**
     * Get teachers data for modal with assignment status
     */
    async getTeachersForModal(subjectId: string) {
        // Get all active teachers
        const allTeachers = await DB.from('teachers')
            .select('id', 'nama', 'nip', 'email')
            .where('is_active', true)
            .orderBy('nama', 'asc');

        // Get assigned teachers for this subject
        const assignedTeachers = await DB.from('teacher_subjects')
            .select('teacher_id')
            .where('subject_id', subjectId)
            .where('is_active', true);

        const assignedTeacherIds = new Set(assignedTeachers.map(t => t.teacher_id));

        // Mark teachers as assigned or available
        const teachersWithStatus = allTeachers.map(teacher => ({
            ...teacher,
            isAssigned: assignedTeacherIds.has(teacher.id)
        }));

        return teachersWithStatus;
    }
    
    /**
     * Get all available classes
     */
    async getAvailableClasses() {
        return await DB.from('classes')
            .select('id', 'name', 'grade_level', 'academic_year')
            .orderBy('grade_level', 'asc')
            .orderBy('name', 'asc');
    }
    
    /**
     * Get classes assigned to a subject
     */
    async getSubjectClasses(subjectId: string) {
        return await DB.from('subject_classes as sc')
            .join('classes as c', 'sc.class_id', 'c.id')
            .leftJoin('users as u', 'sc.teacher_id', 'u.id')
            .select(
                'c.*',
                'sc.id as assignment_id',
                'sc.teacher_id',
                'sc.jam_per_minggu',
                'sc.notes',
                'sc.created_at as assigned_at',
                'u.name as teacher_name'
            )
            .where('sc.subject_id', subjectId)
            .where('sc.is_active', true)
            .orderBy('c.grade_level', 'asc')
            .orderBy('c.name', 'asc');
    }
    
    /**
     * Get subjects assigned to a class
     */
    async getClassSubjects(classId: string) {
        return await DB.from('subject_classes as sc')
            .join('subjects as s', 'sc.subject_id', 's.id')
            .leftJoin('users as u', 'sc.teacher_id', 'u.id')
            .select(
                's.*',
                'sc.id as assignment_id',
                'sc.teacher_id',
                'sc.jam_per_minggu',
                'sc.notes',
                'sc.created_at as assigned_at',
                'u.name as teacher_name'
            )
            .where('sc.class_id', classId)
            .where('sc.is_active', true)
            .where('s.is_active', true)
            .orderBy('s.nama', 'asc');
    }
    
    /**
     * Assign subject to class
     */
    async assignSubjectToClass(data: SubjectClassData) {
        const id = randomUUID();
        const now = Date.now();
        
        // Check if assignment already exists
        const existing = await DB.from('subject_classes')
            .where('subject_id', data.subject_id)
            .where('class_id', data.class_id)
            .first();
            
        if (existing) {
            // Reactivate if exists but inactive
            if (!existing.is_active) {
                await DB.from('subject_classes')
                    .where('id', existing.id)
                    .update({ 
                        is_active: true, 
                        teacher_id: data.teacher_id,
                        jam_per_minggu: data.jam_per_minggu,
                        notes: data.notes,
                        updated_at: now 
                    });
                return existing;
            }
            throw new Error('Mata pelajaran sudah ditugaskan ke kelas ini');
        }
        
        const assignmentData = {
            id,
            subject_id: data.subject_id,
            class_id: data.class_id,
            teacher_id: data.teacher_id,
            jam_per_minggu: data.jam_per_minggu,
            notes: data.notes,
            is_active: true,
            created_at: now,
            updated_at: now
        };
        
        await DB.from('subject_classes').insert(assignmentData);
        return assignmentData;
    }
    
    /**
     * Update subject-class assignment
     */
    async updateSubjectClassAssignment(assignmentId: string, data: Partial<SubjectClassData>) {
        const now = Date.now();
        
        await DB.from('subject_classes')
            .where('id', assignmentId)
            .update({
                ...data,
                updated_at: now
            });
            
        return await DB.from('subject_classes').where('id', assignmentId).first();
    }
    
    /**
     * Unassign subject from class
     */
    async unassignSubjectFromClass(subjectId: string, classId: string) {
        const now = Date.now();
        return await DB.from('subject_classes')
            .where('subject_id', subjectId)
            .where('class_id', classId)
            .update({ is_active: false, updated_at: now });
    }
    
    /**
     * Validate subject data
     */
    validateSubjectData(data: any, row: number = 0): ValidationError[] {
        const errors: ValidationError[] = [];
        
        // Validate kode
        if (!data.kode || typeof data.kode !== 'string' || data.kode.trim().length === 0) {
            errors.push({
                row,
                field: 'kode',
                message: 'Kode mata pelajaran wajib diisi',
                value: data.kode
            });
        } else if (data.kode.length > 10) {
            errors.push({
                row,
                field: 'kode',
                message: 'Kode mata pelajaran maksimal 10 karakter',
                value: data.kode
            });
        }
        
        // Validate nama
        if (!data.nama || typeof data.nama !== 'string' || data.nama.trim().length === 0) {
            errors.push({
                row,
                field: 'nama',
                message: 'Nama mata pelajaran wajib diisi',
                value: data.nama
            });
        } else if (data.nama.length > 100) {
            errors.push({
                row,
                field: 'nama',
                message: 'Nama mata pelajaran maksimal 100 karakter',
                value: data.nama
            });
        }
        
        // jam_per_minggu validation removed - now handled in subject_classes table
        
        // Validate deskripsi (optional)
        if (data.deskripsi && typeof data.deskripsi === 'string' && data.deskripsi.length > 500) {
            errors.push({
                row,
                field: 'deskripsi',
                message: 'Deskripsi maksimal 500 karakter',
                value: data.deskripsi
            });
        }
        
        return errors;
    }

    /**
     * Get unique classes from students table
     */
    async getUniqueClassesFromStudents() {
        const classes = await DB.from('students')
            .distinct('kelas')
            .where('is_active', true)
            .whereNotNull('kelas')
            .where('kelas', '!=', '')
            .orderBy('kelas');
        return classes.map(c => c.kelas);
    }

    /**
     * Create subject schedule (DEPRECATED - Use ClassService.assignSubjectToClass instead)
     * This method is kept for backward compatibility but should not be used for new code
     */
    async createSubjectSchedule(data: {
        subject_id: string;
        kelas: string;
        start_time: string;
        end_time: string;
        day: string;
        notes?: string;
    }) {
        throw new Error('Method deprecated. Use ClassService.assignSubjectToClass for proper subject-class assignment with schedule.');
    }

    /**
     * Get subject schedules (DEPRECATED - Use ClassService.getClassSubjects instead)
     * This method is kept for backward compatibility but should not be used for new code
     */
    async getSubjectSchedules(subjectId: string) {
        // Return schedules from subject_classes table instead
        return await DB.from('subject_classes as sc')
            .join('classes as c', 'sc.class_id', 'c.id')
            .where('sc.subject_id', subjectId)
            .where('sc.is_active', true)
            .select(
                'sc.id',
                'sc.day',
                'sc.start_time',
                'sc.end_time',
                'sc.notes',
                'c.name as kelas'
            )
            .orderBy('sc.day')
            .orderBy('sc.start_time');
    }

    /**
     * Validate schedule data
     */
    validateScheduleData(data: any): ValidationError[] {
        const errors: ValidationError[] = [];

        // Validate subject_id
        if (!data.subject_id) {
            errors.push({
                row: 0,
                field: 'subject_id',
                message: 'ID mata pelajaran wajib diisi',
                value: data.subject_id
            });
        }

        // Validate kelas
        if (!data.kelas || typeof data.kelas !== 'string' || data.kelas.trim().length === 0) {
            errors.push({
                row: 0,
                field: 'kelas',
                message: 'Kelas wajib dipilih',
                value: data.kelas
            });
        }

        // Validate start_time
        if (!data.start_time || !this.isValidTimeFormat(data.start_time)) {
            errors.push({
                row: 0,
                field: 'start_time',
                message: 'Jam mulai wajib diisi dengan format HH:MM',
                value: data.start_time
            });
        }

        // Validate end_time
        if (!data.end_time || !this.isValidTimeFormat(data.end_time)) {
            errors.push({
                row: 0,
                field: 'end_time',
                message: 'Jam selesai wajib diisi dengan format HH:MM',
                value: data.end_time
            });
        }

        // Validate time range
        if (data.start_time && data.end_time && this.isValidTimeFormat(data.start_time) && this.isValidTimeFormat(data.end_time)) {
            if (data.start_time >= data.end_time) {
                errors.push({
                    row: 0,
                    field: 'end_time',
                    message: 'Jam selesai harus lebih besar dari jam mulai',
                    value: data.end_time
                });
            }
        }

        // Validate day
        const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        if (!data.day || !validDays.includes(data.day)) {
            errors.push({
                row: 0,
                field: 'day',
                message: 'Hari wajib dipilih dari: ' + validDays.join(', '),
                value: data.day
            });
        }

        return errors;
    }

    /**
     * Check for schedule conflicts in subject_classes table
     * Updated to use the correct table after database cleanup
     */
    async checkScheduleConflicts(data: {
        subject_id: string;
        class_id: string;
        start_time: string;
        end_time: string;
        day: string;
        exclude_id?: string; // Optional: exclude specific assignment from conflict check
    }) {
        let query = DB.from('subject_classes')
            .where('class_id', data.class_id)
            .where('day', data.day)
            .where('is_active', true);

        // Exclude specific assignment if provided (useful for updates)
        if (data.exclude_id) {
            query = query.whereNot('id', data.exclude_id);
        }

        return await query.where(function() {
            this.where(function() {
                // New schedule starts during existing schedule
                this.where('start_time', '<=', data.start_time)
                    .where('end_time', '>', data.start_time);
            }).orWhere(function() {
                // New schedule ends during existing schedule
                this.where('start_time', '<', data.end_time)
                    .where('end_time', '>=', data.end_time);
            }).orWhere(function() {
                // New schedule completely contains existing schedule
                this.where('start_time', '>=', data.start_time)
                    .where('end_time', '<=', data.end_time);
            });
        });
    }

    /**
     * Validate time format (HH:MM)
     */
    private isValidTimeFormat(time: string): boolean {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    /**
     * Delete subject assignment from class (soft delete)
     * Updated to use subject_classes table after database cleanup
     */
    async deleteSubjectAssignment(assignmentId: string) {
        const now = Date.now();
        return await DB.from('subject_classes')
            .where('id', assignmentId)
            .update({ is_active: false, updated_at: now });
    }
}

export default new SubjectService();