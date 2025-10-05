"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
const Authenticate_1 = __importDefault(require("./Authenticate"));
class ParentService {
    async getParents(page = 1, limit = 10, search) {
        let query = DB_1.default.from('parents').select('*');
        if (search) {
            query = query.where(function () {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`)
                    .orWhere('phone', 'like', `%${search}%`);
            });
        }
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = totalResult?.count || 0;
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
    async getParentById(id) {
        return await DB_1.default.from('parents').where('id', id).first();
    }
    async getParentByEmail(email) {
        return await DB_1.default.from('parents')
            .where('email', email)
            .where('is_active', true)
            .first();
    }
    async createParent(data) {
        const parentId = (0, crypto_1.randomUUID)();
        const userId = (0, crypto_1.randomUUID)();
        const hashedPassword = await Authenticate_1.default.hash(data.password);
        const now = (0, dayjs_1.default)().valueOf();
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
        return await DB_1.default.transaction(async (trx) => {
            const existingParent = await trx.from('parents')
                .where('email', data.email)
                .first();
            if (existingParent) {
                const { password, ...parentWithoutPassword } = existingParent;
                return parentWithoutPassword;
            }
            const existingUser = await trx.from('users')
                .where('email', data.email)
                .first();
            if (existingUser) {
                throw new Error('Email sudah digunakan oleh user lain');
            }
            await trx.from('parents').insert(parentData);
            await trx.from('users').insert(userData);
            const { password, ...parentWithoutPassword } = parentData;
            return { ...parentWithoutPassword, user_id: userId };
        });
    }
    async updateParent(id, data) {
        const updateData = {
            ...data,
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        if (data.password) {
            updateData.password = await Authenticate_1.default.hash(data.password);
        }
        await DB_1.default.from('parents').where('id', id).update(updateData);
        return await this.getParentById(id);
    }
    async deleteParent(id) {
        const parent = await this.getParentById(id);
        if (!parent) {
            throw new Error('Parent tidak ditemukan');
        }
        await DB_1.default.transaction(async (trx) => {
            await trx.from('parent_students').where('parent_id', id).delete();
            await trx.from('parents').where('id', id).delete();
            await trx.from('users')
                .where('email', parent.email)
                .where('role', 'parent')
                .delete();
        });
    }
    async getParentStudents(parentId) {
        return await DB_1.default.from('parent_students')
            .join('students', 'parent_students.student_id', 'students.id')
            .select('students.*', 'parent_students.relationship_type', 'parent_students.is_primary_contact', 'parent_students.id as relation_id')
            .where('parent_students.parent_id', parentId)
            .orderBy('parent_students.created_at', 'desc');
    }
    async searchStudentByNipd(nipd) {
        return await DB_1.default.from('students')
            .where('nipd', nipd)
            .where('is_active', true)
            .first();
    }
    async addStudentToParent(parentId, studentId, relationshipType, isPrimaryContact = false) {
        const existing = await DB_1.default.from('parent_students')
            .where('parent_id', parentId)
            .where('student_id', studentId)
            .where('relationship_type', relationshipType)
            .first();
        if (existing) {
            throw new Error(`Siswa sudah ditambahkan dengan hubungan ${relationshipType}`);
        }
        const relationData = {
            id: (0, crypto_1.randomUUID)(),
            parent_id: parentId,
            student_id: studentId,
            relationship_type: relationshipType,
            is_primary_contact: isPrimaryContact,
            created_at: (0, dayjs_1.default)().valueOf(),
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        await DB_1.default.from('parent_students').insert(relationData);
        return relationData;
    }
    async removeStudentFromParent(parentId, studentId) {
        await DB_1.default.from('parent_students')
            .where('parent_id', parentId)
            .where('student_id', studentId)
            .delete();
    }
    validateParentData(data) {
        const errors = [];
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
        }
        else if (!this.isValidEmail(data.email)) {
            errors.push({
                field: 'email',
                message: 'Format email tidak valid',
                value: data.email
            });
        }
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
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    parseCSV(csvContent) {
        const errors = [];
        const data = [];
        const allLines = csvContent.split('\n').map(line => line.trim());
        const lines = allLines.filter(line => line.length > 0);
        if (lines.length < 3) {
            errors.push({
                field: 'file',
                message: 'File CSV harus memiliki minimal 3 baris (header, nomor urut, dan data)',
                value: null
            });
            return { data, errors };
        }
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            const columns = line.split(';').map(col => col.trim());
            const meaningfulColumns = columns.filter(col => col && col !== '');
            if (meaningfulColumns.length === 0) {
                continue;
            }
            const parentData = {
                nama: (columns[0] || '').trim(),
                email: (columns[1] || '').trim(),
                password: (columns[2] || '').trim(),
                phone: (columns[3] || '').trim(),
                notes: (columns[4] || '').trim()
            };
            const hasAnyData = parentData.nama !== '' ||
                parentData.email !== '' ||
                parentData.password !== '';
            if (!hasAnyData) {
                continue;
            }
            const hasMinimumRequiredData = parentData.nama !== '' &&
                parentData.email !== '' &&
                parentData.password !== '';
            if (!hasMinimumRequiredData) {
                continue;
            }
            const rowErrors = this.validateParentData(parentData);
            if (rowErrors.length === 0) {
                data.push(parentData);
            }
        }
        return { data, errors };
    }
    async importFromCSV(csvContent) {
        const { data, errors } = this.parseCSV(csvContent);
        const duplicates = [];
        let success = 0;
        if (errors.length > 0) {
            return { success, errors, duplicates };
        }
        for (const parentData of data) {
            try {
                const existingByEmail = await this.getParentByEmail(parentData.email);
                if (existingByEmail) {
                    duplicates.push(`${parentData.email} (Email)`);
                    continue;
                }
                await this.createParent(parentData);
                success++;
            }
            catch (error) {
                errors.push({
                    field: 'email',
                    message: `Gagal menyimpan wali murid dengan email ${parentData.email}: ${error.message}`,
                    value: parentData.email
                });
            }
        }
        return { success, errors, duplicates };
    }
    async exportToCSV(filters) {
        let query = DB_1.default.from('parents');
        if (filters?.search) {
            query = query.where(function () {
                this.where('nama', 'like', `%${filters.search}%`)
                    .orWhere('email', 'like', `%${filters.search}%`)
                    .orWhere('phone', 'like', `%${filters.search}%`);
            });
        }
        const parents = await query.orderBy('nama');
        const header = 'NAMA;EMAIL;PASSWORD;TELEPON;CATATAN;;;;;;;;;;;;;;;;;;;;';
        const numberRow = '1;2;3;4;5;;;;;;;;;;;;;;;;;;;;';
        const dataRows = parents.map(parent => {
            return `${parent.nama};${parent.email};;${parent.phone || ''};${parent.notes || ''};;;;;;;;;;;;;;;;;;;;`;
        });
        return [header, numberRow, ...dataRows].join('\n');
    }
    generateCSVTemplate() {
        const header = 'NAMA;EMAIL;PASSWORD;TELEPON;CATATAN;;;;;;;;;;;;;;;;;;;;';
        const numberRow = '1;2;3;4;5;;;;;;;;;;;;;;;;;;;;';
        const exampleRow = 'Budi Santoso;budi.santoso@example.com;password123;081234567890;Orang tua siswa kelas 7A;;;;;;;;;;;;;;;;;;;;';
        return [header, numberRow, exampleRow].join('\n');
    }
}
exports.default = new ParentService();
//# sourceMappingURL=ParentService.js.map