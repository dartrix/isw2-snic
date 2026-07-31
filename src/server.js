import { app } from './app.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';

async function start() {
  await pool.query('SELECT 1');
  app.listen(env.port, () => {
    console.log(`API disponible en http://localhost:${env.port}`);
    console.log(`Swagger disponible en http://localhost:${env.port}/api-docs`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar la API:', error.message);
  process.exit(1);
});
