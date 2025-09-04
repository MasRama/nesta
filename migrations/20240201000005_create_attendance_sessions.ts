import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('attendance_sessions', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('class_id').notNullable().index();
        table.uuid('teacher_id').notNullable().index();
        table.date('attendance_date').notNullable();
        table.string('qr_token').notNullable().unique();
        table.timestamp('starts_at').notNullable();
        table.timestamp('expires_at').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.text('notes').nullable();
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        
        table.foreign('class_id')
            .references('id')
            .inTable('classes')
            .onDelete('CASCADE');
            
        table.foreign('teacher_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('attendance_sessions');
}