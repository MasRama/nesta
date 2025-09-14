"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('subject_schedules', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('subject_id').notNullable().index().comment('ID mata pelajaran');
        table.string('kelas').notNullable().comment('Nama kelas dari data students (contoh: 8F, 8H)');
        table.time('start_time').notNullable().comment('Jam mulai pelajaran');
        table.time('end_time').notNullable().comment('Jam selesai pelajaran');
        table.enum('day', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']).notNullable().comment('Hari dalam seminggu');
        table.boolean('is_active').defaultTo(true).comment('Status aktif jadwal');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE');
        table.index(['subject_id', 'kelas']);
        table.index(['day']);
        table.index(['is_active']);
        table.index(['created_at']);
        table.unique(['subject_id', 'kelas', 'day', 'start_time'], 'unique_subject_schedule');
    });
}
async function down(knex) {
    return knex.schema.dropTable('subject_schedules');
}
//# sourceMappingURL=20240401000004_create_subject_schedules.js.map