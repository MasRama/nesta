import DB from "./DB";
import { randomUUID, createHash, pbkdf2Sync } from "crypto";
import Authenticate from "./Authenticate";
import dayjs from "dayjs";

interface TeacherData {
    nip: string;
    nama: string;
    email: string;
    password: string;
    phone?: string;
}

interface ValidationError {
    row?: number;
    field: string;
    message: string;
    value: any;
}

class TeacherService {
    /**
     * Get all teachers with pagination and filters
     */
    async getTeachers(page: number = 1, limit: number = 10, search?: string) {
        let query = DB.from('teachers').select('*').where('is_active', true);
        
        // Apply search filter
        if (search) {
            query = query.where(function() {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('nip', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`);
            });
        }
        

        
        // Get total count for pagination
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = (totalResult as any)?.count || 0;
        
        // Apply pagination
        const offset = (page - 1) * limit;
        const teachers = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
        
        return {
            data: teachers,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }
    
    /**
     * Get teacher by ID (only active teachers)
     */
    async getTeacherById(id: string) {
        return await DB.from('teachers').where('id', id).where('is_active', true).first();
    }

    /**
     * Get teacher by ID for edit operations (regardless of active status)
     */
    async getTeacherByIdForEdit(id: string) {
        return await DB.from('teachers').where('id', id).first();
    }

   /**
     * Get teacher by NIP
     */
    async getTeacherByNIP(nip: string) {
        return await DB.from('teachers').where('nip', nip).first();
    }
    
    /**
     * Get teacher by Email
     */
    async getTeacherByEmail(email: string) {
        return await DB.from('teachers').where('email', email).first();
    }
    
    /**
     * Create new teacher with transaction and duplicate prevention
     * Also creates corresponding user account for login
     */
    async createTeacher(data: TeacherData) {
        const teacherId = randomUUID();
        const userId = randomUUID();
        const hashedPasswordForTeacher = this.hashPassword(data.password);
        const hashedPasswordForUser = await Authenticate.hash(data.password);
        const now = Date.now();

        const teacherData = {
            id: teacherId,
            nip: data.nip,
            nama: data.nama,
            email: data.email,
            password: hashedPasswordForTeacher,
            phone: data.phone || null,
            user_id: userId, // Link to user account
            is_active: true,
            created_at: now,
            updated_at: now
        };

        const userData = {
            id: userId,
            name: data.nama,
            email: data.email,
            phone: data.phone || null,
            password: hashedPasswordForUser,
            role: 'teacher',
            teacher_id: teacherId,
            is_verified: true,
            is_admin: false,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
        };

        // Use transaction to ensure atomicity
        return await DB.transaction(async (trx) => {
            // Double-check for existing teacher within transaction
            const existingTeacherByNIP = await trx.from('teachers')
                .where('nip', data.nip)
                .first();

            if (existingTeacherByNIP) {
                // If teacher already exists, return it (idempotent operation)
                const { password, ...teacherWithoutPassword } = existingTeacherByNIP;
                return teacherWithoutPassword;
            }

            const existingTeacherByEmail = await trx.from('teachers')
                .where('email', data.email)
                .first();

            if (existingTeacherByEmail) {
                // If teacher already exists, return it (idempotent operation)
                const { password, ...teacherWithoutPassword } = existingTeacherByEmail;
                return teacherWithoutPassword;
            }

            // Check if user with this email already exists
            const existingUser = await trx.from('users')
                .where('email', data.email)
                .first();

            if (existingUser) {
                throw new Error('Email sudah digunakan oleh user lain');
            }

            // Insert new user first
            await trx.from('users').insert(userData);

            // Insert new teacher
            await trx.from('teachers').insert(teacherData);

            // Return the created teacher without password
            const { password, ...teacherWithoutPassword } = teacherData;
            return teacherWithoutPassword;
        });
    }
    
    /**
     * Update teacher
     */
    async updateTeacher(id: string, data: Partial<TeacherData>) {
        const updateData: any = {
            ...data,
            updated_at: Date.now()
        };
        
        // Hash password if provided
        if (data.password) {
            updateData.password = this.hashPassword(data.password);
        }
        
        await DB.from('teachers').where('id', id).update(updateData);

        // Return updated teacher without password (use edit method to get regardless of active status)
        const updatedTeacher = await this.getTeacherByIdForEdit(id);
        if (updatedTeacher) {
            const { password, ...teacherWithoutPassword } = updatedTeacher;
            return teacherWithoutPassword;
        }
        return null;
    }
    
    /**
     * Delete teacher (soft delete)
     */
    async deleteTeacher(id: string) {
        await DB.from('teachers').where('id', id).update({
            is_active: false,
            updated_at: Date.now()
        });
    }

    /**
     * Get classes and subjects taught by teacher based on subject_classes assignments
     */
    async getTeacherClassesAndSubjects(userId: string) {
        try {
            // Get classes and subjects assigned to this teacher
            const assignments = await DB.from('subject_classes as sc')
                .join('classes as c', 'sc.class_id', 'c.id')
                .join('subjects as s', 'sc.subject_id', 's.id')
                .leftJoin('teachers as t', 't.user_id', 'sc.teacher_id')
                .select(
                    'c.id as class_id',
                    'c.name as class_name',
                    'c.grade_level',
                    'c.academic_year',
                    'c.description as class_description',
                    'c.max_students',
                    's.id as subject_id',
                    's.nama as subject_name',
                    's.kode as subject_code',
                    's.deskripsi as subject_description',
                    'sc.day',
                    'sc.start_time',
                    'sc.end_time',
                    'sc.notes',
                    'sc.is_active as assignment_active',
                    't.nama as teacher_name',
                    't.nip as teacher_nip'
                )
                .where('sc.teacher_id', userId)
                .where('sc.is_active', true)
                .where('s.is_active', true)
                .orderBy('c.grade_level')
                .orderBy('c.name')
                .orderBy('sc.day')
                .orderBy('sc.start_time');

            // Group by class to get unique classes with their subjects
            const classesMap = new Map();

            assignments.forEach(assignment => {
                const classId = assignment.class_id;

                if (!classesMap.has(classId)) {
                    classesMap.set(classId, {
                        id: assignment.class_id,
                        name: assignment.class_name,
                        grade_level: assignment.grade_level,
                        academic_year: assignment.academic_year,
                        description: assignment.class_description,
                        max_students: assignment.max_students,
                        subjects: []
                    });
                }

                const classData = classesMap.get(classId);
                classData.subjects.push({
                    id: assignment.subject_id,
                    name: assignment.subject_name,
                    code: assignment.subject_code,
                    description: assignment.subject_description,
                    day: assignment.day,
                    start_time: assignment.start_time,
                    end_time: assignment.end_time,
                    notes: assignment.notes
                });
            });

            return Array.from(classesMap.values());

        } catch (error) {
            console.error('Error getting teacher classes and subjects:', error);
            throw error;
        }
    }

    /**
     * Get current teaching schedule for teacher (for today)
     */
    async getCurrentTeachingSchedule(userId: string) {
        try {
            const today = new Date();
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentDay = dayNames[today.getDay()];
            const currentTime = today.toTimeString().slice(0, 5); // HH:MM format

            const currentSchedule = await DB.from('subject_classes as sc')
                .join('classes as c', 'sc.class_id', 'c.id')
                .join('subjects as s', 'sc.subject_id', 's.id')
                .select(
                    'c.id as class_id',
                    'c.name as class_name',
                    's.id as subject_id',
                    's.nama as subject_name',
                    's.kode as subject_code',
                    'sc.day',
                    'sc.start_time',
                    'sc.end_time'
                )
                .where('sc.teacher_id', userId)
                .where('sc.day', currentDay)
                .where('sc.start_time', '<=', currentTime)
                .where('sc.end_time', '>=', currentTime)
                .where('sc.is_active', true)
                .first();

            return currentSchedule;

        } catch (error) {
            console.error('Error getting current teaching schedule:', error);
            throw error;
        }
    }

    /**
     * Hash password using crypto
     */
    private hashPassword(password: string): string {
        const salt = 'netsa_teacher_salt'; // In production, use a random salt
        return pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    }
    
    /**
     * Validate teacher data
     */
    validateTeacherData(data: any, row: number = 0): ValidationError[] {
        const errors: ValidationError[] = [];

        // Essential fields that must be present
        const essentialFields = [
            { field: 'nip', label: 'NIP' },
            { field: 'nama', label: 'Nama' },
            { field: 'email', label: 'Email' }
        ];

        // Check essential fields
        for (const { field, label } of essentialFields) {
            if (!data[field] || data[field].toString().trim() === '') {
                errors.push({
                    row,
                    field,
                    message: `${label} wajib diisi`,
                    value: data[field]
                });
            }
        }

        // NIP validation - only validate if NIP is provided and not empty
        if (data.nip && data.nip.toString().trim() !== '') {
            const nip = data.nip.toString().trim();
            if (!/^\d+$/.test(nip)) {
                errors.push({
                    row,
                    field: 'nip',
                    message: 'NIP harus berupa angka',
                    value: data.nip
                });
            }
        }

        // Email validation - only validate if email is provided and not empty
        if (data.email && data.email.toString().trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email.toString().trim())) {
                errors.push({
                    row,
                    field: 'email',
                    message: 'Format email tidak valid',
                    value: data.email
                });
            }
        }

        // Phone validation - only validate if phone is provided
        if (data.phone && data.phone.toString().trim() !== '') {
            const phone = data.phone.toString().trim();
            if (!/^[0-9+\-\s()]+$/.test(phone)) {
                errors.push({
                    row,
                    field: 'phone',
                    message: 'Format nomor telepon tidak valid',
                    value: data.phone
                });
            }
        }

        // Status validation - only validate if status is provided
        if (data.status && data.status.toString().trim() !== '') {
            const validStatuses = ['active', 'inactive'];
            if (!validStatuses.includes(data.status.toString().trim())) {
                errors.push({
                    row,
                    field: 'status',
                    message: 'Status harus "active" atau "inactive"',
                    value: data.status
                });
            }
        }



        return errors;
    }
}

export default new TeacherService();