import { pool } from '../config/database.js';

export async function findUserByUsername(username) {
  const { rows } = await pool.query(
    `SELECT u.id AS usuario_id,
            u.institucion_id,
            u.nombre_usuario,
            u.password_hash,
            u.es_activo,
            i.nombre AS institucion_nombre,
            i.activa AS institucion_activa,
            t.nombre AS tipo_institucion,
            r.nombre AS rol
     FROM usuarios_institucion u
     JOIN instituciones i ON i.id = u.institucion_id
     JOIN tipos_institucion t ON t.id = i.tipo_institucion_id
     JOIN roles r ON r.id = u.rol_id
     WHERE u.nombre_usuario = $1`,
    [username],
  );

  return rows[0] || null;
}

export async function registerLastAccess(userId) {
  await pool.query(
    'UPDATE usuarios_institucion SET ultimo_acceso = NOW() WHERE id = $1',
    [userId],
  );
}
