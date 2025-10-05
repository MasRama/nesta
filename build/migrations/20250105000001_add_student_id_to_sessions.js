"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('sessions', (table) => {
        table.uuid('student_id').nullable().index().comment('ID siswa jika ini student session');
        table.foreign('student_id')
            .references('id')
            .inTable('students')
            .onDelete('CASCADE');
    });
}
async function down(knex) {
    return knex.schema.alterTable('sessions', (table) => {
        table.dropForeign(['student_id']);
        table.dropColumn('student_id');
    });
}
//# sourceMappingURL=20250105000001_add_student_id_to_sessions.js.map