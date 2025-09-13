import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('subjects', (table) => {
        // Drop column jam_per_minggu
        table.dropColumn('jam_per_minggu');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('subjects', (table) => {
        // Add column back
        table.integer('jam_per_minggu').nullable().comment('Jumlah jam pelajaran per minggu');
    });
}