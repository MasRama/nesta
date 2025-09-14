"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('teacher_subjects', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('teacher_id').notNullable().comment('ID guru');
        table.uuid('subject_id').notNullable().comment('ID mata pelajaran');
        table.boolean('is_active').defaultTo(true).comment('Status aktif assignment');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.foreign('teacher_id')
            .references('id')
            .inTable('teachers')
            .onDelete('CASCADE');
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE');
        table.unique(['teacher_id', 'subject_id']);
        table.index(['teacher_id']);
        table.index(['subject_id']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('teacher_subjects');
}
//# sourceMappingURL=20240401000002_create_teacher_subjects.js.map