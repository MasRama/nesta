import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('leaderboard', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('class_name').notNullable().comment('Nama kelas');
        table.integer('points').notNullable().defaultTo(0).comment('Poin untuk ranking');
        table.text('description').nullable().comment('Deskripsi pencapaian kelas');
        table.boolean('is_active').defaultTo(true).comment('Status aktif');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        
        // Indexes for better performance
        table.index(['points']);
        table.index(['class_name']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('leaderboard');
}
