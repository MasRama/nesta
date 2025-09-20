"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('subject_classes', (table) => {
        table.string('day').nullable().comment('Hari dalam seminggu (Senin, Selasa, Rabu, Kamis, Jumat)');
        table.time('start_time').nullable().comment('Waktu mulai pelajaran (HH:MM)');
        table.time('end_time').nullable().comment('Waktu selesai pelajaran (HH:MM)');
        table.uuid('teacher_id').notNullable().alter();
        table.dropColumn('jam_per_minggu');
        table.index(['day']);
        table.index(['start_time']);
        table.index(['end_time']);
    });
}
async function down(knex) {
    return knex.schema.alterTable('subject_classes', (table) => {
        table.dropIndex(['day']);
        table.dropIndex(['start_time']);
        table.dropIndex(['end_time']);
        table.dropColumn('day');
        table.dropColumn('start_time');
        table.dropColumn('end_time');
        table.uuid('teacher_id').nullable().alter();
        table.integer('jam_per_minggu').nullable().comment('Jumlah jam pelajaran per minggu untuk kelas ini');
    });
}
//# sourceMappingURL=20241220000001_update_subject_classes_schedule.js.map