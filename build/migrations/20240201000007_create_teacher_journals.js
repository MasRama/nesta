"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('teacher_journals', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('teacher_id').notNullable().index();
        table.uuid('class_id').notNullable().index();
        table.string('title').notNullable();
        table.text('content').notNullable();
        table.json('media_files').nullable();
        table.date('journal_date').notNullable();
        table.enum('status', ['draft', 'published']).defaultTo('draft');
        table.json('tags').nullable();
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
async function down(knex) {
    return knex.schema.dropTable('teacher_journals');
}
//# sourceMappingURL=20240201000007_create_teacher_journals.js.map