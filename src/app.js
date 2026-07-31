import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.get('/', (_req, res) => {
  res.json({
    servicio: 'Sistema Nacional de Informacion Crediticia',
    version: '1.0.0',
    documentacion: '/api-docs',
  });
});
app.get('/health', (_req, res) => res.json({ estado: 'ok' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorHandler);
