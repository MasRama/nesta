"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('students', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('nipd').unique().notNullable().comment('Nomor Induk Peserta Didik');
        table.string('nama').notNullable().comment('Nama lengkap siswa');
        table.string('kelas').notNullable().comment('Kelas siswa (contoh: 7A, 8B)');
        table.string('tempat_lahir').notNullable().comment('Tempat lahir siswa');
        table.date('tanggal_lahir').notNullable().comment('Tanggal lahir siswa');
        table.enum('jenis_kelamin', ['Laki - Laki', 'Perempuan']).notNullable().comment('Jenis kelamin siswa');
        table.string('agama').notNullable().comment('Agama siswa');
        table.uuid('user_id').nullable().index().comment('Link ke user account jika ada');
        table.boolean('is_active').defaultTo(true).comment('Status aktif siswa');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.foreign('user_id')
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
        table.index(['kelas']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('students');
}
//# sourceMappingURL=20240301000001_create_students.js.map