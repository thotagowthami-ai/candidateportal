import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.constants';

@Injectable()
export class TokenStoreService implements OnModuleInit {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS shared_tokens (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          expires_at TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_shared_tokens_expires_at ON shared_tokens(expires_at);
      `);
      console.log('Shared tokens table initialized');
    } catch (error) {
      console.error('Failed to initialize shared tokens table:', error);
      throw error;
    }
  }

  async set(key: string, value: any, ttlSeconds: number) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await this.pool.query(
      `INSERT INTO shared_tokens (key, value, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (key) DO UPDATE SET value = $2, expires_at = $3`,
      [key, JSON.stringify(value), expiresAt],
    );
  }

  async get(key: string) {
    const res = await this.pool.query(
      'SELECT value FROM shared_tokens WHERE key = $1 AND expires_at > NOW()',
      [key],
    );
    return res.rows[0]?.value;
  }

  async delete(key: string) {
    await this.pool.query('DELETE FROM shared_tokens WHERE key = $1', [key]);
  }
}
