import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('student_classes', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('student_id').notNullable().index();
        table.uuid('class_id').notNullable().index();
        table.date('enrollment_date').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.bigInteger('created_at').notNullable();
        
        table.foreign('student_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
            
        table.foreign('class_id')
            .references('id')
            .inTable('classes')
            .onDelete('CASCADE');
            
        table.unique(['student_id', 'class_id']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('student_classes');
}