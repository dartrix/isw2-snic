import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'informacion_crediticia',
  },
  jwtSecret: process.env.JWT_SECRET || 'clave-secreta-para-desarrollo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};
