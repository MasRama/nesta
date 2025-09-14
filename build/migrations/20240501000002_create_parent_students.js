"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('parent_students', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('parent_id').notNullable().comment('ID wali murid');
        table.uuid('student_id').notNullable().comment('ID siswa');
        table.enum('relationship_type', ['ayah', 'ibu', 'wali', 'lainnya']).notNullable().comment('Jenis hubungan dengan siswa');
        table.boolean('is_primary_contact').defaultTo(false).comment('Kontak utama untuk siswa ini');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        table.foreign('parent_id')
            .references('id')
            .inTable('parents')
            .onDelete('CASCADE');
        table.foreign('student_id')
            .references('id')
            .inTable('students')
            .onDelete('CASCADE');
        table.unique(['parent_id', 'student_id', 'relationship_type']);
        table.index(['parent_id']);
        table.index(['student_id']);
        table.index(['is_primary_contact']);
        table.index(['created_at']);
    });
}
async function down(knex) {
    return knex.schema.dropTable('parent_students');
}
//# sourceMappingURL=20240501000002_create_parent_students.js.map