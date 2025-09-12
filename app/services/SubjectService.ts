import DB from "./DB";
import { randomUUID } from "crypto";

interface SubjectData {
    kode: string;
    nama: string;
    deskripsi?: string;
    jam_per_minggu?: number;
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
     * Create new subject
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
        
        await DB.from('subjects').insert(subjectData);
        return await this.getSubjectById(id);
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
        
        // Validate jam_per_minggu (optional)
        if (data.jam_per_minggu !== undefined && data.jam_per_minggu !== null) {
            const jamPerMinggu = parseInt(data.jam_per_minggu);
            if (isNaN(jamPerMinggu) || jamPerMinggu < 1 || jamPerMinggu > 20) {
                errors.push({
                    row,
                    field: 'jam_per_minggu',
                    message: 'Jam per minggu harus berupa angka antara 1-20',
                    value: data.jam_per_minggu
                });
            }
        }
        
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
}

export default new SubjectService();