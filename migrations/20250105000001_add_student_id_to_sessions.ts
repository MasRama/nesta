import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('sessions', (table) => {
        table.uuid('student_id').nullable().index().comment('ID siswa jika ini student session');
        
        table.foreign('student_id')
            .references('id')
            .inTable('students')
            .onDelete('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('sessions', (table) => {
        table.dropForeign(['student_id']);
        table.dropColumn('student_id');
    });
}
