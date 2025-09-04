import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('exams', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('teacher_id').notNullable().index();
        table.uuid('class_id').notNullable().index();
        table.string('title').notNullable();
        table.text('description').nullable();
        table.integer('duration_minutes').notNullable();
        table.boolean('randomize_questions').defaultTo(false);
        table.boolean('randomize_options').defaultTo(false);
        table.timestamp('start_time').notNullable();
        table.timestamp('end_time').notNullable();
        table.enum('status', ['draft', 'active', 'completed', 'cancelled']).defaultTo('draft');
        table.integer('max_attempts').defaultTo(1);
        table.decimal('pass_score', 5, 2).nullable();
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        
        table.foreign('teacher_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
            
        table.foreign('class_id')
            .references('id')
            .inTable('classes')
            .onDelete('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('exams');
}