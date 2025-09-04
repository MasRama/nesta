import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('exam_attempts', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('exam_id').notNullable().index();
        table.uuid('student_id').notNullable().index();
        table.timestamp('started_at').notNullable();
        table.timestamp('submitted_at').nullable();
        table.json('answers').nullable(); // Student's answers
        table.json('question_order').nullable(); // Order of questions if randomized
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

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('exam_attempts');
}