import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('exam_questions', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('exam_id').notNullable().index();
        table.text('question_text').notNullable();
        table.json('options').notNullable(); // Array of answer options
        table.integer('correct_answer_index').notNullable(); // Index of correct answer in options array
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

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('exam_questions');
}