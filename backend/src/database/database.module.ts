import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PG_POOL } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const neonUrl = configService.get<string>('NEON_DATABASE_URL');
        const dbUrl = configService.get<string>('DATABASE_URL');

        console.log('NEON_DATABASE_URL:', neonUrl ? 'SET' : 'NOT SET');
        console.log('DATABASE_URL:', dbUrl ? 'SET' : 'NOT SET');

        const connectionString = neonUrl || dbUrl;

        const dbName = connectionString
          ? connectionString.split('?')[0].split('/').pop()
          : configService.get<string>('PGDATABASE', 'candidateportal');
        console.log('DB name at runtime:', dbName);

        if (connectionString?.trim()) {
          return new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
          });
        }

        return new Pool({
          host: configService.get<string>('PGHOST', '127.0.0.1'),
          port: Number(configService.get<string>('PGPORT', '5432')),
          user: configService.get<string>('PGUSER', 'postgres'),
          password: configService.get<string>('PGPASSWORD', 'postgres'),
          database: configService.get<string>('PGDATABASE', 'candidateportal'),
        });
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
