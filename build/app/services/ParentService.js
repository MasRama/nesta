"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const crypto_1 = require("crypto");
const dayjs_1 = __importDefault(require("dayjs"));
class ParentService {
    async getParents(page = 1, limit = 10, search) {
        let query = DB_1.default.from('parents').select('*').where('is_active', true);
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
        return await DB_1.default.from('parents').where('email', email).first();
    }
    async createParent(data) {
        const id = (0, crypto_1.randomUUID)();
        const hashedPassword = this.hashPassword(data.password);
        const now = (0, dayjs_1.default)().valueOf();
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
        return await DB_1.default.transaction(async (trx) => {
            const existingParent = await trx.from('parents')
                .where('email', data.email)
                .first();
            if (existingParent) {
                const { password, ...parentWithoutPassword } = existingParent;
                return parentWithoutPassword;
            }
            await trx.from('parents').insert(parentData);
            const { password, ...parentWithoutPassword } = parentData;
            return parentWithoutPassword;
        });
    }
    async updateParent(id, data) {
        const updateData = {
            ...data,
            updated_at: (0, dayjs_1.default)().valueOf()
        };
        if (data.password) {
            updateData.password = this.hashPassword(data.password);
        }
        await DB_1.default.from('parents').where('id', id).update(updateData);
        return await this.getParentById(id);
    }
    async deleteParent(id) {
        await DB_1.default.from('parents').where('id', id).update({
            is_active: false,
            updated_at: (0, dayjs_1.default)().valueOf()
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
    hashPassword(password) {
        return (0, crypto_1.pbkdf2Sync)(password, 'salt', 1000, 64, 'sha512').toString('hex');
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.default = new ParentService();
//# sourceMappingURL=ParentService.js.map