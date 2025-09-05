"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    return knex.schema.dropTable('parent_student_relations');
}
//# sourceMappingURL=20240201000004_create_parent_student_relations.js.map