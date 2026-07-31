import { pool } from '../config/database.js';

export async function saveApiToken(userId, tokenHash) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO api_tokens (usuario_id, token_hash)
       VALUES ($1, $2)
       RETURNING id`,
      [userId, tokenHash],
    );
    await client.query(
      `INSERT INTO bitacora_auditoria
         (usuario_id, tabla_afectada, registro_id, accion, datos_nuevos)
       VALUES ($1, 'api_tokens', $2, 'CREAR', $3)`,
      [userId, String(rows[0].id), { activo: true }],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function findUserByApiToken(tokenHash) {
  const { rows } = await pool.query(
    `UPDATE api_tokens t
     SET last_used_at = NOW()
     FROM usuarios_institucion u
     JOIN instituciones i ON i.id = u.institucion_id
     JOIN tipos_institucion ti ON ti.id = i.tipo_institucion_id
     WHERE t.usuario_id = u.id
       AND t.token_hash = $1
       AND t.activo = TRUE
       AND u.es_activo = TRUE
       AND i.activa = TRUE
     RETURNING u.id AS usuario_id,
               i.id AS institucion_id,
               i.nombre AS institucion_nombre,
               ti.nombre AS tipo_institucion`,
    [tokenHash],
  );

  return rows[0] || null;
}
