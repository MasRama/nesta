"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('attendance_sessions', (table) => {
        table.index(['attendance_date'], 'idx_attendance_sessions_date');
        table.index(['attendance_date', 'subject_id'], 'idx_attendance_sessions_date_subject');
        table.index(['attendance_date', 'class_id'], 'idx_attendance_sessions_date_class');
    });
    await knex.schema.alterTable('attendance_records', (table) => {
        table.index(['student_id', 'status'], 'idx_attendance_records_student_status');
        table.index(['status'], 'idx_attendance_records_status');
        table.index(['created_at'], 'idx_attendance_records_created_at');
    });
    console.log('✅ Attendance history indexes added successfully');
}
async function down(knex) {
    await knex.schema.alterTable('attendance_sessions', (table) => {
        table.dropIndex(['attendance_date'], 'idx_attendance_sessions_date');
        table.dropIndex(['attendance_date', 'subject_id'], 'idx_attendance_sessions_date_subject');
        table.dropIndex(['attendance_date', 'class_id'], 'idx_attendance_sessions_date_class');
    });
    await knex.schema.alterTable('attendance_records', (table) => {
        table.dropIndex(['student_id', 'status'], 'idx_attendance_records_student_status');
        table.dropIndex(['status'], 'idx_attendance_records_status');
        table.dropIndex(['created_at'], 'idx_attendance_records_created_at');
    });
    console.log('✅ Attendance history indexes removed successfully');
}
//# sourceMappingURL=20241223000001_add_attendance_history_indexes.js.map