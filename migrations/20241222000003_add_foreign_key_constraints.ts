import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Add foreign key constraints to teacher_subjects table
    await knex.schema.alterTable('teacher_subjects', (table) => {
        // Add foreign key for teacher_id
        table.foreign('teacher_id')
            .references('id')
            .inTable('teachers')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
            
        // Add foreign key for subject_id
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });

    // Add foreign key constraints to subject_classes table
    await knex.schema.alterTable('subject_classes', (table) => {
        // Add foreign key for subject_id
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
            
        // Add foreign key for class_id
        table.foreign('class_id')
            .references('id')
            .inTable('classes')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
            
        // Add foreign key for teacher_id
        table.foreign('teacher_id')
            .references('id')
            .inTable('teachers')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });

    // Note: students table doesn't have class_id - uses student_classes junction table instead

    // Note: classes table already has foreign key for teacher_id to users table from original migration

    console.log('✅ Foreign key constraints added successfully');
}

export async function down(knex: Knex): Promise<void> {
    // Remove foreign key constraints from teacher_subjects table
    await knex.schema.alterTable('teacher_subjects', (table) => {
        table.dropForeign(['teacher_id']);
        table.dropForeign(['subject_id']);
    });

    // Remove foreign key constraints from subject_classes table
    await knex.schema.alterTable('subject_classes', (table) => {
        table.dropForeign(['subject_id']);
        table.dropForeign(['class_id']);
        table.dropForeign(['teacher_id']);
    });

    // Note: students table doesn't have class_id foreign key to remove

    // Note: classes table foreign key for teacher_id is from original migration, not added here

    console.log('✅ Foreign key constraints removed successfully');
}
