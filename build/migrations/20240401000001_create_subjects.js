"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('subjects', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('kode').unique().notNullable().comment('Kode mata pelajaran (contoh: MTK, IPA)');
        table.string('nama').notNullable().comment('Nama mata pelajaran');
        table.text('deskripsi').nullable().comment('Deskripsi mata pelajaran');
        table.integer('jam_per_minggu').nullable().comment('Jumlah jam pelajaran per minggu');
        table.boolean('is_active').defaultTo(true).comment('Status aktif mata pelajaran');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.index(['kode']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('subjects');
}
//# sourceMappingURL=20240401000001_create_subjects.js.map