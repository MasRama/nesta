import DB from "./DB";
import { randomUUID } from "crypto";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

interface StudentData {
    nipd: string;
    nama: string;
    kelas: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    jenis_kelamin: 'Laki - Laki' | 'Perempuan';
    agama: string;
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
    value: any;
}

class StudentService {
    /**
     * Get all students with pagination and filters
     */
    async getStudents(page: number = 1, limit: number = 10, search?: string, kelas?: string) {
        let query = DB.from('students').select('*');
        
        // Apply search filter
        if (search) {
            query = query.where(function() {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('nipd', 'like', `%${search}%`)
                    .orWhere('tempat_lahir', 'like', `%${search}%`);
            });
        }
        
        // Apply class filter
        if (kelas) {
            query = query.where('kelas', kelas);
        }
        
        // Get total count for pagination
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = (totalResult as any)?.count || 0;

        // Get paginated results
        const students = await query
            .where('is_active', true)
            .orderBy('created_at', 'desc')
            .offset((page - 1) * limit)
            .limit(limit);

        return {
            students,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        };
    }
    
    /**
     * Get student by ID
     */
    async getStudentById(id: string) {
        return await DB.from('students').where('id', id).first();
    }
    
    /**
     * Get student by NIPD
     */
    async getStudentByNIPD(nipd: string) {
        return await DB.from('students').where('nipd', nipd).first();
    }
    
    /**
     * Create new student
     */
    async createStudent(data: StudentData) {
        const extendedData = data as any; // Type assertion for additional fields

        const student = {
            id: randomUUID(),
            nipd: data.nipd || '',
            nama: data.nama || '',
            kelas: data.kelas || '',
            tempat_lahir: data.tempat_lahir || '',
            tanggal_lahir: data.tanggal_lahir ? this.parseDate(data.tanggal_lahir) : null,
            jenis_kelamin: data.jenis_kelamin || '',
            agama: data.agama || '',
            user_id: extendedData.user_id || null,
            notes: extendedData.notes || null,
            is_active: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
        };

        await DB.table('students').insert(student);
        return student;
    }
    
    /**
     * Update student
     */
    async updateStudent(id: string, data: Partial<StudentData>) {
        const updateData = {
            ...data,
            updated_at: dayjs().valueOf()
        };
        
        if (data.tanggal_lahir) {
            updateData.tanggal_lahir = this.parseDate(data.tanggal_lahir);
        }
        
        await DB.table('students').where('id', id).update(updateData);
        return await this.getStudentById(id);
    }
    
    /**
     * Delete student (soft delete)
     */
    async deleteStudent(id: string) {
        await DB.table('students').where('id', id).update({
            is_active: false,
            updated_at: dayjs().valueOf()
        });
    }
    
    /**
     * Get unique classes
     */
    async getClasses() {
        const classes = await DB.from('students')
            .distinct('kelas')
            .where('is_active', true)
            .orderBy('kelas');
        return classes.map(c => c.kelas);
    }
    
    /**
     * Parse date from various formats
     */
    private parseDate(dateString: string): string {
        // If already in YYYY-MM-DD format (from form input), return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const parsed = dayjs(dateString);
            if (parsed.isValid()) {
                return dateString;
            }
        }

        // Handle CSV format like "12 October 2011"
        const parsed = dayjs(dateString, 'DD MMMM YYYY', 'en');
        if (parsed.isValid()) {
            return parsed.format('YYYY-MM-DD');
        }

        // Try other common formats
        const formats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MM-DD-YYYY'];
        for (const format of formats) {
            const attempt = dayjs(dateString, format);
            if (attempt.isValid()) {
                return attempt.format('YYYY-MM-DD');
            }
        }

        throw new Error(`Invalid date format: ${dateString}`);
    }
    
    /**
     * Validate student data
     */
    validateStudentData(data: any, row: number = 0): ValidationError[] {
        const errors: ValidationError[] = [];

        // Only validate the 3 essential fields that must be present
        const essentialFields = [
            { field: 'nipd', label: 'NIPD' },
            { field: 'nama', label: 'Nama' },
            { field: 'kelas', label: 'Kelas' }
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

        // NIPD validation - only validate if NIPD is provided and not empty
        if (data.nipd && data.nipd.toString().trim() !== '') {
            const nipd = data.nipd.toString().trim();
            if (!/^\d+$/.test(nipd)) {
                errors.push({
                    row,
                    field: 'nipd',
                    message: 'NIPD harus berupa angka',
                    value: data.nipd
                });
            }
        }

        // Optional field validations - only validate if data is provided

        // Gender validation - only validate if gender is provided
        if (data.jenis_kelamin && data.jenis_kelamin.toString().trim() !== '') {
            const validGenders = ['Laki - Laki', 'Perempuan'];
            if (!validGenders.includes(data.jenis_kelamin.toString().trim())) {
                errors.push({
                    row,
                    field: 'jenis_kelamin',
                    message: `Jenis kelamin harus "${validGenders.join('" atau "')}"`,
                    value: data.jenis_kelamin
                });
            }
        }

        // Date validation - only validate if date is provided
        if (data.tanggal_lahir && data.tanggal_lahir.toString().trim() !== '') {
            try {
                this.parseDate(data.tanggal_lahir.toString().trim());
            } catch (error) {
                errors.push({
                    row,
                    field: 'tanggal_lahir',
                    message: 'Format tanggal tidak valid. Gunakan format "DD Month YYYY" (contoh: 12 October 2011)',
                    value: data.tanggal_lahir
                });
            }
        }

        return errors;
    }

    /**
     * Parse CSV content with semicolon delimiter
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
                row: 0,
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
            const rowNumber = i + 1; // Display row number (1-based)

            // Split by semicolon
            const columns = line.split(';').map(col => col.trim());

            // Skip lines that are just semicolons or have no meaningful data
            const meaningfulColumns = columns.filter(col => col && col !== '');
            if (meaningfulColumns.length === 0) {
                continue; // Skip completely empty rows (just semicolons)
            }

            // Extract student data from first 7 columns
            const studentData = {
                nipd: (columns[0] || '').trim(),
                nama: (columns[1] || '').trim(),
                kelas: (columns[2] || '').trim(),
                tempat_lahir: (columns[3] || '').trim(),
                tanggal_lahir: (columns[4] || '').trim(),
                jenis_kelamin: (columns[5] || '').trim(),
                agama: (columns[6] || '').trim()
            };

            // Skip rows where ALL essential fields are empty (ignore incomplete data)
            const hasAnyData = studentData.nipd !== '' ||
                              studentData.nama !== '' ||
                              studentData.kelas !== '' ||
                              studentData.tempat_lahir !== '' ||
                              studentData.tanggal_lahir !== '' ||
                              studentData.jenis_kelamin !== '' ||
                              studentData.agama !== '';

            if (!hasAnyData) {
                continue; // Skip rows with no data at all
            }

            // Only process rows that have at least NIPD, NAMA, and KELAS
            const hasMinimumRequiredData = studentData.nipd !== '' &&
                                         studentData.nama !== '' &&
                                         studentData.kelas !== '';

            if (!hasMinimumRequiredData) {
                continue; // Skip incomplete rows silently (no error)
            }

            // Try to validate the row, but ignore errors - just add what's valid
            try {
                const rowErrors = this.validateStudentData(studentData, rowNumber);

                // Only add data if it passes ALL validations (no errors)
                if (rowErrors.length === 0) {
                    data.push(studentData);
                }
                // If there are errors, just skip this row silently (don't add to errors array)
            } catch (error) {
                // If validation throws an error, just skip this row silently
                continue;
            }
        }

        return { data, errors };
    }

    /**
     * Import students from CSV
     */
    async importFromCSV(csvContent: string): Promise<{ success: number, errors: ValidationError[], duplicates: string[] }> {
        const { data, errors } = this.parseCSV(csvContent);
        const duplicates: string[] = [];
        let success = 0;

        // If there are parsing errors, return early
        if (errors.length > 0) {
            return { success, errors, duplicates };
        }

        // Process each student
        for (const studentData of data) {
            try {
                // Check for duplicates
                const existing = await this.getStudentByNIPD(studentData.nipd);
                if (existing) {
                    duplicates.push(studentData.nipd);
                    continue;
                }

                // Create student
                await this.createStudent(studentData);
                success++;
            } catch (error) {
                errors.push({
                    row: 0,
                    field: 'nipd',
                    message: `Gagal menyimpan siswa dengan NIPD ${studentData.nipd}: ${error.message}`,
                    value: studentData.nipd
                });
            }
        }

        return { success, errors, duplicates };
    }

    /**
     * Export students to CSV format
     */
    async exportToCSV(filters?: { search?: string, kelas?: string }): Promise<string> {
        let query = DB.from('students').where('is_active', true);

        // Apply filters
        if (filters?.search) {
            query = query.where(function() {
                this.where('nama', 'like', `%${filters.search}%`)
                    .orWhere('nipd', 'like', `%${filters.search}%`)
                    .orWhere('tempat_lahir', 'like', `%${filters.search}%`);
            });
        }

        if (filters?.kelas) {
            query = query.where('kelas', filters.kelas);
        }

        const students = await query.orderBy('kelas').orderBy('nama');

        // Create CSV content
        const header = 'NIPD;NAMA;KELAS;TEMPAT LAHIR;TGL LAHIR;Jenis Kelamin;Agama;;;;;;;;;;;;;;;;;;;;';
        const numberRow = '1;2;3;4;5;6;7;;;;;;;;;;;;;;;;;;;;';

        const dataRows = students.map(student => {
            const formattedDate = dayjs(student.tanggal_lahir).locale('en').format('DD MMMM YYYY');
            return `${student.nipd};${student.nama};${student.kelas};${student.tempat_lahir};${formattedDate};${student.jenis_kelamin};${student.agama};;;;;;;;;;;;;;;;;;;;`;
        });

        return [header, numberRow, ...dataRows].join('\n');
    }

    /**
     * Generate CSV template
     */
    generateCSVTemplate(): string {
        const header = 'NIPD;NAMA;KELAS;TEMPAT LAHIR;TGL LAHIR;Jenis Kelamin;Agama;;;;;;;;;;;;;;;;;;;;';
        const numberRow = '1;2;3;4;5;6;7;;;;;;;;;;;;;;;;;;;;';
        const exampleRow = '9352;ADI PUTRO WIDODO;7A;Malang;12 October 2011;Laki - Laki;Islam;;;;;;;;;;;;;;;;;;;;';

        return [header, numberRow, exampleRow].join('\n');
    }
}

export default new StudentService();
