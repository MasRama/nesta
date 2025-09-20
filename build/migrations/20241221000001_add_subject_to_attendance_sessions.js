"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('attendance_sessions', (table) => {
        table.uuid('subject_id').nullable().index().comment('ID mata pelajaran yang sedang berlangsung');
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('SET NULL');
    });
}
async function down(knex) {
    return knex.schema.alterTable('attendance_sessions', (table) => {
        table.dropForeign(['subject_id']);
        table.dropColumn('subject_id');
    });
}
//# sourceMappingURL=20241221000001_add_subject_to_attendance_sessions.js.map