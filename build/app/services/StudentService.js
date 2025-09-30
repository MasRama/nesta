"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
const ClassService_1 = __importDefault(require("./ClassService"));
dayjs_1.default.extend(customParseFormat_1.default);
class StudentService {
    async getStudents(page = 1, limit = 10, search, kelas, gender) {
        let query = DB_1.default.from('students').select('*');
        if (search) {
            query = query.where(function () {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('nipd', 'like', `%${search}%`)
                    .orWhere('tempat_lahir', 'like', `%${search}%`);
            });
        }
        if (kelas) {
            query = query.where('kelas', kelas);
        }
        if (gender) {
            query = query.where('jenis_kelamin', gender);
        }
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = totalResult?.count || 0;
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
    async getStudentById(id) {
        return await DB_1.default.from('students').where('id', id).first();
    }
    async getStudentByNIPD(nipd) {
        return await DB_1.default.from('students').where('nipd', nipd).first();
    }
    async createStudent(data) {
        const extendedData = data;
        const student = {
            id: (0, crypto_1.randomUUID)(),
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
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        await DB_1.default.table('students').insert(student);
        return student;
    }
    async updateStudent(id, data) {
        const updateData = {
            ...data,
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        if (data.tanggal_lahir) {
            updateData.tanggal_lahir = this.parseDate(data.tanggal_lahir);
        }
        await DB_1.default.table('students').where('id', id).update(updateData);
        return await this.getStudentById(id);
    }
    async deleteStudent(id) {
        await DB_1.default.table('students').where('id', id).update({
            is_active: false,
            updated_at: (0, dayjs_1.default)().valueOf()
        });
    }
    async bulkDeleteStudents(ids) {
        if (!ids || ids.length === 0) {
            return 0;
        }
        await DB_1.default.table('students').whereIn('id', ids).update({
            is_active: false,
            updated_at: (0, dayjs_1.default)().valueOf()
        });
        return ids.length;
    }
    async getClasses() {
        const classes = await DB_1.default.from('students')
            .distinct('kelas')
            .where('is_active', true)
            .orderBy('kelas');
        return classes.map(c => c.kelas);
    }
    parseDate(dateString) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const parsed = (0, dayjs_1.default)(dateString);
            if (parsed.isValid()) {
                return dateString;
            }
        }
        const parsed = (0, dayjs_1.default)(dateString, 'DD MMMM YYYY', 'en');
        if (parsed.isValid()) {
            return parsed.format('YYYY-MM-DD');
        }
        const formats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MM-DD-YYYY'];
        for (const format of formats) {
            const attempt = (0, dayjs_1.default)(dateString, format);
            if (attempt.isValid()) {
                return attempt.format('YYYY-MM-DD');
            }
        }
        throw new Error(`Invalid date format: ${dateString}`);
    }
    validateStudentData(data, row = 0) {
        const errors = [];
        const essentialFields = [
            { field: 'nipd', label: 'NIPD' },
            { field: 'nama', label: 'Nama' },
            { field: 'kelas', label: 'Kelas' }
        ];
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
        if (data.tanggal_lahir && data.tanggal_lahir.toString().trim() !== '') {
            try {
                this.parseDate(data.tanggal_lahir.toString().trim());
            }
            catch (error) {
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
    parseCSV(csvContent) {
        const errors = [];
        const data = [];
        const allLines = csvContent.split('\n').map(line => line.trim());
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
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            const rowNumber = i + 1;
            const columns = line.split(';').map(col => col.trim());
            const meaningfulColumns = columns.filter(col => col && col !== '');
            if (meaningfulColumns.length === 0) {
                continue;
            }
            const studentData = {
                nipd: (columns[0] || '').trim(),
                nama: (columns[1] || '').trim(),
                kelas: (columns[2] || '').trim(),
                tempat_lahir: (columns[3] || '').trim(),
                tanggal_lahir: (columns[4] || '').trim(),
                jenis_kelamin: (columns[5] || '').trim(),
                agama: (columns[6] || '').trim()
            };
            const hasAnyData = studentData.nipd !== '' ||
                studentData.nama !== '' ||
                studentData.kelas !== '' ||
                studentData.tempat_lahir !== '' ||
                studentData.tanggal_lahir !== '' ||
                studentData.jenis_kelamin !== '' ||
                studentData.agama !== '';
            if (!hasAnyData) {
                continue;
            }
            const hasMinimumRequiredData = studentData.nipd !== '' &&
                studentData.nama !== '' &&
                studentData.kelas !== '';
            if (!hasMinimumRequiredData) {
                continue;
            }
            try {
                const rowErrors = this.validateStudentData(studentData, rowNumber);
                if (rowErrors.length === 0) {
                    data.push(studentData);
                }
            }
            catch (error) {
                continue;
            }
        }
        return { data, errors };
    }
    async importFromCSV(csvContent) {
        const { data, errors } = this.parseCSV(csvContent);
        const duplicates = [];
        const classesCreated = [];
        let success = 0;
        if (errors.length > 0) {
            return { success, errors, duplicates, classesCreated };
        }
        const uniqueClasses = [...new Set(data.map(student => student.kelas))];
        for (const className of uniqueClasses) {
            try {
                const existingClass = await DB_1.default.from('classes').where('name', className).first();
                if (!existingClass) {
                    await ClassService_1.default.ensureClassExists(className);
                    classesCreated.push(className);
                    console.log(`✅ Auto-created class: ${className}`);
                }
            }
            catch (error) {
                console.error(`Error ensuring class exists: ${className}`, error);
                errors.push({
                    row: 0,
                    field: 'kelas',
                    message: `Gagal membuat kelas ${className}: ${error.message}`,
                    value: className
                });
            }
        }
        for (const studentData of data) {
            try {
                const existing = await this.getStudentByNIPD(studentData.nipd);
                if (existing) {
                    duplicates.push(studentData.nipd);
                    continue;
                }
                await this.createStudent(studentData);
                success++;
            }
            catch (error) {
                errors.push({
                    row: 0,
                    field: 'nipd',
                    message: `Gagal menyimpan siswa dengan NIPD ${studentData.nipd}: ${error.message}`,
                    value: studentData.nipd
                });
            }
        }
        return { success, errors, duplicates, classesCreated };
    }
    async exportToCSV(filters) {
        let query = DB_1.default.from('students').where('is_active', true);
        if (filters?.search) {
            query = query.where(function () {
                this.where('nama', 'like', `%${filters.search}%`)
                    .orWhere('nipd', 'like', `%${filters.search}%`)
                    .orWhere('tempat_lahir', 'like', `%${filters.search}%`);
            });
        }
        if (filters?.kelas) {
            query = query.where('kelas', filters.kelas);
        }
        if (filters?.gender) {
            query = query.where('jenis_kelamin', filters.gender);
        }
        const students = await query.orderBy('kelas').orderBy('nama');
        const header = 'NIPD;NAMA;KELAS;TEMPAT LAHIR;TGL LAHIR;Jenis Kelamin;Agama;;;;;;;;;;;;;;;;;;;;';
        const numberRow = '1;2;3;4;5;6;7;;;;;;;;;;;;;;;;;;;;';
        const dataRows = students.map(student => {
            const formattedDate = (0, dayjs_1.default)(student.tanggal_lahir).locale('en').format('DD MMMM YYYY');
            return `${student.nipd};${student.nama};${student.kelas};${student.tempat_lahir};${formattedDate};${student.jenis_kelamin};${student.agama};;;;;;;;;;;;;;;;;;;;`;
        });
        return [header, numberRow, ...dataRows].join('\n');
    }
    generateCSVTemplate() {
        const header = 'NIPD;NAMA;KELAS;TEMPAT LAHIR;TGL LAHIR;Jenis Kelamin;Agama;;;;;;;;;;;;;;;;;;;;';
        const numberRow = '1;2;3;4;5;6;7;;;;;;;;;;;;;;;;;;;;';
        const exampleRow = '9352;ADI PUTRO WIDODO;7A;Malang;12 October 2011;Laki - Laki;Islam;;;;;;;;;;;;;;;;;;;;';
        return [header, numberRow, exampleRow].join('\n');
    }
}
exports.default = new StudentService();
//# sourceMappingURL=StudentService.js.map