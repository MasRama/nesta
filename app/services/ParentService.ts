import DB from "./DB";
import { randomUUID } from "crypto";
import dayjs from "dayjs";
import Authenticate from "./Authenticate";

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
        let query = DB.from('parents').select('*');
        
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
        return await DB.from('parents')
            .where('email', email)
            .where('is_active', true)
            .first();
    }
    
    /**
     * Create new parent with transaction and duplicate prevention
     * Also creates corresponding user account for login
     */
    async createParent(data: ParentData) {
        const parentId = randomUUID();
        const userId = randomUUID();
        const hashedPassword = await Authenticate.hash(data.password);
        const now = dayjs().valueOf();

        const parentData = {
            id: parentId,
            nama: data.nama,
            email: data.email,
            password: hashedPassword,
            phone: data.phone || null,
            notes: data.notes || null,
            is_active: true,
            created_at: now,
            updated_at: now
        };

        const userData = {
            id: userId,
            name: data.nama,
            email: data.email,
            phone: data.phone || null,
            password: hashedPassword,
            role: 'parent',
            is_verified: true,
            is_admin: false,
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

            // Check for existing user with same email
            const existingUser = await trx.from('users')
                .where('email', data.email)
                .first();

            if (existingUser) {
                throw new Error('Email sudah digunakan oleh user lain');
            }

            // Insert new parent in parents table
            await trx.from('parents').insert(parentData);

            // Insert corresponding user account for login
            await trx.from('users').insert(userData);

            // Return the created parent without password
            const { password, ...parentWithoutPassword } = parentData;
            return { ...parentWithoutPassword, user_id: userId };
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
            updateData.password = await Authenticate.hash(data.password);
        }
        
        await DB.from('parents').where('id', id).update(updateData);
        return await this.getParentById(id);
    }
    
    /**
     * Delete parent (hard delete)
     * Also deletes the corresponding user account
     */
    async deleteParent(id: string) {
        // Get parent data first to find the associated user
        const parent = await this.getParentById(id);
        
        if (!parent) {
            throw new Error('Parent tidak ditemukan');
        }

        // Use transaction to ensure atomicity
        await DB.transaction(async (trx) => {
            // Delete parent-student relationships first
            await trx.from('parent_students').where('parent_id', id).delete();

            // Delete parent from parents table
            await trx.from('parents').where('id', id).delete();

            // Delete the corresponding user account
            await trx.from('users')
                .where('email', parent.email)
                .where('role', 'parent')
                .delete();
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
        // Check if relationship already exists
        const existing = await DB.from('parent_students')
            .where('parent_id', parentId)
            .where('student_id', studentId)
            .where('relationship_type', relationshipType)
            .first();
            
        if (existing) {
            throw new Error(`Siswa sudah ditambahkan dengan hubungan ${relationshipType}`);
        }
        
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
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Parse CSV content with semicolon delimiter for parents
     */
    parseCSV(csvContent: string): { data: any[], errors: ValidationError[] } {
        const errors: ValidationError[] = [];
        const data: any[] = [];

        // Split lines and trim each line
        const allLines = csvContent.split('\n').map(line => line.trim());

        // Filter out completely empty lines
        const lines = allLines.filter(line => line.length > 0);

        if (lines.length < 3) {
            errors.push({
                field: 'file',
                message: 'File CSV harus memiliki minimal 3 baris (header, nomor urut, dan data)',
                value: null
            });
            return { data, errors };
        }

        // Skip header (baris 1) dan nomor urut (baris 2)
        // Process data starting from line 3
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];

            // Split by semicolon
            const columns = line.split(';').map(col => col.trim());

            // Skip lines that are just semicolons or have no meaningful data
            const meaningfulColumns = columns.filter(col => col && col !== '');
            if (meaningfulColumns.length === 0) {
                continue;
            }

            // Extract parent data from first 5 columns
            const parentData = {
                nama: (columns[0] || '').trim(),
                email: (columns[1] || '').trim(),
                password: (columns[2] || '').trim(),
                phone: (columns[3] || '').trim(),
                notes: (columns[4] || '').trim()
            };

            // Skip rows where ALL essential fields are empty
            const hasAnyData = parentData.nama !== '' ||
                              parentData.email !== '' ||
                              parentData.password !== '';

            if (!hasAnyData) {
                continue;
            }

            // Only process rows that have essential fields (NAMA, EMAIL, PASSWORD)
            const hasMinimumRequiredData = parentData.nama !== '' &&
                                         parentData.email !== '' &&
                                         parentData.password !== '';

            if (!hasMinimumRequiredData) {
                continue; // Skip incomplete rows silently
            }

            // Validate the row
            const rowErrors = this.validateParentData(parentData);

            // Only add data if it passes ALL validations
            if (rowErrors.length === 0) {
                data.push(parentData);
            }
        }

        return { data, errors };
    }

    /**
     * Import parents from CSV
     */
    async importFromCSV(csvContent: string): Promise<{ success: number, errors: ValidationError[], duplicates: string[] }> {
        const { data, errors } = this.parseCSV(csvContent);
        const duplicates: string[] = [];
        let success = 0;

        // If there are parsing errors, return early
        if (errors.length > 0) {
            return { success, errors, duplicates };
        }

        // Process each parent
        for (const parentData of data) {
            try {
                // Check for duplicates (Email)
                const existingByEmail = await this.getParentByEmail(parentData.email);
                if (existingByEmail) {
                    duplicates.push(`${parentData.email} (Email)`);
                    continue;
                }

                // Create parent
                await this.createParent(parentData);
                success++;
            } catch (error) {
                errors.push({
                    field: 'email',
                    message: `Gagal menyimpan wali murid dengan email ${parentData.email}: ${error.message}`,
                    value: parentData.email
                });
            }
        }

        return { success, errors, duplicates };
    }

    /**
     * Export parents to CSV format
     */
    async exportToCSV(filters?: { search?: string }): Promise<string> {
        let query = DB.from('parents');

        // Apply filters
        if (filters?.search) {
            query = query.where(function() {
                this.where('nama', 'like', `%${filters.search}%`)
                    .orWhere('email', 'like', `%${filters.search}%`)
                    .orWhere('phone', 'like', `%${filters.search}%`);
            });
        }

        const parents = await query.orderBy('nama');

        // Create CSV content
        const header = 'NAMA;EMAIL;PASSWORD;TELEPON;CATATAN;;;;;;;;;;;;;;;;;;;;';
        const numberRow = '1;2;3;4;5;;;;;;;;;;;;;;;;;;;;';

        const dataRows = parents.map(parent => {
            return `${parent.nama};${parent.email};;${parent.phone || ''};${parent.notes || ''};;;;;;;;;;;;;;;;;;;;`;
        });

        return [header, numberRow, ...dataRows].join('\n');
    }

    /**
     * Generate CSV template for parents
     */
    generateCSVTemplate(): string {
        const header = 'NAMA;EMAIL;PASSWORD;TELEPON;CATATAN;;;;;;;;;;;;;;;;;;;;';
        const numberRow = '1;2;3;4;5;;;;;;;;;;;;;;;;;;;;';
        const exampleRow = 'Budi Santoso;budi.santoso@example.com;password123;081234567890;Orang tua siswa kelas 7A;;;;;;;;;;;;;;;;;;;;';

        return [header, numberRow, exampleRow].join('\n');
    }
}

export default new ParentService();
