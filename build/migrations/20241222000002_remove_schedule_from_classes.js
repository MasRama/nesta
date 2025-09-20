"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('classes', (table) => {
        table.dropColumn('schedule');
    });
}
async function down(knex) {
    return knex.schema.alterTable('classes', (table) => {
        table.json('schedule').nullable().comment('Weekly schedule (unused - for rollback only)');
    });
}
//# sourceMappingURL=20241222000002_remove_schedule_from_classes.js.map