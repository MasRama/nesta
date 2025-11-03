"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./DB"));
const uuid_1 = require("uuid");
class LeaderboardService {
    async getAllLeaderboard() {
        const leaderboard = await DB_1.default.from("leaderboard")
            .orderBy("points", "desc")
            .orderBy("created_at", "asc");
        return leaderboard;
    }
    async getActiveLeaderboard() {
        const leaderboard = await DB_1.default.from("leaderboard")
            .where("is_active", true)
            .orderBy("points", "desc")
            .orderBy("created_at", "asc");
        return leaderboard;
    }
    async getLeaderboardById(id) {
        const entry = await DB_1.default.from("leaderboard")
            .where("id", id)
            .first();
        if (!entry) {
            throw new Error("Data leaderboard tidak ditemukan");
        }
        return entry;
    }
    async createLeaderboard(data) {
        if (!data.class_name) {
            throw new Error("Nama kelas wajib diisi");
        }
        if (data.points === undefined || data.points === null) {
            throw new Error("Poin wajib diisi");
        }
        const id = (0, uuid_1.v4)();
        const now = Date.now();
        return await DB_1.default.transaction(async (trx) => {
            const existing = await trx.from("leaderboard")
                .where("class_name", data.class_name)
                .first();
            if (existing) {
                throw new Error(`Kelas "${data.class_name}" sudah ada di leaderboard`);
            }
            await trx.table("leaderboard").insert({
                id,
                class_name: data.class_name,
                points: data.points,
                description: data.description || null,
                is_active: data.is_active !== undefined ? data.is_active : true,
                created_at: now,
                updated_at: now
            });
            return id;
        });
    }
    async updateLeaderboard(id, data) {
        await this.getLeaderboardById(id);
        const updateData = {
            updated_at: Date.now()
        };
        if (data.class_name !== undefined) {
            updateData.class_name = data.class_name;
        }
        if (data.points !== undefined) {
            updateData.points = data.points;
        }
        if (data.description !== undefined) {
            updateData.description = data.description;
        }
        if (data.is_active !== undefined) {
            updateData.is_active = data.is_active;
        }
        await DB_1.default.table("leaderboard")
            .where("id", id)
            .update(updateData);
        return true;
    }
    async deleteLeaderboard(id) {
        await this.getLeaderboardById(id);
        await DB_1.default.table("leaderboard")
            .where("id", id)
            .delete();
        return true;
    }
    async getUniqueClasses() {
        const classes = await DB_1.default.from("students")
            .distinct("kelas")
            .whereNotNull("kelas")
            .orderBy("kelas", "asc");
        return classes.map(c => c.kelas);
    }
    async bulkDelete(ids) {
        if (!ids || ids.length === 0) {
            throw new Error("Tidak ada data yang dipilih untuk dihapus");
        }
        await DB_1.default.table("leaderboard")
            .whereIn("id", ids)
            .delete();
        return ids.length;
    }
}
exports.default = new LeaderboardService();
//# sourceMappingURL=LeaderboardService.js.map