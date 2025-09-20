import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Drop the unused subject_schedules table
    // This table was created but never used in the application
    // The actual scheduling is handled by subject_classes table
    return knex.schema.dropTableIfExists('subject_schedules');
}

export async function down(knex: Knex): Promise<void> {
    // Recreate the subject_schedules table if rollback is needed
    return knex.schema.createTable('subject_schedules', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('subject_id').notNullable().index().comment('ID mata pelajaran');
        table.string('kelas').notNullable().comment('Nama kelas dari data students (contoh: 8F, 8H)');
        table.time('start_time').notNullable().comment('Jam mulai pelajaran');
        table.time('end_time').notNullable().comment('Jam selesai pelajaran');
        table.enum('day', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']).notNullable().comment('Hari dalam seminggu');
        table.boolean('is_active').defaultTo(true).comment('Status aktif jadwal');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        
        // Foreign key constraint
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE');
            
        // Indexes for better performance
        table.index(['subject_id', 'kelas']);
        table.index(['day']);
        table.index(['is_active']);
        table.index(['created_at']);
        
        // Unique constraint to prevent duplicate schedules
        table.unique(['subject_id', 'kelas', 'day', 'start_time'], 'unique_subject_schedule');
    });
}
