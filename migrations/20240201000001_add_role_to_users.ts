import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', (table) => {
        table.enum('role', ['student', 'teacher', 'parent', 'admin']).defaultTo('student');
        table.string('profile_image').nullable();
        table.string('student_id').nullable().unique();
        table.string('teacher_id').nullable().unique();
        table.json('metadata').nullable(); // For storing additional role-specific data
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', (table) => {
        table.dropColumn('role');
        table.dropColumn('profile_image');
        table.dropColumn('student_id');
        table.dropColumn('teacher_id');
        table.dropColumn('metadata');
    });
}