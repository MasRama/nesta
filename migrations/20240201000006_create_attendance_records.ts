import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('attendance_records', (table) => {
        table.uuid('id').primary().notNullable();
        table.uuid('attendance_session_id').notNullable().index();
        table.uuid('student_id').notNullable().index();
        table.enum('status', ['present', 'absent', 'late', 'excused']).notNullable();
        table.timestamp('scanned_at').nullable();
        table.text('notes').nullable();
        table.bigInteger('created_at').notNullable();
        table.bigInteger('updated_at').notNullable();
        
        table.foreign('attendance_session_id')
            .references('id')
            .inTable('attendance_sessions')
            .onDelete('CASCADE');
            
        table.foreign('student_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
            
        table.unique(['attendance_session_id', 'student_id']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('attendance_records');
}