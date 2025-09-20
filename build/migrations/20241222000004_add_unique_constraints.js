"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('teacher_subjects', (table) => {
        table.unique(['teacher_id', 'subject_id'], 'unique_teacher_subject');
    });
    await knex.schema.alterTable('subject_classes', (table) => {
        table.unique(['subject_id', 'class_id'], 'unique_subject_class');
        table.unique(['class_id', 'day', 'start_time', 'end_time'], 'unique_class_schedule');
    });
    await knex.schema.alterTable('classes', (table) => {
        table.unique(['name'], 'unique_class_name');
    });
    console.log('✅ Unique constraints added successfully');
}
async function down(knex) {
    await knex.schema.alterTable('teacher_subjects', (table) => {
        table.dropUnique(['teacher_id', 'subject_id'], 'unique_teacher_subject');
    });
    await knex.schema.alterTable('subject_classes', (table) => {
        table.dropUnique(['subject_id', 'class_id'], 'unique_subject_class');
        table.dropUnique(['class_id', 'day', 'start_time', 'end_time'], 'unique_class_schedule');
    });
    await knex.schema.alterTable('classes', (table) => {
        table.dropUnique(['name'], 'unique_class_name');
    });
    console.log('✅ Unique constraints removed successfully');
}
//# sourceMappingURL=20241222000004_add_unique_constraints.js.map