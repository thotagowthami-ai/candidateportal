"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
const database_constants_1 = require("./database.constants");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: database_constants_1.PG_POOL,
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const neonUrl = configService.get('NEON_DATABASE_URL');
                    const dbUrl = configService.get('DATABASE_URL');
                    console.log('NEON_DATABASE_URL:', neonUrl ? 'SET' : 'NOT SET');
                    console.log('DATABASE_URL:', dbUrl ? dbUrl.substring(0, 30) + '...' : 'NOT SET');
                    const connectionString = neonUrl || dbUrl;
                    const dbName = connectionString
                        ? connectionString.split('?')[0].split('/').pop()
                        : configService.get('PGDATABASE', 'candidateportal');
                    console.log('DB name at runtime:', dbName);
                    if (connectionString?.trim()) {
                        return new pg_1.Pool({
                            connectionString,
                            ssl: { rejectUnauthorized: false },
                        });
                    }
                    return new pg_1.Pool({
                        host: configService.get('PGHOST', '127.0.0.1'),
                        port: Number(configService.get('PGPORT', '5432')),
                        user: configService.get('PGUSER', 'postgres'),
                        password: configService.get('PGPASSWORD', 'postgres'),
                        database: configService.get('PGDATABASE', 'candidateportal'),
                    });
                },
            },
        ],
        exports: [database_constants_1.PG_POOL],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map