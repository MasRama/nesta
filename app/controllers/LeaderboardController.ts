import { Request, Response } from "../../type";
import LeaderboardService from "../services/LeaderboardService";

class LeaderboardController {
    /**
     * Admin: Show leaderboard management page
     */
    public async index(request: Request, response: Response) {
        try {
            const leaderboard = await LeaderboardService.getAllLeaderboard();
            const classes = await LeaderboardService.getUniqueClasses();
            
            return response.inertia("admin/leaderboard/index", {
                leaderboard,
                classes
            });
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return response.status(500).json({ error: 'Gagal mengambil data leaderboard' });
        }
    }

    /**
     * Admin: Show create leaderboard form
     */
    public async create(request: Request, response: Response) {
        try {
            const classes = await LeaderboardService.getUniqueClasses();
            
            return response.inertia("admin/leaderboard/create", {
                classes
            });
        } catch (error) {
            console.error('Error loading create form:', error);
            return response.status(500).json({ error: 'Gagal memuat form' });
        }
    }

    /**
     * Admin: Store new leaderboard entry
     */
    public async store(request: Request, response: Response) {
        let data: any;
        
        try {
            data = await request.json();
            
            await LeaderboardService.createLeaderboard({
                class_name: data.class_name,
                points: parseInt(data.points),
                description: data.description,
                is_active: data.is_active !== undefined ? data.is_active : true
            });
            
            return response.redirect("/admin/leaderboard");
        } catch (error: any) {
            console.error('Error creating leaderboard entry:', error);
            
            // Handle UNIQUE constraint violation (duplicate class_name)
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

    /**
     * Admin: Show edit leaderboard form
     */
    public async edit(request: Request, response: Response) {
        try {
            const { id } = request.params;
            
            if (!id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID wajib diisi'
                });
            }

            const entry = await LeaderboardService.getLeaderboardById(id);
            const classes = await LeaderboardService.getUniqueClasses();
            
            return response.inertia("admin/leaderboard/edit", {
                entry,
                classes
            });
        } catch (error: any) {
            console.error('Error loading edit form:', error);
            return response.status(404).json({
                success: false,
                error: error.message || 'Data tidak ditemukan'
            });
        }
    }

    /**
     * Admin: Update leaderboard entry
     */
    public async update(request: Request, response: Response) {
        try {
            const { id } = request.params;
            const data = await request.json();
            
            if (!id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID wajib diisi'
                });
            }

            await LeaderboardService.updateLeaderboard(id, {
                class_name: data.class_name,
                points: data.points !== undefined ? parseInt(data.points) : undefined,
                description: data.description,
                is_active: data.is_active
            });
            
            return response.redirect("/admin/leaderboard");
        } catch (error: any) {
            console.error('Error updating leaderboard entry:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal mengupdate entry leaderboard'
            });
        }
    }

    /**
     * Admin: Delete leaderboard entry
     * Returns JSON response for AJAX call compatibility
     */
    public async destroy(request: Request, response: Response) {
        try {
            const { id } = request.params;
            
            if (!id) {
                return response.status(400).json({
                    success: false,
                    error: 'ID wajib diisi'
                });
            }

            await LeaderboardService.deleteLeaderboard(id);
            
            // Return JSON response instead of redirect for AJAX compatibility
            return response.status(200).json({
                success: true,
                message: 'Entry leaderboard berhasil dihapus'
            });
        } catch (error: any) {
            console.error('Error deleting leaderboard entry:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal menghapus entry leaderboard'
            });
        }
    }

    /**
     * Admin: Bulk delete leaderboard entries
     */
    public async bulkDelete(request: Request, response: Response) {
        try {
            const data = await request.json();
            
            if (!data.ids || !Array.isArray(data.ids) || data.ids.length === 0) {
                return response.status(400).json({
                    success: false,
                    error: 'Tidak ada data yang dipilih untuk dihapus'
                });
            }

            const deletedCount = await LeaderboardService.bulkDelete(data.ids);
            
            return response.json({
                success: true,
                message: `${deletedCount} entry berhasil dihapus`
            });
        } catch (error: any) {
            console.error('Error bulk deleting leaderboard entries:', error);
            return response.status(400).json({
                success: false,
                error: error.message || 'Gagal menghapus entry leaderboard'
            });
        }
    }

    /**
     * Public: Show leaderboard for users
     */
    public async publicLeaderboard(request: Request, response: Response) {
        try {
            const leaderboard = await LeaderboardService.getActiveLeaderboard();
            
            return response.inertia("leaderboard", {
                leaderboard
            });
        } catch (error) {
            console.error('Error fetching public leaderboard:', error);
            return response.status(500).json({ error: 'Gagal mengambil data leaderboard' });
        }
    }

    /**
     * API: Get leaderboard data
     */
    public async getLeaderboardAPI(request: Request, response: Response) {
        try {
            const leaderboard = await LeaderboardService.getActiveLeaderboard();
            
            return response.json({
                success: true,
                data: leaderboard
            });
        } catch (error) {
            console.error('Error fetching leaderboard API:', error);
            return response.status(500).json({ 
                success: false,
                error: 'Gagal mengambil data leaderboard' 
            });
        }
    }
}

export default new LeaderboardController();
