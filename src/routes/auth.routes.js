import { Router } from 'express';
import { createApiTokenController, loginController } from '../controllers/auth.controller.js';
import { authenticateSession } from '../middlewares/auth.middleware.js';
import { validateLogin } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post('/login', validateLogin, asyncHandler(loginController));
authRouter.post('/api-token', authenticateSession, asyncHandler(createApiTokenController));
