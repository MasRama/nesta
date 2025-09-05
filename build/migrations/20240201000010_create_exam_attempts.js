"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('exam_attempts', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('exam_id').notNullable().index();
        table.uuid('student_id').notNullable().index();
        table.timestamp('started_at').notNullable();
        table.timestamp('submitted_at').nullable();
        table.json('answers').nullable();
        table.json('question_order').nullable();
        table.decimal('score', 5, 2).nullable();
        table.decimal('percentage', 5, 2).nullable();
        table.enum('status', ['in_progress', 'submitted', 'timed_out']).defaultTo('in_progress');
        table.integer('attempt_number').notNullable();
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.foreign('exam_id')
            .references('id')
            .inTable('exams')
            .onDelete('CASCADE');
        table.foreign('student_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
        table.unique(['exam_id', 'student_id', 'attempt_number']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('exam_attempts');
}
//# sourceMappingURL=20240201000010_create_exam_attempts.js.map