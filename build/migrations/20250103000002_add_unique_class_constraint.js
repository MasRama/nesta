"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('leaderboard', (table) => {
        table.unique(['class_name']);
    });
}
async function down(knex) {
    return knex.schema.alterTable('leaderboard', (table) => {
        table.dropUnique(['class_name']);
    });
}
//# sourceMappingURL=20250103000002_add_unique_class_constraint.js.map