"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    development: {
        client: "better-sqlite3",
        connection: {
            filename: "./dev.sqlite3"
        },
        useNullAsDefault: true,
        migrations: {
            directory: "./migrations"
        },
        seeds: {
            directory: "./seeds"
        }
    },
    production: {
        client: "better-sqlite3",
        connection: {
            filename: "./production.sqlite3"
        },
        useNullAsDefault: true,
        migrations: {
            directory: "./migrations"
        },
        seeds: {
            directory: "./seeds"
        }
    }
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map