import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Remove the unused schedule JSON field from classes table
    // This field was originally intended for weekly schedules but is not used
    // Actual scheduling is handled by subject_classes table with proper relational structure
    return knex.schema.alterTable('classes', (table) => {
        table.dropColumn('schedule');
    });
}

export async function down(knex: Knex): Promise<void> {
    // Add back the schedule field if rollback is needed
    return knex.schema.alterTable('classes', (table) => {
        table.json('schedule').nullable().comment('Weekly schedule (unused - for rollback only)');
    });
}
