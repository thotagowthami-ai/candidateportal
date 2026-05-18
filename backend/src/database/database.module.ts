import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PG_POOL } from './database.constants';
import { TokenStoreService } from './token-store.service';

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

        const sslEnabled =
          configService.get<string>('PG_SSL', 'true') === 'true';
        const rejectUnauthorized =
          configService.get<string>('PG_SSL_REJECT_UNAUTHORIZED', 'true') ===
          'true';

        const ssl = sslEnabled ? { rejectUnauthorized } : false;

        if (connectionString?.trim()) {
          return new Pool({
            connectionString,
            ssl,
          });
        }

        const host = configService.get<string>('PGHOST');
        const portVal = configService.get<string>('PGPORT', '5432');
        const port = Number(portVal);
        const user = configService.get<string>('PGUSER');
        const password = configService.get<string>('PGPASSWORD');
        const database = configService.get<string>('PGDATABASE');

        if (!host) {
          throw new Error('Missing database configuration: PGHOST is not defined.');
        }
        if (Number.isNaN(port)) {
          throw new Error('Missing database configuration: PGPORT is not a valid number.');
        }
        if (!user) {
          throw new Error('Missing database configuration: PGUSER is not defined.');
        }
        if (!password) {
          throw new Error('Missing database configuration: PGPASSWORD is not defined.');
        }
        if (!database) {
          throw new Error('Missing database configuration: PGDATABASE is not defined.');
        }

        return new Pool({
          host,
          port,
          user,
          password,
          database,
          ssl,
        });
      },
    },
    TokenStoreService,
  ],
  exports: [PG_POOL, TokenStoreService],
})
export class DatabaseModule {}
