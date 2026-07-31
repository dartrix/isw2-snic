CREATE TABLE tipos_institucion (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(60) UNIQUE NOT NULL,
  descripcion VARCHAR(250)
);

CREATE TABLE instituciones (
  id SERIAL PRIMARY KEY,
  tipo_institucion_id INTEGER NOT NULL REFERENCES tipos_institucion(id),
  nit VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(120),
  telefono VARCHAR(20),
  direccion VARCHAR(250),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(250)
);

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

CREATE TABLE ciudadanos (
  id SERIAL PRIMARY KEY,
  identificacion VARCHAR(20) UNIQUE NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  correo VARCHAR(120),
  telefono VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE historiales_crediticios (
  id SERIAL PRIMARY KEY,
  ciudadano_id INTEGER UNIQUE NOT NULL REFERENCES ciudadanos(id) ON DELETE CASCADE,
  score_crediticio INTEGER NOT NULL CHECK (score_crediticio BETWEEN 300 AND 850),
  porcentaje_endeudamiento NUMERIC(5, 2) NOT NULL CHECK (porcentaje_endeudamiento BETWEEN 0 AND 100),
  posee_mora_actual BOOLEAN NOT NULL DEFAULT FALSE,
  estado_general VARCHAR(15) NOT NULL CHECK (estado_general IN ('Excelente', 'Bueno', 'Regular', 'Riesgoso')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prestamos (
  id SERIAL PRIMARY KEY,
  ciudadano_id INTEGER NOT NULL REFERENCES ciudadanos(id) ON DELETE CASCADE,
  institucion_id INTEGER NOT NULL REFERENCES instituciones(id),
  numero_prestamo VARCHAR(40) UNIQUE NOT NULL,
  tipo_prestamo VARCHAR(50) NOT NULL,
  monto_original NUMERIC(14, 2) NOT NULL CHECK (monto_original >= 0),
  saldo_pendiente NUMERIC(14, 2) NOT NULL CHECK (saldo_pendiente >= 0),
  cuota_mensual NUMERIC(12, 2) NOT NULL CHECK (cuota_mensual >= 0),
  tasa_interes NUMERIC(5, 2) NOT NULL CHECK (tasa_interes >= 0),
  fecha_apertura DATE NOT NULL,
  fecha_vencimiento DATE,
  estado VARCHAR(15) NOT NULL CHECK (estado IN ('Activo', 'Pagado', 'Atrasado'))
);

CREATE TABLE pagos_prestamo (
  id BIGSERIAL PRIMARY KEY,
  prestamo_id INTEGER NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
  fecha_pago DATE NOT NULL,
  monto_pagado NUMERIC(12, 2) NOT NULL CHECK (monto_pagado > 0),
  dias_atraso INTEGER NOT NULL DEFAULT 0 CHECK (dias_atraso >= 0),
  referencia VARCHAR(60)
);

CREATE TABLE tarjetas_credito (
  id SERIAL PRIMARY KEY,
  ciudadano_id INTEGER NOT NULL REFERENCES ciudadanos(id) ON DELETE CASCADE,
  institucion_id INTEGER NOT NULL REFERENCES instituciones(id),
  numero_enmascarado VARCHAR(25) NOT NULL,
  ultimos_cuatro CHAR(4) NOT NULL,
  saldo_actual NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (saldo_actual >= 0),
  limite_credito NUMERIC(12, 2) NOT NULL CHECK (limite_credito >= 0),
  fecha_apertura DATE NOT NULL,
  fecha_vencimiento DATE,
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE incidencias_crediticias (
  id BIGSERIAL PRIMARY KEY,
  ciudadano_id INTEGER NOT NULL REFERENCES ciudadanos(id) ON DELETE CASCADE,
  institucion_id INTEGER NOT NULL REFERENCES instituciones(id),
  tipo_incidencia VARCHAR(60) NOT NULL,
  descripcion VARCHAR(500),
  monto_relacionado NUMERIC(12, 2) CHECK (monto_relacionado >= 0),
  fecha_incidencia DATE NOT NULL,
  resuelta BOOLEAN NOT NULL DEFAULT FALSE
);

-- Tabla tecnica adicional: permite revocar claves sin almacenar su valor original.
CREATE TABLE api_tokens (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios_institucion(id) ON DELETE CASCADE,
  token_hash CHAR(64) UNIQUE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE consultas_realizadas (
  id BIGSERIAL PRIMARY KEY,
  institucion_id INTEGER NOT NULL REFERENCES instituciones(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios_institucion(id),
  ciudadano_id INTEGER NOT NULL REFERENCES ciudadanos(id),
  identificacion_consultada VARCHAR(20) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  formato_respuesta VARCHAR(10) NOT NULL CHECK (formato_respuesta IN ('JSON', 'XML')),
  codigo_http INTEGER NOT NULL,
  direccion_ip VARCHAR(45),
  fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX idx_prestamos_ciudadano ON prestamos(ciudadano_id);
CREATE INDEX idx_pagos_prestamo ON pagos_prestamo(prestamo_id);
CREATE INDEX idx_tarjetas_ciudadano ON tarjetas_credito(ciudadano_id);
CREATE INDEX idx_incidencias_ciudadano ON incidencias_crediticias(ciudadano_id);
CREATE INDEX idx_api_tokens_usuario ON api_tokens(usuario_id);
CREATE INDEX idx_consultas_institucion ON consultas_realizadas(institucion_id);
CREATE INDEX idx_bitacora_usuario ON bitacora_auditoria(usuario_id);

INSERT INTO tipos_institucion (nombre, descripcion) VALUES
  ('Banco', 'Entidad bancaria autorizada'),
  ('Cooperativa', 'Cooperativa de ahorro y credito'),
  ('Financiera', 'Empresa de servicios financieros'),
  ('Aseguradora', 'Empresa aseguradora autorizada'),
  ('Gubernamental', 'Institucion del Estado');

INSERT INTO instituciones (tipo_institucion_id, nit, nombre, correo, telefono, direccion) VALUES
  (1, '1-01-10001-1', 'Banco Universitario', 'info@bancouniversitario.test', '809-555-1001', 'Santo Domingo'),
  (2, '1-02-20002-2', 'Cooperativa Central', 'info@cooperativacentral.test', '809-555-2002', 'Santiago'),
  (1, '1-01-30003-3', 'Banco Nacional', 'info@banconacional.test', '809-555-3003', 'Santo Domingo'),
  (3, '1-03-40004-4', 'Financiera del Caribe', 'info@financieracaribe.test', '809-555-4004', 'La Romana'),
  (1, '1-01-50005-5', 'Banco Metropolitano', 'info@metropolitano.test', '809-555-5005', 'Santo Domingo');

INSERT INTO roles (nombre, descripcion) VALUES
  ('Administrador', 'Administra usuarios y API tokens de su institucion'),
  ('Consultor', 'Puede generar API tokens y realizar consultas crediticias'),
  ('Auditor', 'Puede revisar consultas y bitacoras');

-- La clave de demostracion para ambos usuarios es Banco123*.
INSERT INTO usuarios_institucion
  (institucion_id, rol_id, nombre_completo, nombre_usuario, correo, password_hash)
VALUES
  (1, 1, 'Administrador Banco Universitario', 'banco.demo', 'admin@bancouniversitario.test', '$2b$10$2MK.aN1XJJO1aeBGIFKRu.0hpWCzHOHhCibOxEY9llX6nekCtr4k2'),
  (2, 2, 'Consultor Cooperativa Central', 'cooperativa.demo', 'consultas@cooperativacentral.test', '$2b$10$2MK.aN1XJJO1aeBGIFKRu.0hpWCzHOHhCibOxEY9llX6nekCtr4k2');

INSERT INTO ciudadanos (identificacion, nombres, apellidos, fecha_nacimiento, correo, telefono) VALUES
  ('001-1234567-8', 'Maria', 'Rodriguez', '1988-04-12', 'maria@example.test', '809-555-0101'),
  ('002-7654321-1', 'Juan', 'Perez', '1991-09-23', 'juan@example.test', '809-555-0102'),
  ('003-1111111-2', 'Ana', 'Gomez', '1997-01-08', 'ana@example.test', '809-555-0103');

INSERT INTO historiales_crediticios
  (ciudadano_id, score_crediticio, porcentaje_endeudamiento, posee_mora_actual, estado_general)
VALUES
  (1, 780, 38.50, FALSE, 'Excelente'),
  (2, 610, 72.30, TRUE, 'Regular');

INSERT INTO prestamos
  (ciudadano_id, institucion_id, numero_prestamo, tipo_prestamo, monto_original, saldo_pendiente, cuota_mensual, tasa_interes, fecha_apertura, fecha_vencimiento, estado)
VALUES
  (1, 3, 'PRE-2024-0001', 'Hipotecario', 350000.00, 290000.00, 8500.00, 10.50, '2024-01-15', '2029-01-15', 'Activo'),
  (1, 2, 'PRE-2025-0002', 'Personal', 80000.00, 52000.00, 4200.00, 16.00, '2025-03-10', '2027-03-10', 'Activo'),
  (1, 3, 'PRE-2022-0003', 'Personal', 50000.00, 0.00, 0.00, 14.00, '2022-02-01', '2024-02-01', 'Pagado'),
  (2, 4, 'PRE-2025-0004', 'Vehiculo', 120000.00, 98000.00, 6500.00, 18.50, '2025-06-20', '2028-06-20', 'Atrasado');

INSERT INTO pagos_prestamo (prestamo_id, fecha_pago, monto_pagado, dias_atraso, referencia) VALUES
  (1, '2026-07-15', 8500.00, 0, 'PAG-0001'),
  (2, '2026-07-10', 4200.00, 0, 'PAG-0002'),
  (4, '2026-06-30', 6500.00, 18, 'PAG-0003');

INSERT INTO tarjetas_credito
  (ciudadano_id, institucion_id, numero_enmascarado, ultimos_cuatro, saldo_actual, limite_credito, fecha_apertura, fecha_vencimiento, activa)
VALUES
  (1, 3, '****-****-****-4582', '4582', 23000.00, 100000.00, '2023-05-12', '2028-05-31', TRUE),
  (2, 5, '****-****-****-9014', '9014', 39000.00, 45000.00, '2024-08-05', '2027-08-31', TRUE),
  (2, 3, '****-****-****-1120', '1120', 0.00, 25000.00, '2021-01-18', '2025-01-31', FALSE);

INSERT INTO incidencias_crediticias
  (ciudadano_id, institucion_id, tipo_incidencia, descripcion, monto_relacionado, fecha_incidencia)
VALUES
  (2, 4, 'Mora', 'Prestamo con cuota vencida', 6500.00, '2026-07-01');
