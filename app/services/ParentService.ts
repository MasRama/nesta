import DB from "./DB";
import { randomUUID, pbkdf2Sync } from "crypto";
import dayjs from "dayjs";

interface ParentData {
    nama: string;
    email: string;
    password: string;
    phone?: string;
    notes?: string;
}

interface ValidationError {
    field: string;
    message: string;
    value: any;
}

interface StudentRelation {
    student_id: string;
    nipd: string;
    relationship_type: 'ayah' | 'ibu' | 'wali' | 'lainnya';
    is_primary_contact: boolean;
}

class ParentService {
    /**
     * Get all parents with pagination and filters
     */
    async getParents(page: number = 1, limit: number = 10, search?: string) {
        let query = DB.from('parents').select('*').where('is_active', true);
        
        // Apply search filter
        if (search) {
            query = query.where(function() {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`)
                    .orWhere('phone', 'like', `%${search}%`);
            });
        }
        
        // Get total count for pagination
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = (totalResult as any)?.count || 0;

        // Get paginated results with student count
        const parents = await query
            .leftJoin('parent_students', 'parents.id', 'parent_students.parent_id')
            .select('parents.*')
            .count('parent_students.id as student_count')
            .groupBy('parents.id')
            .orderBy('parents.created_at', 'desc')
            .offset((page - 1) * limit)
            .limit(limit);

        return {
            data: parents,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }
    
    /**
     * Get parent by ID
     */
    async getParentById(id: string) {
        return await DB.from('parents').where('id', id).first();
    }
    
    /**
     * Get parent by email
     */
    async getParentByEmail(email: string) {
        return await DB.from('parents').where('email', email).first();
    }
    
    /**
     * Create new parent with transaction and duplicate prevention
     */
    async createParent(data: ParentData) {
        const id = randomUUID();
        const hashedPassword = this.hashPassword(data.password);
        const now = dayjs().valueOf();

        const parentData = {
            id,
            nama: data.nama,
            email: data.email,
            password: hashedPassword,
            phone: data.phone || null,
            notes: data.notes || null,
            is_active: true,
            created_at: now,
            updated_at: now
        };

        // Use transaction to ensure atomicity
        return await DB.transaction(async (trx) => {
            // Double-check for existing parent within transaction
            const existingParent = await trx.from('parents')
                .where('email', data.email)
                .first();

            if (existingParent) {
                // If parent already exists, return it (idempotent operation)
                const { password, ...parentWithoutPassword } = existingParent;
                return parentWithoutPassword;
            }

            // Insert new parent
            await trx.from('parents').insert(parentData);

            // Return the created parent without password
            const { password, ...parentWithoutPassword } = parentData;
            return parentWithoutPassword;
        });
    }
    
    /**
     * Update parent
     */
    async updateParent(id: string, data: Partial<ParentData>) {
        const updateData: any = {
            ...data,
            updated_at: dayjs().valueOf()
        };
        
        // Hash password if provided
        if (data.password) {
            updateData.password = this.hashPassword(data.password);
        }
        
        await DB.from('parents').where('id', id).update(updateData);
        return await this.getParentById(id);
    }
    
    /**
     * Delete parent (soft delete)
     */
    async deleteParent(id: string) {
        await DB.from('parents').where('id', id).update({
            is_active: false,
            updated_at: dayjs().valueOf()
        });
    }
    
    /**
     * Get students for a parent
     */
    async getParentStudents(parentId: string) {
        return await DB.from('parent_students')
            .join('students', 'parent_students.student_id', 'students.id')
            .select(
                'students.*',
                'parent_students.relationship_type',
                'parent_students.is_primary_contact',
                'parent_students.id as relation_id'
            )
            .where('parent_students.parent_id', parentId)
            .orderBy('parent_students.created_at', 'desc');
    }
    
    /**
     * Search student by NIPD
     */
    async searchStudentByNipd(nipd: string) {
        return await DB.from('students')
            .where('nipd', nipd)
            .where('is_active', true)
            .first();
    }
    
    /**
     * Add student to parent
     */
    async addStudentToParent(parentId: string, studentId: string, relationshipType: string, isPrimaryContact: boolean = false) {
        const relationData = {
            id: randomUUID(),
            parent_id: parentId,
            student_id: studentId,
            relationship_type: relationshipType,
            is_primary_contact: isPrimaryContact,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
        };
        
        await DB.from('parent_students').insert(relationData);
        return relationData;
    }
    
    /**
     * Remove student from parent
     */
    async removeStudentFromParent(parentId: string, studentId: string) {
        await DB.from('parent_students')
            .where('parent_id', parentId)
            .where('student_id', studentId)
            .delete();
    }
    
    /**
     * Validate parent data
     */
    validateParentData(data: any): ValidationError[] {
        const errors: ValidationError[] = [];
        
        if (!data.nama || data.nama.trim().length === 0) {
            errors.push({
                field: 'nama',
                message: 'Nama wali murid harus diisi',
                value: data.nama
            });
        }
        
        if (!data.email || data.email.trim().length === 0) {
            errors.push({
                field: 'email',
                message: 'Email harus diisi',
                value: data.email
            });
        } else if (!this.isValidEmail(data.email)) {
            errors.push({
                field: 'email',
                message: 'Format email tidak valid',
                value: data.email
            });
        }
        
        // Only validate password if it's provided (for update operations)
        if (data.hasOwnProperty('password')) {
            if (!data.password || data.password.length < 6) {
                errors.push({
                    field: 'password',
                    message: 'Password minimal 6 karakter',
                    value: data.password
                });
            }
        }
        
        return errors;
    }
    
    /**
     * Hash password
     */
    private hashPassword(password: string): string {
        return pbkdf2Sync(password, 'salt', 1000, 64, 'sha512').toString('hex');
    }
    
    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export default new ParentService();
