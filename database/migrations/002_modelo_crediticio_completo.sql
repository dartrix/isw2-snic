BEGIN;

CREATE TABLE tipos_institucion (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(60) UNIQUE NOT NULL,
  descripcion VARCHAR(250)
);

INSERT INTO tipos_institucion (nombre, descripcion) VALUES
  ('Banco', 'Entidad bancaria autorizada'),
  ('Cooperativa', 'Cooperativa de ahorro y credito'),
  ('Financiera', 'Empresa de servicios financieros'),
  ('Aseguradora', 'Empresa aseguradora autorizada'),
  ('Gubernamental', 'Institucion del Estado');

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(250)
);

INSERT INTO roles (nombre, descripcion) VALUES
  ('Administrador', 'Administra usuarios y API tokens de su institucion'),
  ('Consultor', 'Puede generar API tokens y realizar consultas crediticias'),
  ('Auditor', 'Puede revisar consultas y bitacoras');

ALTER TABLE instituciones
  ADD COLUMN tipo_institucion_id INTEGER REFERENCES tipos_institucion(id),
  ADD COLUMN nit VARCHAR(20),
  ADD COLUMN correo VARCHAR(120),
  ADD COLUMN telefono VARCHAR(20),
  ADD COLUMN direccion VARCHAR(250);

UPDATE instituciones i
SET tipo_institucion_id = t.id,
    nit = CONCAT('MIG-', i.id)
FROM tipos_institucion t
WHERE t.nombre = i.tipo;

ALTER TABLE instituciones
  ALTER COLUMN tipo_institucion_id SET NOT NULL,
  ALTER COLUMN nit SET NOT NULL;

ALTER TABLE instituciones ADD CONSTRAINT instituciones_nit_key UNIQUE (nit);

INSERT INTO instituciones (tipo, usuario, password_hash, tipo_institucion_id, nit, nombre, correo)
SELECT v.tipo, CONCAT('migrado.', v.id), 'SIN-ACCESO', v.tipo_id, v.nit, v.nombre, v.correo
FROM (VALUES
  (3, 'Banco', 1, '1-01-30003-3', 'Banco Nacional', 'info@banconacional.test'),
  (4, 'Financiera', 3, '1-03-40004-4', 'Financiera del Caribe', 'info@financieracaribe.test'),
  (5, 'Banco', 1, '1-01-50005-5', 'Banco Metropolitano', 'info@metropolitano.test')
) AS v(id, tipo, tipo_id, nit, nombre, correo)
WHERE NOT EXISTS (SELECT 1 FROM instituciones i WHERE i.nombre = v.nombre);

CREATE TABLE usuarios_institucion (
  id SERIAL PRIMARY KEY,
  institucion_id INTEGER NOT NULL REFERENCES instituciones(id),
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  nombre_completo VARCHAR(120) NOT NULL,
  nombre_usuario VARCHAR(60) UNIQUE NOT NULL,
  correo VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  es_activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO usuarios_institucion
  (institucion_id, rol_id, nombre_completo, nombre_usuario, correo, password_hash, es_activo)
SELECT id, 1, CONCAT('Usuario de ', nombre), usuario,
       CONCAT(usuario, '@migrado.test'), password_hash, activa
FROM instituciones
WHERE password_hash <> 'SIN-ACCESO';

ALTER TABLE api_tokens ADD COLUMN usuario_id INTEGER REFERENCES usuarios_institucion(id);
UPDATE api_tokens t
SET usuario_id = (
  SELECT u.id FROM usuarios_institucion u
  WHERE u.institucion_id = t.institucion_id
  ORDER BY u.id LIMIT 1
);
ALTER TABLE api_tokens ALTER COLUMN usuario_id SET NOT NULL;

ALTER TABLE ciudadanos
  ADD COLUMN fecha_nacimiento DATE,
  ADD COLUMN correo VARCHAR(120),
  ADD COLUMN telefono VARCHAR(20);

ALTER TABLE historiales_crediticios
  ADD COLUMN porcentaje_endeudamiento NUMERIC(5, 2),
  ADD COLUMN posee_mora_actual BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN estado_general VARCHAR(15);

UPDATE historiales_crediticios
SET porcentaje_endeudamiento = CASE nivel_endeudamiento WHEN 'Bajo' THEN 25 WHEN 'Medio' THEN 50 ELSE 75 END,
    posee_mora_actual = nivel_endeudamiento = 'Alto',
    estado_general = CASE
      WHEN score_crediticio >= 750 THEN 'Excelente'
      WHEN score_crediticio >= 650 THEN 'Bueno'
      WHEN score_crediticio >= 550 THEN 'Regular'
      ELSE 'Riesgoso'
    END;

ALTER TABLE historiales_crediticios
  ALTER COLUMN porcentaje_endeudamiento SET NOT NULL,
  ALTER COLUMN estado_general SET NOT NULL;

ALTER TABLE prestamos
  ADD COLUMN institucion_id INTEGER REFERENCES instituciones(id),
  ADD COLUMN numero_prestamo VARCHAR(40),
  ADD COLUMN tipo_prestamo VARCHAR(50),
  ADD COLUMN monto_original NUMERIC(14, 2),
  ADD COLUMN saldo_pendiente NUMERIC(14, 2),
  ADD COLUMN cuota_mensual NUMERIC(12, 2),
  ADD COLUMN tasa_interes NUMERIC(5, 2),
  ADD COLUMN fecha_apertura DATE,
  ADD COLUMN fecha_vencimiento DATE;

UPDATE prestamos p
SET institucion_id = i.id,
    numero_prestamo = CONCAT('MIG-PRE-', p.id),
    tipo_prestamo = 'Personal',
    monto_original = p.monto,
    saldo_pendiente = CASE WHEN p.estado = 'Pagado' THEN 0 ELSE p.monto END,
    cuota_mensual = CASE WHEN p.estado = 'Pagado' THEN 0 ELSE ROUND(p.monto / 24, 2) END,
    tasa_interes = 12,
    fecha_apertura = CURRENT_DATE
FROM instituciones i
WHERE i.nombre = p.institucion;

ALTER TABLE prestamos
  ALTER COLUMN institucion_id SET NOT NULL,
  ALTER COLUMN numero_prestamo SET NOT NULL,
  ALTER COLUMN tipo_prestamo SET NOT NULL,
  ALTER COLUMN monto_original SET NOT NULL,
  ALTER COLUMN saldo_pendiente SET NOT NULL,
  ALTER COLUMN cuota_mensual SET NOT NULL,
  ALTER COLUMN tasa_interes SET NOT NULL,
  ALTER COLUMN fecha_apertura SET NOT NULL;

ALTER TABLE prestamos ADD CONSTRAINT prestamos_numero_key UNIQUE (numero_prestamo);

CREATE TABLE pagos_prestamo (
  id BIGSERIAL PRIMARY KEY,
  prestamo_id INTEGER NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  fecha_pago DATE NOT NULL,
  monto_pagado NUMERIC(12, 2) NOT NULL CHECK (monto_pagado > 0),
  dias_atraso INTEGER NOT NULL DEFAULT 0 CHECK (dias_atraso >= 0),
  referencia VARCHAR(60)
);

ALTER TABLE tarjetas_credito
  ADD COLUMN institucion_id INTEGER REFERENCES instituciones(id),
  ADD COLUMN numero_enmascarado VARCHAR(25),
  ADD COLUMN ultimos_cuatro CHAR(4),
  ADD COLUMN saldo_actual NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN fecha_apertura DATE,
  ADD COLUMN fecha_vencimiento DATE;

UPDATE tarjetas_credito t
SET institucion_id = i.id,
    numero_enmascarado = CONCAT('****-****-****-', LPAD(t.id::TEXT, 4, '0')),
    ultimos_cuatro = LPAD(t.id::TEXT, 4, '0'),
    fecha_apertura = CURRENT_DATE
FROM instituciones i
WHERE i.nombre = t.emisor;

ALTER TABLE tarjetas_credito
  ALTER COLUMN institucion_id SET NOT NULL,
  ALTER COLUMN numero_enmascarado SET NOT NULL,
  ALTER COLUMN ultimos_cuatro SET NOT NULL,
  ALTER COLUMN fecha_apertura SET NOT NULL;

CREATE TABLE incidencias_crediticias (
  id BIGSERIAL PRIMARY KEY,
  ciudadano_id INTEGER NOT NULL REFERENCES ciudadanos(id) ON DELETE CASCADE,
  institucion_id INTEGER NOT NULL REFERENCES instituciones(id),
  tipo_incidencia VARCHAR(60) NOT NULL,
  descripcion VARCHAR(500),
  monto_relacionado NUMERIC(12, 2),
  fecha_incidencia DATE NOT NULL,
  resuelta BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE consultas RENAME TO consultas_realizadas;
ALTER TABLE consultas_realizadas
  ADD COLUMN usuario_id INTEGER REFERENCES usuarios_institucion(id),
  ADD COLUMN identificacion_consultada VARCHAR(20),
  ADD COLUMN endpoint VARCHAR(100),
  ADD COLUMN formato_respuesta VARCHAR(10),
  ADD COLUMN codigo_http INTEGER,
  ADD COLUMN direccion_ip VARCHAR(45),
  ADD COLUMN fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE consultas_realizadas c
SET usuario_id = (SELECT u.id FROM usuarios_institucion u WHERE u.institucion_id = c.institucion_id ORDER BY u.id LIMIT 1),
    identificacion_consultada = (SELECT ci.identificacion FROM ciudadanos ci WHERE ci.id = c.ciudadano_id),
    endpoint = c.recurso,
    formato_respuesta = 'JSON',
    codigo_http = 200,
    fecha_consulta = c.fecha;

ALTER TABLE consultas_realizadas
  ALTER COLUMN usuario_id SET NOT NULL,
  ALTER COLUMN identificacion_consultada SET NOT NULL,
  ALTER COLUMN endpoint SET NOT NULL,
  ALTER COLUMN formato_respuesta SET NOT NULL,
  ALTER COLUMN codigo_http SET NOT NULL;

CREATE TABLE bitacora_auditoria (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios_institucion(id),
  tabla_afectada VARCHAR(80) NOT NULL,
  registro_id VARCHAR(50),
  accion VARCHAR(20) NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagos_prestamo ON pagos_prestamo(prestamo_id);
CREATE INDEX idx_incidencias_ciudadano ON incidencias_crediticias(ciudadano_id);
CREATE INDEX idx_api_tokens_usuario ON api_tokens(usuario_id);
CREATE INDEX idx_bitacora_usuario ON bitacora_auditoria(usuario_id);

COMMIT;
