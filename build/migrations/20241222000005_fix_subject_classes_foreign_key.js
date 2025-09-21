"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('subject_classes_temp', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('subject_id').notNullable().index();
        table.uuid('class_id').notNullable().index();
        table.uuid('teacher_id').notNullable().index().comment('Guru yang mengajar mata pelajaran ini di kelas ini');
        table.boolean('is_active').defaultTo(true).comment('Status aktif');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.string('day').nullable().comment('Hari dalam seminggu (Senin, Selasa, Rabu, Kamis, Jumat)');
        table.time('start_time').nullable().comment('Waktu mulai pelajaran (HH:MM)');
        table.time('end_time').nullable().comment('Waktu selesai pelajaran (HH:MM)');
        table.foreign('subject_id')
            .references('id')
            .inTable('subjects')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
        table.foreign('class_id')
            .references('id')
            .inTable('classes')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
        table.foreign('teacher_id')
            .references('id')
            .inTable('teachers')
            .onDelete('CASCADE')
            .onUpdate('CASCADE');
        table.unique(['subject_id', 'class_id']);
        table.index(['is_active']);
        table.index(['created_at']);
        table.index(['day']);
        table.index(['start_time']);
        table.index(['end_time']);
    });
    await knex.raw(`
        INSERT INTO subject_classes_temp 
        SELECT * FROM subject_classes
    `);
    await knex.schema.dropTable('subject_classes');
    await knex.schema.renameTable('subject_classes_temp', 'subject_classes');
    console.log('✅ Fixed subject_classes foreign key constraints');
}
async function down(knex) {
    console.log('⚠️  This migration cannot be easily reversed. Please restore from backup if needed.');
}
//# sourceMappingURL=20241222000005_fix_subject_classes_foreign_key.js.map