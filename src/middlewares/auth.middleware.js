import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserByApiToken } from '../repositories/apiToken.repository.js';
import { hashApiToken } from '../services/apiToken.service.js';
import { AppError } from '../utils/appError.js';

function getBearerToken(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Token de acceso requerido', 401);
  }

  return token;
}

export function authenticateSession(req, _res, next) {
  let token;

  try {
    token = getBearerToken(req);
  } catch (error) {
    return next(error);
  }

  try {
    req.auth = jwt.verify(token, env.jwtSecret);

    if (req.auth.tokenUse !== 'session') {
      throw new Error('Tipo de token incorrecto');
    }

    return next();
  } catch {
    return next(new AppError('Token de sesion invalido o expirado', 401));
  }
}

export async function authenticateApiToken(req, _res, next) {
  try {
    const token = getBearerToken(req);
    const user = await findUserByApiToken(hashApiToken(token));

    if (!user) {
      throw new AppError('API token invalido o inactivo', 401);
    }

    req.auth = {
      userId: user.usuario_id,
      institutionId: user.institucion_id,
      institutionName: user.institucion_nombre,
      institutionType: user.tipo_institucion,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}
