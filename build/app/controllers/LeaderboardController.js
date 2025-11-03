"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LeaderboardService_1 = __importDefault(require("../services/LeaderboardService"));
class LeaderboardController {
    async index(request, response) {
        try {
            const leaderboard = await LeaderboardService_1.default.getAllLeaderboard();
            const classes = await LeaderboardService_1.default.getUniqueClasses();
            return response.inertia("admin/leaderboard/index", {
                leaderboard,
                classes
            });
        }
        catch (error) {
            console.error('Error fetching leaderboard:', error);
            return response.status(500).json({ error: 'Gagal mengambil data leaderboard' });
        }
    }
    async create(request, response) {
        try {
            const classes = await LeaderboardService_1.default.getUniqueClasses();
            return response.inertia("admin/leaderboard/create", {
                classes
            });
        }
        catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form' });
        }
    }
    async store(request, response) {
        let data;
        try {
            data = await request.json();
            await LeaderboardService_1.default.createLeaderboard({
                class_name: data.class_name,
                points: parseInt(data.points),
                description: data.description,
                is_active: data.is_active !== undefined ? data.is_active : true
            });
            return response.redirect("/admin/leaderboard");
        }
        catch (error) {
            console.error('Error creating leaderboard entry:', error);
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint failed')) {
                return response.status(400).json({
                    success: false,
                    error: `Kelas "${data?.class_name}" sudah ada di leaderboard`
                });
            }
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal membuat entry leaderboard'
            });
        }
    }
    async edit(request, response) {
        try {
            const { id } = request.params;
            if (!id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID wajib diisi'
                });
            }
            const entry = await LeaderboardService_1.default.getLeaderboardById(id);
            const classes = await LeaderboardService_1.default.getUniqueClasses();
            return response.inertia("admin/leaderboard/edit", {
                entry,
                classes
            });
        }
        catch (error) {
            console.error('Error loading edit form:', error);
            return response.status(404).json({
                success: false,
                error: error.message || 'Data tidak ditemukan'
            });
        }
    }
    async update(request, response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            if (!id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID wajib diisi'
                });
            }
            await LeaderboardService_1.default.updateLeaderboard(id, {
                class_name: data.class_name,
                points: data.points !== undefined ? parseInt(data.points) : undefined,
                description: data.description,
                is_active: data.is_active
            });
            return response.redirect("/admin/leaderboard");
        }
        catch (error) {
            console.error('Error updating leaderboard entry:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal mengupdate entry leaderboard'
            });
        }
    }
    async destroy(request, response) {
        try {
            const { id } = request.params;
            if (!id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID wajib diisi'
                });
            }
            await LeaderboardService_1.default.deleteLeaderboard(id);
            return response.status(200).json({
                success: true,
                message: 'Entry leaderboard berhasil dihapus'
            });
        }
        catch (error) {
            console.error('Error deleting leaderboard entry:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal menghapus entry leaderboard'
            });
        }
    }
    async bulkDelete(request, response) {
        try {
            const data = await request.json();
            if (!data.ids || !Array.isArray(data.ids) || data.ids.length === 0) {
                return response.status(400).json({
                    success: false,
                    error: 'Tidak ada data yang dipilih untuk dihapus'
                });
            }
            const deletedCount = await LeaderboardService_1.default.bulkDelete(data.ids);
            return response.json({
                success: true,
                message: `${deletedCount} entry berhasil dihapus`
            });
        }
        catch (error) {
            console.error('Error bulk deleting leaderboard entries:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal menghapus entry leaderboard'
            });
        }
    }
    async publicLeaderboard(request, response) {
        try {
            const leaderboard = await LeaderboardService_1.default.getActiveLeaderboard();
            return response.inertia("leaderboard", {
                leaderboard
            });
        }
        catch (error) {
            console.error('Error fetching public leaderboard:', error);
            return response.status(500).json({ error: 'Gagal mengambil data leaderboard' });
        }
    }
    async getLeaderboardAPI(request, response) {
        try {
            const leaderboard = await LeaderboardService_1.default.getActiveLeaderboard();
            return response.json({
                success: true,
                data: leaderboard
            });
        }
        catch (error) {
            console.error('Error fetching leaderboard API:', error);
            return response.status(500).json({
                success: false,
                error: 'Gagal mengambil data leaderboard'
            });
        }
    }
}
exports.default = new LeaderboardController();
//# sourceMappingURL=LeaderboardController.js.map