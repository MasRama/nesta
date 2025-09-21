import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // SQLite doesn't support dropping foreign keys directly, so we need to recreate the table
    
    // First, create a temporary table with the correct structure
    await knex.schema.createTable('subject_classes_temp', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('subject_id').notNullable().index();
        table.uuid('class_id').notNullable().index();
        table.uuid('teacher_id').notNullable().index().comment('Guru yang mengajar mata pelajaran ini di kelas ini');
        table.boolean('is_active').defaultTo(true).comment('Status aktif');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.string('day').nullable().comment('Hari dalam seminggu (Senin, Selasa, Rabu, Kamis, Jumat)');
        table.time('start_time').nullable().comment('Waktu mulai pelajaran (HH:MM)');
        table.time('end_time').nullable().comment('Waktu selesai pelajaran (HH:MM)');
        
        // Foreign key constraints - only the correct ones
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
            
        table.foreign('class_id')
            .references('id')
            .inTable('classes')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
            
        // This is the correct foreign key - teacher_id should reference teachers.id
        table.foreign('teacher_id')
            .references('id')
            .inTable('teachers')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
            
        // Unique constraint untuk mencegah duplikasi subject-class
        table.unique(['subject_id', 'class_id']);
        
        // Indexes for better performance
        table.index(['is_active']);
        table.index(['created_at']);
        table.index(['day']);
        table.index(['start_time']);
        table.index(['end_time']);
    });
    
    // Copy data from old table to new table
    await knex.raw(`
        INSERT INTO subject_classes_temp 
        SELECT * FROM subject_classes
    `);
    
    // Drop the old table
    await knex.schema.dropTable('subject_classes');
    
    // Rename the temporary table to the original name
    await knex.schema.renameTable('subject_classes_temp', 'subject_classes');
    
    console.log('✅ Fixed subject_classes foreign key constraints');
}

export async function down(knex: Knex): Promise<void> {
    // This is a complex migration to reverse, but we can recreate the old structure if needed
    console.log('⚠️  This migration cannot be easily reversed. Please restore from backup if needed.');
}
