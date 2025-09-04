import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('parent_student_relations', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('parent_id').notNullable().index();
        table.uuid('student_id').notNullable().index();
        table.enum('relationship', ['father', 'mother', 'guardian', 'other']).notNullable();
        table.boolean('is_primary_contact').defaultTo(false);
        table.bigInteger('created_at').notNullable();
        
        table.foreign('parent_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
            
        table.foreign('student_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
            
        table.unique(['parent_id', 'student_id']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('parent_student_relations');
}