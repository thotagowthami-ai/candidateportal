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

        return new Pool({
          host: configService.get<string>('PGHOST', '127.0.0.1'),
          port: Number(configService.get<string>('PGPORT', '5432')),
          user: configService.get<string>('PGUSER', 'postgres'),
          password: configService.get<string>('PGPASSWORD', 'postgres'),
          database: configService.get<string>('PGDATABASE', 'candidateportal'),
          ssl,
        });
      },
    },
    TokenStoreService,
  ],
  exports: [PG_POOL, TokenStoreService],
})
export class DatabaseModule {}
