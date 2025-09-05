"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('classes', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('name').notNullable();
        table.string('grade_level').notNullable();
        table.string('academic_year').notNullable();
        table.uuid('teacher_id').nullable().index();
        table.text('description').nullable();
        table.integer('max_students').defaultTo(30);
        table.json('schedule').nullable();
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.foreign('teacher_id')
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
    });
}
async function down(knex) {
    return knex.schema.dropTable('classes');
}
//# sourceMappingURL=20240201000002_create_classes.js.map