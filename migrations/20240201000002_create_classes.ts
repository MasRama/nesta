import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('classes', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('name').notNullable();
        table.string('grade_level').notNullable();
        table.string('academic_year').notNullable();
        table.uuid('teacher_id').nullable().index();
        table.text('description').nullable();
        table.integer('max_students').defaultTo(30);
        table.json('schedule').nullable(); // Weekly schedule
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        
        table.foreign('teacher_id')
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('classes');
}