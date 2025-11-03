"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('leaderboard', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('class_name').notNullable().comment('Nama kelas');
        table.integer('points').notNullable().defaultTo(0).comment('Poin untuk ranking');
        table.text('description').nullable().comment('Deskripsi pencapaian kelas');
        table.boolean('is_active').defaultTo(true).comment('Status aktif');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.index(['points']);
        table.index(['class_name']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('leaderboard');
}
//# sourceMappingURL=20250103000001_create_leaderboard.js.map