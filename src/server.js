import { createServer } from 'node:http';
import { app } from './app.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';
import { attachSoapService } from './soap/credit.soap.js';

async function start() {
  await pool.query('SELECT 1');
  const server = createServer(app);
  await attachSoapService(server);
  server.listen(env.port, () => {
    console.log(`API disponible en http://localhost:${env.port}`);
    console.log(`Swagger disponible en http://localhost:${env.port}/api-docs`);
    console.log(`SOAP disponible en http://localhost:${env.port}/soap/creditos`);
    console.log(`WSDL disponible en http://localhost:${env.port}/soap/creditos?wsdl`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar la API:', error.message);
  process.exit(1);
});
