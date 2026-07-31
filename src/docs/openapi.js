const identificationParameter = {
  name: 'identificacion',
  in: 'path',
  required: true,
  description: 'Numero de identificacion nacional',
  schema: { type: 'string', example: '001-1234567-8' },
};

const formatParameter = {
  name: 'format',
  in: 'query',
  required: false,
  description: 'Formato opcional de respuesta',
  schema: { type: 'string', enum: ['json', 'xml'] },
};

const protectedResponses = {
  400: { description: 'Identificacion invalida' },
  401: { description: 'API token ausente, invalido o inactivo' },
  404: { description: 'Ciudadano no encontrado' },
};

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Sistema Nacional de Informacion Crediticia',
    version: '1.0.0',
    description: 'API academica para consultar indicadores crediticios de ciudadanos autorizados.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
  tags: [
    { name: 'Autenticacion' },
    { name: 'Ciudadanos' },
  ],
  paths: {
    '/api/v1/auth/login': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Autenticar una institucion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Login' },
            },
          },
        },
        responses: {
          200: {
            description: 'Autenticacion correcta',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Token' } },
            },
          },
          400: { description: 'Datos incompletos' },
          401: { description: 'Credenciales incorrectas' },
        },
      },
    },
    '/api/v1/auth/api-token': {
      post: {
        tags: ['Autenticacion'],
        summary: 'Crear un API token usando el token de sesion',
        description: 'El token de sesion obtenido en el login solo puede utilizarse en este endpoint.',
        security: [{ sessionBearer: [] }],
        responses: {
          201: {
            description: 'API token creado. Su valor se muestra una sola vez.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiToken' } },
            },
          },
          401: { description: 'Token de sesion ausente, invalido o expirado' },
        },
      },
    },
    '/api/v1/ciudadanos/{identificacion}/historial-crediticio': {
      get: {
        tags: ['Ciudadanos'],
        summary: 'Consultar historial crediticio completo',
        security: [{ apiTokenBearer: [] }],
        parameters: [identificationParameter, formatParameter],
        responses: {
          200: {
            description: 'Historial encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Historial' } },
              'application/xml': { schema: { $ref: '#/components/schemas/Historial' } },
            },
          },
          ...protectedResponses,
        },
      },
    },
    '/api/v1/ciudadanos/{identificacion}/score': {
      get: {
        tags: ['Ciudadanos'],
        summary: 'Consultar puntuacion y clasificacion',
        security: [{ apiTokenBearer: [] }],
        parameters: [identificationParameter, formatParameter],
        responses: {
          200: {
            description: 'Score encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Score' } },
              'application/xml': { schema: { $ref: '#/components/schemas/Score' } },
            },
          },
          ...protectedResponses,
        },
      },
    },
    '/api/v1/ciudadanos/{identificacion}/endeudamiento': {
      get: {
        tags: ['Ciudadanos'],
        summary: 'Consultar nivel de endeudamiento',
        security: [{ apiTokenBearer: [] }],
        parameters: [identificationParameter, formatParameter],
        responses: {
          200: {
            description: 'Endeudamiento encontrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Endeudamiento' } },
              'application/xml': { schema: { $ref: '#/components/schemas/Endeudamiento' } },
            },
          },
          ...protectedResponses,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionBearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT temporal obtenido mediante el login. Solo permite crear API tokens.',
      },
      apiTokenBearer: {
        type: 'http',
        scheme: 'bearer',
        description: 'API token con prefijo snic_ utilizado para consultar ciudadanos.',
      },
    },
    schemas: {
      Login: {
        type: 'object',
        required: ['usuario', 'password'],
        properties: {
          usuario: { type: 'string', example: 'banco.demo' },
          password: { type: 'string', format: 'password', example: 'Banco123*' },
        },
      },
      Token: {
        type: 'object',
        properties: {
          tokenSesion: { type: 'string' },
          tipo: { type: 'string', example: 'Bearer' },
          expiraEn: { type: 'string', example: '1h' },
          institucion: { type: 'string', example: 'Banco Universitario' },
          rol: { type: 'string', example: 'Administrador' },
          siguientePaso: { type: 'string' },
        },
      },
      ApiToken: {
        type: 'object',
        properties: {
          apiToken: { type: 'string', example: 'snic_abc123...' },
          tipo: { type: 'string', example: 'Bearer' },
          mensaje: { type: 'string' },
        },
      },
      Historial: {
        type: 'object',
        xml: { name: 'historialCrediticio' },
        properties: {
          identificacion: { type: 'string', example: '001-1234567-8' },
          poseeHistorial: { type: 'boolean', example: true },
          scoreCrediticio: { type: 'integer', nullable: true, example: 780 },
          prestamosActivos: { type: 'integer', example: 2 },
          tarjetasCredito: { type: 'integer', example: 1 },
          porcentajeEndeudamiento: { type: 'number', format: 'float', nullable: true, example: 38.5 },
          nivelEndeudamiento: { type: 'string', example: 'Medio' },
          poseeMoraActual: { type: 'boolean', example: false },
          estadoGeneral: { type: 'string', example: 'Excelente' },
        },
      },
      Score: {
        type: 'object',
        properties: {
          identificacion: { type: 'string' },
          poseeHistorial: { type: 'boolean' },
          scoreCrediticio: { type: 'integer', nullable: true },
          estadoGeneral: { type: 'string' },
        },
      },
      Endeudamiento: {
        type: 'object',
        properties: {
          identificacion: { type: 'string' },
          prestamosActivos: { type: 'integer' },
          tarjetasCredito: { type: 'integer' },
          porcentajeEndeudamiento: { type: 'number', format: 'float', nullable: true },
          nivelEndeudamiento: { type: 'string' },
          poseeMoraActual: { type: 'boolean' },
        },
      },
    },
  },
};
