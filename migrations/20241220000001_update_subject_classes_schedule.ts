import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('subject_classes', (table) => {
        // Add new schedule columns
        table.string('day').nullable().comment('Hari dalam seminggu (Senin, Selasa, Rabu, Kamis, Jumat)');
        table.time('start_time').nullable().comment('Waktu mulai pelajaran (HH:MM)');
        table.time('end_time').nullable().comment('Waktu selesai pelajaran (HH:MM)');
        
        // Make teacher_id required (not nullable)
        table.uuid('teacher_id').notNullable().alter();
        
        // Drop the old jam_per_minggu column
        table.dropColumn('jam_per_minggu');
        
        // Add indexes for better performance
        table.index(['day']);
        table.index(['start_time']);
        table.index(['end_time']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('subject_classes', (table) => {
        // Remove schedule columns
        table.dropIndex(['day']);
        table.dropIndex(['start_time']);
        table.dropIndex(['end_time']);
        table.dropColumn('day');
        table.dropColumn('start_time');
        table.dropColumn('end_time');
        
        // Make teacher_id nullable again
        table.uuid('teacher_id').nullable().alter();
        
        // Add back jam_per_minggu column
        table.integer('jam_per_minggu').nullable().comment('Jumlah jam pelajaran per minggu untuk kelas ini');
    });
}
