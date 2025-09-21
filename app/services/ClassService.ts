import { randomUUID } from "crypto";
import dayjs from "dayjs";
import DB from "./DB";

interface ClassData {
    name: string;
    grade_level?: string;
    academic_year?: string;
    description?: string;
    max_students?: number;
}

interface ClassWithStats {
    id: string;
    name: string;
    grade_level: string;
    academic_year: string;
    description?: string;
    max_students: number;
    teacher_id?: string;
    teacher_name?: string;
    teacher_nip?: string;
    student_count: number;
    subject_count: number;
    created_at: number;
    updated_at: number;
}

interface SubjectAssignment {
    id: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
    teacher_id: string;
    teacher_name: string;
    day: string;
    start_time: string;
    end_time: string;
    notes?: string;
    is_active: boolean;
}

class ClassService {
    /**
     * Get unique classes from students table and ensure they exist in classes table
     */
    async getUniqueClasses(): Promise<ClassWithStats[]> {
        try {
            // Get unique class names from students table
            const uniqueClassNames = await DB.from('students')
                .distinct('kelas')
                .whereNotNull('kelas')
                .where('is_active', true)
                .orderBy('kelas');

            const classes: ClassWithStats[] = [];

            for (const row of uniqueClassNames) {
                const className = row.kelas;
                
                // Ensure class exists in classes table
                let classRecord = await this.ensureClassExists(className);
                
                // Get teacher info if assigned
                let teacherInfo = null;
                if (classRecord.teacher_id) {
                    teacherInfo = await DB.from('teachers')
                        .where('user_id', classRecord.teacher_id)
                        .where('is_active', true)
                        .first();
                }

                // Get student count for this class
                const studentCount = await DB.from('students')
                    .where('kelas', className)
                    .where('is_active', true)
                    .count('id as count')
                    .first();

                // Get subject count for this class
                const subjectCount = await DB.from('subject_classes')
                    .where('class_id', classRecord.id)
                    .where('is_active', true)
                    .count('id as count')
                    .first();

                classes.push({
                    id: classRecord.id,
                    name: classRecord.name,
                    grade_level: classRecord.grade_level,
                    academic_year: classRecord.academic_year,
                    description: classRecord.description,
                    max_students: classRecord.max_students,
                    teacher_id: classRecord.teacher_id,
                    teacher_name: teacherInfo?.nama || null,
                    teacher_nip: teacherInfo?.nip || null,
                    student_count: parseInt(studentCount?.count as string) || 0,
                    subject_count: parseInt(subjectCount?.count as string) || 0,
                    created_at: classRecord.created_at,
                    updated_at: classRecord.updated_at
                });
            }

            return classes;
        } catch (error) {
            console.error('Error getting unique classes:', error);
            throw new Error('Gagal mengambil data kelas');
        }
    }

    /**
     * Ensure class exists in classes table, create if not exists
     */
    async ensureClassExists(className: string) {
        try {
            // Check if class already exists
            let classRecord = await DB.from('classes')
                .where('name', className)
                .first();

            if (!classRecord) {
                // Create new class record
                const now = dayjs().valueOf();
                const gradeLevel = this.extractGradeLevel(className);
                const academicYear = this.getCurrentAcademicYear();

                classRecord = {
                    id: randomUUID(),
                    name: className,
                    grade_level: gradeLevel,
                    academic_year: academicYear,
                    description: `Kelas ${className}`,
                    max_students: 30,
                    teacher_id: null,
                    created_at: now,
                    updated_at: now
                };

                await DB.table('classes').insert(classRecord);
            }

            return classRecord;
        } catch (error) {
            console.error('Error ensuring class exists:', error);
            throw new Error('Gagal memastikan data kelas');
        }
    }

    /**
     * Extract grade level from class name (e.g., "7A" -> "7")
     */
    private extractGradeLevel(className: string): string {
        const match = className.match(/^(\d+)/);
        return match ? match[1] : '7';
    }

    /**
     * Get current academic year
     */
    private getCurrentAcademicYear(): string {
        const now = dayjs();
        const year = now.year();
        const month = now.month() + 1; // dayjs months are 0-indexed
        
        // Academic year starts in July
        if (month >= 7) {
            return `${year}/${year + 1}`;
        } else {
            return `${year - 1}/${year}`;
        }
    }

    /**
     * Assign teacher as homeroom teacher to class
     */
    async assignTeacherToClass(className: string, teacherId: string): Promise<void> {
        try {
            // Get teacher's user_id
            const teacher = await DB.from('teachers')
                .where('id', teacherId)
                .where('is_active', true)
                .first();

            if (!teacher) {
                throw new Error('Guru tidak ditemukan atau tidak aktif');
            }

            // Ensure class exists
            const classRecord = await this.ensureClassExists(className);

            // Check if teacher is already assigned to another class
            const existingAssignment = await DB.from('classes')
                .where('teacher_id', teacher.user_id)
                .whereNot('id', classRecord.id)
                .first();

            if (existingAssignment) {
                throw new Error(`Guru sudah menjadi wali kelas ${existingAssignment.name}`);
            }

            // Update class with teacher assignment
            await DB.from('classes')
                .where('id', classRecord.id)
                .update({
                    teacher_id: teacher.user_id,
                    updated_at: dayjs().valueOf()
                });

        } catch (error) {
            console.error('Error assigning teacher to class:', error);
            throw error;
        }
    }

    /**
     * Unassign teacher from class
     */
    async unassignTeacherFromClass(className: string): Promise<void> {
        try {
            const classRecord = await this.ensureClassExists(className);

            await DB.from('classes')
                .where('id', classRecord.id)
                .update({
                    teacher_id: null,
                    updated_at: dayjs().valueOf()
                });

        } catch (error) {
            console.error('Error unassigning teacher from class:', error);
            throw new Error('Gagal membatalkan penugasan wali kelas');
        }
    }

    /**
     * Get subjects assigned to a class
     */
    async getClassSubjects(className: string): Promise<SubjectAssignment[]> {
        try {
            const classRecord = await this.ensureClassExists(className);

            const assignments = await DB.from('subject_classes as sc')
                .leftJoin('subjects as s', 'sc.subject_id', 's.id')
                .leftJoin('teachers as t', 'sc.teacher_id', 't.id')
                .where('sc.class_id', classRecord.id)
                .where('sc.is_active', true)
                .select(
                    'sc.id',
                    'sc.subject_id',
                    's.nama as subject_name',
                    's.kode as subject_code',
                    'sc.teacher_id',
                    't.nama as teacher_name',
                    'sc.day',
                    'sc.start_time',
                    'sc.end_time',
                    'sc.notes',
                    'sc.is_active'
                );

            return assignments;
        } catch (error) {
            console.error('Error getting class subjects:', error);
            throw new Error('Gagal mengambil mata pelajaran kelas');
        }
    }

    /**
     * Assign subject to class with schedule
     */
    async assignSubjectToClass(className: string, subjectId: string, teacherId: string, day: string, startTime: string, endTime: string, notes?: string): Promise<void> {
        try {
            const classRecord = await this.ensureClassExists(className);

            // Check if subject exists
            const subject = await DB.from('subjects')
                .where('id', subjectId)
                .where('is_active', true)
                .first();

            if (!subject) {
                throw new Error('Mata pelajaran tidak ditemukan');
            }

            // Check if assignment already exists
            const existingAssignment = await DB.from('subject_classes')
                .where('subject_id', subjectId)
                .where('class_id', classRecord.id)
                .first();

            if (existingAssignment) {
                throw new Error('Mata pelajaran sudah ditugaskan ke kelas ini');
            }

            // Validate teacher (now required)
            if (!teacherId) {
                throw new Error('Guru wajib dipilih');
            }

            const teacher = await DB.from('teachers')
                .where('id', teacherId)
                .where('is_active', true)
                .first();

            if (!teacher) {
                throw new Error('Guru tidak ditemukan');
            }

            // Validate that teacher is assigned to this subject
            const teacherSubjectAssignment = await DB.from('teacher_subjects')
                .where('teacher_id', teacherId)
                .where('subject_id', subjectId)
                .where('is_active', true)
                .first();

            if (!teacherSubjectAssignment) {
                throw new Error('Guru belum di-assign ke mata pelajaran ini. Silakan assign guru ke mata pelajaran terlebih dahulu di menu Mata Pelajaran.');
            }

            // Validate schedule inputs
            if (!day || !startTime || !endTime) {
                throw new Error('Hari, waktu mulai, dan waktu selesai wajib diisi');
            }

            // Validate time format and logic
            if (startTime >= endTime) {
                throw new Error('Waktu mulai harus lebih awal dari waktu selesai');
            }

            // Check for schedule conflicts in the same class
            const conflictingSchedule = await DB.from('subject_classes')
                .where('class_id', classRecord.id)
                .where('day', day)
                .where('is_active', true)
                .where(function() {
                    this.where(function() {
                        // New schedule starts during existing schedule
                        this.where('start_time', '<=', startTime)
                            .where('end_time', '>', startTime);
                    }).orWhere(function() {
                        // New schedule ends during existing schedule
                        this.where('start_time', '<', endTime)
                            .where('end_time', '>=', endTime);
                    }).orWhere(function() {
                        // New schedule completely contains existing schedule
                        this.where('start_time', '>=', startTime)
                            .where('end_time', '<=', endTime);
                    });
                })
                .first();

            if (conflictingSchedule) {
                throw new Error(`Jadwal bentrok dengan mata pelajaran lain pada hari ${day} jam ${conflictingSchedule.start_time}-${conflictingSchedule.end_time}`);
            }

            // Create assignment
            const assignmentData = {
                id: randomUUID(),
                subject_id: subjectId,
                class_id: classRecord.id,
                teacher_id: teacherId, // Use teacherId directly since foreign key now references teachers.id
                day: day,
                start_time: startTime,
                end_time: endTime,
                notes: notes || null,
                is_active: true,
                created_at: dayjs().valueOf(),
                updated_at: dayjs().valueOf()
            };

            await DB.table('subject_classes').insert(assignmentData);

        } catch (error) {
            console.error('Error assigning subject to class:', error);
            throw error;
        }
    }

    /**
     * Unassign subject from class
     */
    async unassignSubjectFromClass(className: string, subjectId: string): Promise<void> {
        try {
            const classRecord = await this.ensureClassExists(className);

            await DB.from('subject_classes')
                .where('subject_id', subjectId)
                .where('class_id', classRecord.id)
                .delete();

        } catch (error) {
            console.error('Error unassigning subject from class:', error);
            throw new Error('Gagal membatalkan penugasan mata pelajaran');
        }
    }

    /**
     * Get available teachers for assignment
     */
    async getAvailableTeachers() {
        try {
            return await DB.from('teachers')
                .where('is_active', true)
                .select('id', 'nip', 'nama', 'email', 'phone', 'user_id')
                .orderBy('nama');
        } catch (error) {
            console.error('Error getting available teachers:', error);
            throw new Error('Gagal mengambil data guru');
        }
    }

    /**
     * Get available subjects for assignment
     */
    async getAvailableSubjects() {
        try {
            return await DB.from('subjects')
                .where('is_active', true)
                .select('id', 'kode', 'nama', 'deskripsi')
                .orderBy('nama');
        } catch (error) {
            console.error('Error getting available subjects:', error);
            throw new Error('Gagal mengambil data mata pelajaran');
        }
    }
}

export default new ClassService();
