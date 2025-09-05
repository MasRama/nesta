"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('users', (table) => {
        table.enum('role', ['student', 'teacher', 'parent', 'admin']).defaultTo('student');
        table.string('profile_image').nullable();
        table.string('student_id').nullable().unique();
        table.string('teacher_id').nullable().unique();
        table.json('metadata').nullable();
    });
}
async function down(knex) {
    return knex.schema.alterTable('users', (table) => {
        table.dropColumn('role');
        table.dropColumn('profile_image');
        table.dropColumn('student_id');
        table.dropColumn('teacher_id');
        table.dropColumn('metadata');
    });
}
//# sourceMappingURL=20240201000001_add_role_to_users.js.map