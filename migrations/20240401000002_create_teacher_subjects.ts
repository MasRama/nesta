import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('teacher_subjects', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('teacher_id').notNullable().comment('ID guru');
        table.uuid('subject_id').notNullable().comment('ID mata pelajaran');
        table.boolean('is_active').defaultTo(true).comment('Status aktif assignment');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        
        // Foreign key constraints
        table.foreign('teacher_id')
            .references('id')
            .inTable('teachers')
            .onDelete('CASCADE');
            
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE');
        
        // Unique constraint to prevent duplicate assignments
        table.unique(['teacher_id', 'subject_id']);
        
        // Indexes for better performance
        table.index(['teacher_id']);
        table.index(['subject_id']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('teacher_subjects');
}