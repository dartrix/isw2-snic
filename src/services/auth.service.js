import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserByUsername, registerLastAccess } from '../repositories/institution.repository.js';
import { AppError } from '../utils/appError.js';

export async function login(username, password) {
  const user = await findUserByUsername(username);

  if (
    !user
    || !user.es_activo
    || !user.institucion_activa
    || !(await bcrypt.compare(password, user.password_hash))
  ) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  await registerLastAccess(user.usuario_id);

  const token = jwt.sign(
    {
      userId: user.usuario_id,
      institutionId: user.institucion_id,
      username: user.nombre_usuario,
      role: user.rol,
      tokenUse: 'session',
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn, subject: String(user.usuario_id) },
  );

  return {
    tokenSesion: token,
    tipo: 'Bearer',
    expiraEn: env.jwtExpiresIn,
    institucion: user.institucion_nombre,
    rol: user.rol,
    siguientePaso: 'Use este token en POST /api/v1/auth/api-token',
  };
}
