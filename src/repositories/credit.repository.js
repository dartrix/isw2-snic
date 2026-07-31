import { pool } from '../config/database.js';

export async function findCreditProfile(identification) {
  const { rows } = await pool.query(
    `SELECT c.id,
            c.identificacion,
            h.id IS NOT NULL AS posee_historial,
            h.score_crediticio,
            h.porcentaje_endeudamiento,
            h.posee_mora_actual,
            h.estado_general,
            COALESCE(p.prestamos_activos, 0)::INTEGER AS prestamos_activos,
            COALESCE(t.tarjetas_credito, 0)::INTEGER AS tarjetas_credito
     FROM ciudadanos c
     LEFT JOIN historiales_crediticios h ON h.ciudadano_id = c.id
     LEFT JOIN (
       SELECT ciudadano_id, COUNT(*) AS prestamos_activos
       FROM prestamos
       WHERE estado IN ('Activo', 'Atrasado')
       GROUP BY ciudadano_id
     ) p ON p.ciudadano_id = c.id
     LEFT JOIN (
       SELECT ciudadano_id, COUNT(*) AS tarjetas_credito
       FROM tarjetas_credito
       WHERE activa = TRUE
       GROUP BY ciudadano_id
     ) t ON t.ciudadano_id = c.id
     WHERE c.identificacion = $1`,
    [identification],
  );

  return rows[0] || null;
}

export async function registerQuery({
  institutionId,
  userId,
  citizenId,
  identification,
  endpoint,
  responseFormat,
  ipAddress,
}) {
  await pool.query(
    `INSERT INTO consultas_realizadas
       (institucion_id, usuario_id, ciudadano_id, identificacion_consultada,
        endpoint, formato_respuesta, codigo_http, direccion_ip)
     VALUES ($1, $2, $3, $4, $5, $6, 200, $7)`,
    [institutionId, userId, citizenId, identification, endpoint, responseFormat, ipAddress],
  );
}
