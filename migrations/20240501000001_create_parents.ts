import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('parents', (table) => {
        table.uuid('id').primary().notNullable();
        table.string('nama').notNullable().comment('Nama lengkap wali murid');
        table.string('email').unique().notNullable().comment('Email wali murid');
        table.string('password').notNullable().comment('Password wali murid (hashed)');
        table.string('phone').nullable().comment('Nomor telepon wali murid');
        table.boolean('is_active').defaultTo(true).comment('Status aktif wali murid');
        table.text('notes').nullable().comment('Catatan tambahan');
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        
        // Indexes for better performance
        table.index(['email']);
        table.index(['is_active']);
        table.index(['created_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('parents');
}
