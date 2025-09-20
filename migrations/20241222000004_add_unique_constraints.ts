import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Add unique constraint to teacher_subjects table
    // Prevent duplicate teacher-subject assignments
    await knex.schema.alterTable('teacher_subjects', (table) => {
        table.unique(['teacher_id', 'subject_id'], 'unique_teacher_subject');
    });

    // Add unique constraint to subject_classes table
    // Prevent duplicate subject-class assignments with same teacher and schedule
    await knex.schema.alterTable('subject_classes', (table) => {
        // Prevent same subject being assigned to same class multiple times
        table.unique(['subject_id', 'class_id'], 'unique_subject_class');
        
        // Prevent schedule conflicts in the same class
        table.unique(['class_id', 'day', 'start_time', 'end_time'], 'unique_class_schedule');
    });

    // Note: students table already has unique constraint on nipd from original migration

    // Note: teachers table already has unique constraints on nip and email from original migration

    // Note: subjects table already has unique constraint on kode from original migration

    // Add unique constraint to classes table
    // Prevent duplicate class names
    await knex.schema.alterTable('classes', (table) => {
        table.unique(['name'], 'unique_class_name');
    });

    console.log('✅ Unique constraints added successfully');
}

export async function down(knex: Knex): Promise<void> {
    // Remove unique constraints from teacher_subjects table
    await knex.schema.alterTable('teacher_subjects', (table) => {
        table.dropUnique(['teacher_id', 'subject_id'], 'unique_teacher_subject');
    });

    // Remove unique constraints from subject_classes table
    await knex.schema.alterTable('subject_classes', (table) => {
        table.dropUnique(['subject_id', 'class_id'], 'unique_subject_class');
        table.dropUnique(['class_id', 'day', 'start_time', 'end_time'], 'unique_class_schedule');
    });

    // Note: students table unique constraint on nipd is from original migration, not added here

    // Note: teachers and subjects unique constraints are from original migrations, not added here

    // Remove unique constraints from classes table
    await knex.schema.alterTable('classes', (table) => {
        table.dropUnique(['name'], 'unique_class_name');
    });

    console.log('✅ Unique constraints removed successfully');
}
