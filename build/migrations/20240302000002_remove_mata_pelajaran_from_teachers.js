"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('teachers', (table) => {
        table.dropIndex(['mata_pelajaran']);
        table.dropColumn('mata_pelajaran');
    });
}
async function down(knex) {
    return knex.schema.alterTable('teachers', (table) => {
        table.string('mata_pelajaran').nullable().comment('Mata pelajaran yang diampu');
        table.index(['mata_pelajaran']);
    });
}
//# sourceMappingURL=20240302000002_remove_mata_pelajaran_from_teachers.js.map