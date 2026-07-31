BEGIN;

ALTER TABLE api_tokens DROP COLUMN institucion_id;
ALTER TABLE instituciones
  DROP COLUMN tipo,
  DROP COLUMN usuario,
  DROP COLUMN password_hash;
ALTER TABLE historiales_crediticios DROP COLUMN nivel_endeudamiento;
ALTER TABLE prestamos
  DROP COLUMN institucion,
  DROP COLUMN monto;
ALTER TABLE tarjetas_credito DROP COLUMN emisor;
ALTER TABLE consultas_realizadas
  DROP COLUMN recurso,
  DROP COLUMN fecha;

COMMIT;
