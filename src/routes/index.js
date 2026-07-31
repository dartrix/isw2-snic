import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { citizensRouter } from './citizens.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/ciudadanos', citizensRouter);
