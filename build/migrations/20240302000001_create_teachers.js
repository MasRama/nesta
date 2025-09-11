"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('teachers', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('nip').unique().notNullable().comment('Nomor Induk Pegawai');
        table.string('nama').notNullable().comment('Nama lengkap guru');
        table.string('email').unique().notNullable().comment('Email guru');
        table.string('password').notNullable().comment('Password guru');
        table.string('mata_pelajaran').nullable().comment('Mata pelajaran yang diampu');
        table.string('phone').nullable().comment('Nomor telepon');
        table.uuid('user_id').nullable().index().comment('Link ke user account jika ada');
        table.boolean('is_active').defaultTo(true).comment('Status aktif guru');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.foreign('user_id')
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
        table.index(['mata_pelajaran']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('teachers');
}
//# sourceMappingURL=20240302000001_create_teachers.js.map