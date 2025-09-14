"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('parents', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('nama').notNullable().comment('Nama lengkap wali murid');
        table.string('email').unique().notNullable().comment('Email wali murid');
        table.string('password').notNullable().comment('Password wali murid (hashed)');
        table.string('phone').nullable().comment('Nomor telepon wali murid');
        table.boolean('is_active').defaultTo(true).comment('Status aktif wali murid');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.index(['email']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('parents');
}
//# sourceMappingURL=20240501000001_create_parents.js.map