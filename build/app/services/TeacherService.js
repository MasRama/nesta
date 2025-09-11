"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const crypto_1 = require("crypto");
class TeacherService {
    async getTeachers(page = 1, limit = 10, search) {
        let query = DB_1.default.from('teachers').select('*').where('is_active', true);
        if (search) {
            query = query.where(function () {
                this.where('nama', 'like', `%${search}%`)
                    .orWhere('nip', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`);
            });
        }
        const countQuery = query.clone();
        const totalResult = await countQuery.count('* as count').first();
        const totalCount = totalResult?.count || 0;
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
    async getTeacherById(id) {
        return await DB_1.default.from('teachers').where('id', id).where('is_active', true).first();
    }
    async getTeacherByNIP(nip) {
        return await DB_1.default.from('teachers').where('nip', nip).first();
    }
    async getTeacherByEmail(email) {
        return await DB_1.default.from('teachers').where('email', email).first();
    }
    async createTeacher(data) {
        const hashedPassword = this.hashPassword(data.password);
        const teacherData = {
            id: (0, crypto_1.randomUUID)(),
            nip: data.nip,
            nama: data.nama,
            email: data.email,
            password: hashedPassword,
            phone: data.phone || null,
            is_active: true,
            created_at: Date.now(),
            updated_at: Date.now()
        };
        await DB_1.default.from('teachers').insert(teacherData);
        const { password, ...teacherWithoutPassword } = teacherData;
        return teacherWithoutPassword;
    }
    async updateTeacher(id, data) {
        const updateData = {
            ...data,
            updated_at: Date.now()
        };
        if (data.password) {
            updateData.password = this.hashPassword(data.password);
        }
        await DB_1.default.from('teachers').where('id', id).update(updateData);
        const updatedTeacher = await this.getTeacherById(id);
        if (updatedTeacher) {
            const { password, ...teacherWithoutPassword } = updatedTeacher;
            return teacherWithoutPassword;
        }
        return null;
    }
    async deleteTeacher(id) {
        await DB_1.default.from('teachers').where('id', id).update({
            is_active: false,
            updated_at: Date.now()
        });
    }
    hashPassword(password) {
        const salt = 'netsa_teacher_salt';
        return (0, crypto_1.pbkdf2Sync)(password, salt, 10000, 64, 'sha512').toString('hex');
    }
    validateTeacherData(data, row = 0) {
        const errors = [];
        const essentialFields = [
            { field: 'nip', label: 'NIP' },
            { field: 'nama', label: 'Nama' },
            { field: 'email', label: 'Email' }
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
exports.default = new TeacherService();
//# sourceMappingURL=TeacherService.js.map