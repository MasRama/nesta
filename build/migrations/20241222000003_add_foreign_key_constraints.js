"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('teacher_subjects', (table) => {
        table.foreign('teacher_id')
            .references('id')
            .inTable('teachers')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
    await knex.schema.alterTable('subject_classes', (table) => {
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
        table.foreign('teacher_id')
            .references('id')
            .inTable('teachers')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
    });
    console.log('✅ Foreign key constraints added successfully');
}
async function down(knex) {
    await knex.schema.alterTable('teacher_subjects', (table) => {
        table.dropForeign(['teacher_id']);
        table.dropForeign(['subject_id']);
    });
    await knex.schema.alterTable('subject_classes', (table) => {
        table.dropForeign(['subject_id']);
        table.dropForeign(['class_id']);
        table.dropForeign(['teacher_id']);
    });
    console.log('✅ Foreign key constraints removed successfully');
}
//# sourceMappingURL=20241222000003_add_foreign_key_constraints.js.map