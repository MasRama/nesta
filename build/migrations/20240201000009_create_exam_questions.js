"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('exam_questions', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('exam_id').notNullable().index();
        table.text('question_text').notNullable();
        table.json('options').notNullable();
        table.integer('correct_answer_index').notNullable();
        table.decimal('points', 5, 2).defaultTo(1.00);
        table.integer('order_index').notNullable();
        table.text('explanation').nullable();
        table.bigInteger('created_at').notNullable();
        table.foreign('exam_id')
            .references('id')
            .inTable('exams')
            .onDelete('CASCADE');
    });
}
async function down(knex) {
    return knex.schema.dropTable('exam_questions');
}
//# sourceMappingURL=20240201000009_create_exam_questions.js.map