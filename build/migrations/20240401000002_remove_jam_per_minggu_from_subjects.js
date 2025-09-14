"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('subjects', (table) => {
        table.dropColumn('jam_per_minggu');
    });
}
async function down(knex) {
    return knex.schema.alterTable('subjects', (table) => {
        table.integer('jam_per_minggu').nullable().comment('Jumlah jam pelajaran per minggu');
    });
}
//# sourceMappingURL=20240401000002_remove_jam_per_minggu_from_subjects.js.map