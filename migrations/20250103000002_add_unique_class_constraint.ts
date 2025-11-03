import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Add unique constraint to class_name to prevent duplicates
    return knex.schema.alterTable('leaderboard', (table) => {
        table.unique(['class_name']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('leaderboard', (table) => {
        table.dropUnique(['class_name']);
    });
}
