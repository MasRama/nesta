import DB from "./DB";
import { v4 as uuidv4 } from 'uuid';

class LeaderboardService {
    /**
     * Get all leaderboard entries sorted by points (highest first)
     */
    public async getAllLeaderboard() {
        const leaderboard = await DB.from("leaderboard")
            .orderBy("points", "desc")
            .orderBy("created_at", "asc");
        
        return leaderboard;
    }

    /**
     * Get only active leaderboard entries for public view
     */
    public async getActiveLeaderboard() {
        const leaderboard = await DB.from("leaderboard")
            .where("is_active", true)
            .orderBy("points", "desc")
            .orderBy("created_at", "asc");
        
        return leaderboard;
    }

    /**
     * Get leaderboard entry by ID
     */
    public async getLeaderboardById(id: string) {
        const entry = await DB.from("leaderboard")
            .where("id", id)
            .first();
        
        if (!entry) {
            throw new Error("Data leaderboard tidak ditemukan");
        }
        
        return entry;
    }

    /**
     * Create new leaderboard entry with transaction to prevent race condition
     */
    public async createLeaderboard(data: {
        class_name: string;
        points: number;
        description?: string;
        is_active?: boolean;
    }) {
        // Validate required fields
        if (!data.class_name) {
            throw new Error("Nama kelas wajib diisi");
        }
        
        if (data.points === undefined || data.points === null) {
            throw new Error("Poin wajib diisi");
        }

        const id = uuidv4();
        const now = Date.now();

        // Use transaction to ensure atomicity and prevent race condition
        return await DB.transaction(async (trx) => {
            // Check if class already exists in leaderboard within transaction
            const existing = await trx.from("leaderboard")
                .where("class_name", data.class_name)
                .first();
            
            if (existing) {
                throw new Error(`Kelas "${data.class_name}" sudah ada di leaderboard`);
            }

            // Insert new leaderboard entry
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

    /**
     * Update leaderboard entry
     */
    public async updateLeaderboard(id: string, data: {
        class_name?: string;
        points?: number;
        description?: string;
        is_active?: boolean;
    }) {
        // Check if entry exists
        await this.getLeaderboardById(id);
        
        const updateData: any = {
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
        
        await DB.table("leaderboard")
            .where("id", id)
            .update(updateData);
        
        return true;
    }

    /**
     * Delete leaderboard entry
     */
    public async deleteLeaderboard(id: string) {
        // Check if entry exists
        await this.getLeaderboardById(id);
        
        await DB.table("leaderboard")
            .where("id", id)
            .delete();
        
        return true;
    }

    /**
     * Get unique classes for dropdown
     */
    public async getUniqueClasses() {
        const classes = await DB.from("students")
            .distinct("kelas")
            .whereNotNull("kelas")
            .orderBy("kelas", "asc");
        
        return classes.map(c => c.kelas);
    }

    /**
     * Bulk delete leaderboard entries
     */
    public async bulkDelete(ids: string[]) {
        if (!ids || ids.length === 0) {
            throw new Error("Tidak ada data yang dipilih untuk dihapus");
        }

        await DB.table("leaderboard")
            .whereIn("id", ids)
            .delete();

        return ids.length;
    }
}

export default new LeaderboardService();
