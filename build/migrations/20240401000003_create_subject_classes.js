"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('subject_classes', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('subject_id').notNullable().index();
        table.uuid('class_id').notNullable().index();
        table.uuid('teacher_id').nullable().index().comment('Guru yang mengajar mata pelajaran ini di kelas ini');
        table.integer('jam_per_minggu').nullable().comment('Jumlah jam pelajaran per minggu untuk kelas ini');
        table.boolean('is_active').defaultTo(true).comment('Status aktif');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE');
        table.foreign('class_id')
            .references('id')
            .inTable('classes')
            .onDelete('CASCADE');
        table.foreign('teacher_id')
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');
        table.unique(['subject_id', 'class_id']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('subject_classes');
}
//# sourceMappingURL=20240401000003_create_subject_classes.js.map