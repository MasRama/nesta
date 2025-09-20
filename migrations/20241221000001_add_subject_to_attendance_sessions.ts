import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('attendance_sessions', (table) => {
        // Add subject_id column to track which subject the attendance is for
        table.uuid('subject_id').nullable().index().comment('ID mata pelajaran yang sedang berlangsung');
        
        // Add foreign key constraint
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('SET NULL');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('attendance_sessions', (table) => {
        // Drop foreign key constraint first
        table.dropForeign(['subject_id']);
        
        // Drop the column
        table.dropColumn('subject_id');
    });
}
