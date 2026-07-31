import pg from 'pg';
import { env } from './env.js';

export const pool = new pg.Pool(env.database);

pool.on('error', (error) => {
  console.error('Error inesperado en PostgreSQL:', error.message);
});
