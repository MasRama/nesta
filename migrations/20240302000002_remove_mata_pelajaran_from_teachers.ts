import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('teachers', (table) => {
        // Drop index first
        table.dropIndex(['mata_pelajaran']);
        // Drop column
        table.dropColumn('mata_pelajaran');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('teachers', (table) => {
        // Add column back
        table.string('mata_pelajaran').nullable().comment('Mata pelajaran yang diampu');
        // Add index back
        table.index(['mata_pelajaran']);
    });
}