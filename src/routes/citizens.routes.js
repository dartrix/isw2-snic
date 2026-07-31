import { Router } from 'express';
import {
  debtController,
  historyController,
  scoreController,
} from '../controllers/credit.controller.js';
import { authenticateApiToken } from '../middlewares/auth.middleware.js';
import { validateIdentification } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const citizensRouter = Router();

citizensRouter.use(authenticateApiToken);
citizensRouter.use('/:identificacion', validateIdentification);
citizensRouter.get('/:identificacion/historial-crediticio', asyncHandler(historyController));
citizensRouter.get('/:identificacion/score', asyncHandler(scoreController));
citizensRouter.get('/:identificacion/endeudamiento', asyncHandler(debtController));
