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
            // First get teacher ID from user ID
            const teacher = await DB.from('teachers')
                .where('user_id', userId)
                .where('is_active', true)
                .first();

            if (!teacher) {
                return [];
            }

            // Get classes and subjects assigned to this teacher
            const assignments = await DB.from('subject_classes as sc')
                .join('classes as c', 'sc.class_id', 'c.id')
                .join('subjects as s', 'sc.subject_id', 's.id')
                .leftJoin('teachers as t', 't.id', 'sc.teacher_id')
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
                .where('sc.teacher_id', teacher.id) // Use teacher.id instead of userId
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

    /**
     * Get current active schedule for teacher
     * Returns the subject and class that teacher should be teaching right now
     */
    async getCurrentActiveSchedule(teacherUserId: string): Promise<{
        hasActiveSchedule: boolean,
        schedule?: any,
        message: string
    }> {
        try {
            const now = new Date();
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentDay = dayNames[now.getDay()];
            const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

            // Get current active schedule for teacher
            const schedule = await DB.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacherUserId)
                .where("sc.day", currentDay)
                .where("sc.start_time", "<=", currentTime)
                .where("sc.end_time", ">=", currentTime)
                .where("sc.is_active", true)
                .where("s.is_active", true)
                .select(
                    "sc.*",
                    "s.id as subject_id",
                    "s.nama as subject_name",
                    "s.kode as subject_code",
                    "s.deskripsi as subject_description",
                    "c.name as class_name"
                )
                .first();

            if (!schedule) {
                return {
                    hasActiveSchedule: false,
                    message: `Tidak ada jadwal mengajar saat ini (${currentDay}, ${currentTime})`
                };
            }

            return {
                hasActiveSchedule: true,
                schedule: {
                    ...schedule,
                    current_day: currentDay,
                    current_time: currentTime
                },
                message: `Sedang mengajar ${schedule.subject_name} di kelas ${schedule.kelas}`
            };

        } catch (error) {
            console.error("Error getting current active schedule:", error);
            return {
                hasActiveSchedule: false,
                message: "Terjadi kesalahan saat mengambil jadwal"
            };
        }
    }

    /**
     * Get all subjects taught by teacher with schedule information
     */
    async getTeacherSubjects(teacherUserId: string): Promise<any[]> {
        try {
            // First get teacher ID from user ID
            const teacher = await DB.from('teachers')
                .where('user_id', teacherUserId)
                .where('is_active', true)
                .first();

            if (!teacher) {
                return [];
            }

            // Get subjects with their schedule information from subject_classes
            const subjectsWithSchedule = await DB.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacher.id) // Use teacher.id instead of teacherUserId
                .where("sc.is_active", true)
                .where("s.is_active", true)
                .select(
                    "s.id",
                    "s.nama",
                    "s.kode",
                    "s.deskripsi",
                    "sc.day",
                    "sc.start_time",
                    "sc.end_time",
                    "c.name as kelas"
                )
                .orderBy("s.nama")
                .orderBy("sc.day")
                .orderBy("sc.start_time");

            // Group schedules by subject
            const subjectsMap = new Map();

            subjectsWithSchedule.forEach(item => {
                const subjectId = item.id;

                if (!subjectsMap.has(subjectId)) {
                    subjectsMap.set(subjectId, {
                        id: item.id,
                        nama: item.nama,
                        kode: item.kode,
                        deskripsi: item.deskripsi,
                        schedules: []
                    });
                }

                // Add schedule if it exists
                if (item.day && item.start_time && item.end_time) {
                    subjectsMap.get(subjectId).schedules.push({
                        day: item.day,
                        start_time: item.start_time,
                        end_time: item.end_time,
                        kelas: item.kelas
                    });
                }
            });

            return Array.from(subjectsMap.values());
        } catch (error) {
            console.error("Error getting teacher subjects:", error);
            return [];
        }
    }

    /**
     * Get weekly schedule for teacher
     */
    async getTeacherWeeklySchedule(teacherUserId: string): Promise<any[]> {
        try {
            const schedule = await DB.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacherUserId)
                .where("sc.is_active", true)
                .where("s.is_active", true)
                .select(
                    "sc.day",
                    "sc.start_time",
                    "sc.end_time",
                    "c.name as kelas",
                    "s.id as subject_id",
                    "s.nama as subject_name",
                    "s.kode as subject_code"
                )
                .orderBy("sc.day")
                .orderBy("sc.start_time");

            // Group by day for easier display
            const groupedSchedule = schedule.reduce((acc, item) => {
                const day = item.day;
                if (!acc[day]) {
                    acc[day] = [];
                }
                acc[day].push(item);
                return acc;
            }, {});

            // Convert to array format with day order
            const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const result = dayOrder.map(day => ({
                day,
                schedules: groupedSchedule[day] || []
            }));

            return result;
        } catch (error) {
            console.error("Error getting teacher weekly schedule:", error);
            return [];
        }
    }

    /**
     * Get teacher's schedules for today with detailed information
     */
    async getTodaySchedules(teacherUserId: string): Promise<{
        hasSchedules: boolean;
        schedules: any[];
        message: string;
    }> {
        try {
            const now = new Date();
            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentDay = dayNames[now.getDay()];

            // Get today's schedules for teacher
            const schedules = await DB.from("subject_classes as sc")
                .join("subjects as s", "sc.subject_id", "s.id")
                .join("classes as c", "sc.class_id", "c.id")
                .where("sc.teacher_id", teacherUserId)
                .where("sc.day", currentDay)
                .where("sc.is_active", true)
                .where("s.is_active", true)
                .select(
                    "sc.id as schedule_id",
                    "s.id as subject_id",
                    "s.nama as subject_name",
                    "s.kode as subject_code",
                    "s.deskripsi as subject_description",
                    "sc.day",
                    "sc.start_time",
                    "sc.end_time",
                    "c.id as class_id",
                    "c.name as class_name"
                )
                .orderBy("sc.start_time");

            if (schedules.length === 0) {
                return {
                    hasSchedules: false,
                    schedules: [],
                    message: `Anda tidak memiliki jadwal mengajar hari ini (${currentDay})`
                };
            }

            // Format schedules for display
            const formattedSchedules = schedules.map(schedule => ({
                schedule_id: schedule.schedule_id,
                subject_id: schedule.subject_id,
                subject_name: schedule.subject_name,
                subject_code: schedule.subject_code,
                subject_description: schedule.subject_description,
                day: schedule.day,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                class_id: schedule.class_id,
                class_name: schedule.class_name,
                display_text: `${schedule.subject_name} - ${schedule.start_time}-${schedule.end_time} (${schedule.class_name})`
            }));

            return {
                hasSchedules: true,
                schedules: formattedSchedules,
                message: `Ditemukan ${schedules.length} jadwal mengajar hari ini`
            };

        } catch (error) {
            console.error("Error getting today schedules:", error);
            return {
                hasSchedules: false,
                schedules: [],
                message: "Terjadi kesalahan saat mengambil jadwal hari ini"
            };
        }
    }

    /**
     * Get teachers assigned to a specific subject
     */
    async getTeachersBySubject(subjectId: string): Promise<any[]> {
        try {
            const teachers = await DB.from("teacher_subjects as ts")
                .join("teachers as t", "ts.teacher_id", "t.id")
                .where("ts.subject_id", subjectId)
                .where("ts.is_active", true)
                .where("t.is_active", true)
                .select(
                    "t.id",
                    "t.nama",
                    "t.nip",
                    "t.email",
                    "t.phone"
                )
                .orderBy("t.nama");

            return teachers;
        } catch (error) {
            console.error("Error getting teachers by subject:", error);
            return [];
        }
    }

    /**
     * Check if teacher is assigned to subject
     */
    async isTeacherAssignedToSubject(teacherId: string, subjectId: string): Promise<boolean> {
        try {
            const assignment = await DB.from("teacher_subjects")
                .where("teacher_id", teacherId)
                .where("subject_id", subjectId)
                .where("is_active", true)
                .first();

            return !!assignment;
        } catch (error) {
            console.error("Error checking teacher-subject assignment:", error);
            return false;
        }
    }
}

export default new TeacherService();