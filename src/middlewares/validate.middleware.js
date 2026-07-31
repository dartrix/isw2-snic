import { AppError } from '../utils/appError.js';

const identificationPattern = /^\d{3}-\d{7}-\d$/;

export function validateLogin(req, _res, next) {
  const { usuario, password } = req.body;

  if (typeof usuario !== 'string' || !usuario.trim() || typeof password !== 'string' || !password) {
    return next(new AppError('Los campos usuario y password son obligatorios', 400));
  }

  return next();
}

export function validateIdentification(req, _res, next) {
  if (!identificationPattern.test(req.params.identificacion)) {
    return next(new AppError('La identificacion debe tener el formato 000-0000000-0', 400));
  }

  return next();
}
