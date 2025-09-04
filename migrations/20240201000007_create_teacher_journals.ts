import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('teacher_journals', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('teacher_id').notNullable().index();
        table.uuid('class_id').notNullable().index();
        table.string('title').notNullable();
        table.text('content').notNullable();
        table.json('media_files').nullable(); // Array of file paths/URLs
        table.date('journal_date').notNullable();
        table.enum('status', ['draft', 'published']).defaultTo('draft');
        table.json('tags').nullable(); // Subject tags, activity tags, etc.
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
    return knex.schema.dropTable('teacher_journals');
}