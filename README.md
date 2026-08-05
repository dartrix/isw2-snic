# Sistema Nacional de Informacion Crediticia

Proyecto universitario que simula un servicio centralizado para consultar el historial crediticio de ciudadanos. Los servicios REST y SOAP estan construidos con Node.js, Express y PostgreSQL.

## Funcionalidades

- Login institucional mediante JWT de sesion.
- Creacion de API tokens para realizar las consultas.
- Consulta del historial crediticio completo.
- Consulta separada del score y del endeudamiento.
- Respuestas en JSON y XML.
- Documentacion interactiva con Swagger/OpenAPI.
- Servicio SOAP con contrato WSDL y tres operaciones crediticias.
- Registro de las consultas realizadas por cada institucion.
- Auditoria de creacion de API tokens por usuario institucional.
- Base de datos PostgreSQL con datos de demostracion.

## Arquitectura

El codigo sigue una separacion sencilla de responsabilidades:

```text
src/
|-- config/          Configuracion y conexion a PostgreSQL
|-- controllers/     Entrada y salida HTTP
|-- docs/            Especificacion OpenAPI
|-- middlewares/     JWT, validaciones y errores
|-- repositories/    Consultas SQL
|-- routes/          Rutas versionadas
|-- services/        Logica del negocio
`-- utils/           Funciones compartidas
```

## Modelo de datos

El modelo relacional contiene las 12 entidades del diagrama academico:

`tipos_institucion`, `instituciones`, `roles`, `usuarios_institucion`, `ciudadanos`, `historiales_crediticios`, `prestamos`, `pagos_prestamo`, `tarjetas_credito`, `incidencias_crediticias`, `consultas_realizadas` y `bitacora_auditoria`.

Se agrega `api_tokens` como tabla tecnica necesaria para crear, validar y revocar tokens sin guardar su valor original. Cada consulta queda relacionada con la institucion, el usuario que creo el token y el ciudadano consultado.

## Inicio rapido con Docker

Se requiere Docker Desktop. Desde la raiz del proyecto ejecutar:

```bash
docker compose up --build
```

Servicios disponibles:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`
- SOAP: `http://localhost:3000/soap/creditos`
- WSDL: `http://localhost:3000/soap/creditos?wsdl`
- PostgreSQL: `localhost:5432`

Para detener el sistema:

```bash
docker compose down
```

Para borrar la base de datos y volver a cargar los datos iniciales:

```bash
docker compose down -v
docker compose up --build
```

## Ejecucion local

Iniciar solamente PostgreSQL y luego ejecutar la API con Node.js:

```bash
docker compose up -d postgres
cp .env.example .env
npm install
npm run dev
```

## Credenciales de prueba

| Institucion | Usuario | Clave |
| --- | --- | --- |
| Banco Universitario | `banco.demo` | `Banco123*` |
| Cooperativa Central | `cooperativa.demo` | `Banco123*` |

## Ciudadanos de prueba

| Identificacion | Resultado esperado |
| --- | --- |
| `001-1234567-8` | Score 780, historial Excelente |
| `002-7654321-1` | Score 610, historial Regular |
| `003-1111111-2` | Ciudadano registrado sin historial |

## Uso del API

### 1. Obtener un token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"banco.demo","password":"Banco123*"}'
```

La respuesta contiene `tokenSesion`. Este JWT no permite consultar ciudadanos; solamente permite crear un API token.

### 2. Crear un API token

```bash
curl -X POST http://localhost:3000/api/v1/auth/api-token \
  -H "Authorization: Bearer TOKEN_SESION"
```

La respuesta contiene `apiToken`. Debe guardarse porque su valor completo se entrega una sola vez.

### 3. Consultar el historial en JSON

```bash
curl http://localhost:3000/api/v1/ciudadanos/001-1234567-8/historial-crediticio \
  -H "Authorization: Bearer API_TOKEN" \
  -H "Accept: application/json"
```

El JWT del login no funciona en los endpoints de ciudadanos. Es obligatorio utilizar el API token generado en el paso anterior.

### 4. Consultar el historial en XML

```bash
curl "http://localhost:3000/api/v1/ciudadanos/001-1234567-8/historial-crediticio?format=xml" \
  -H "Authorization: Bearer API_TOKEN"
```

Tambien se puede solicitar XML con el encabezado `Accept: application/xml`.

## Endpoints

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | Autentica una institucion |
| POST | `/api/v1/auth/api-token` | Crea un API token usando el JWT de sesion |
| GET | `/api/v1/ciudadanos/:identificacion/historial-crediticio` | Devuelve todos los indicadores |
| GET | `/api/v1/ciudadanos/:identificacion/score` | Devuelve score y clasificacion |
| GET | `/api/v1/ciudadanos/:identificacion/endeudamiento` | Devuelve prestamos, tarjetas y endeudamiento |
| GET | `/health` | Comprueba que la API esta activa |

## Clasificacion crediticia

| Score | Estado |
| --- | --- |
| 750 a 850 | Excelente |
| 650 a 749 | Bueno |
| 550 a 649 | Regular |
| Menos de 550 | Riesgoso |

## Pruebas

```bash
npm test
```

## Servicio SOAP

El servicio publica `ConsultarHistorial`, `ConsultarScore` y `ConsultarEndeudamiento`. El cliente de demostracion obtiene automaticamente un API token y muestra los mensajes XML intercambiados:

```bash
npm run soap:client -- ConsultarHistorial 001-1234567-8
```

La guia completa para ejecutar el servicio, tomar las siete capturas y redactar la comparacion se encuentra en [`docs/INFORME-SOAP.md`](docs/INFORME-SOAP.md).
