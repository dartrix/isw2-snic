import { readFile } from 'node:fs/promises';
import soap from 'soap';
import { findUserByApiToken } from '../repositories/apiToken.repository.js';
import { hashApiToken } from '../services/apiToken.service.js';
import {
  getCreditHistory,
  selectDebt,
  selectScore,
} from '../services/credit.service.js';
import { AppError } from '../utils/appError.js';

const identificationPattern = /^\d{3}-\d{7}-\d$/;
const wsdlPath = new URL('./credit.wsdl', import.meta.url);

function soapFault(error) {
  const isClientError = error instanceof AppError && error.statusCode < 500;

  if (!isClientError) {
    console.error('Error en el servicio SOAP:', error);
  }

  return {
    Fault: {
      faultcode: isClientError ? 'soap:Client' : 'soap:Server',
      faultstring: isClientError ? error.message : 'Error interno del servicio SOAP',
      detail: { codigoHttp: error.statusCode || 500 },
    },
  };
}

async function executeQuery(args, request, endpoint, projectResult) {
  if (!args?.apiToken) {
    throw new AppError('API token requerido', 401);
  }

  if (!identificationPattern.test(args.identificacion || '')) {
    throw new AppError('La identificacion debe tener el formato 000-0000000-0', 400);
  }

  const user = await findUserByApiToken(hashApiToken(args.apiToken));
  if (!user) {
    throw new AppError('API token invalido o inactivo', 401);
  }

  const history = await getCreditHistory(args.identificacion, {
    institutionId: user.institucion_id,
    userId: user.usuario_id,
    endpoint: `soap/${endpoint}`,
    responseFormat: 'XML',
    ipAddress: request?.socket?.remoteAddress || null,
  });

  return projectResult(history);
}

function operation(endpoint, projectResult) {
  return (args, callback, _headers, request) => {
    executeQuery(args, request, endpoint, projectResult)
      .then((result) => callback(null, result))
      .catch((error) => callback(soapFault(error)));
  };
}

export async function attachSoapService(httpServer) {
  const wsdl = await readFile(wsdlPath, 'utf8');
  const service = {
    CreditoService: {
      CreditoPort: {
        ConsultarHistorial: operation('historial-crediticio', (history) => history),
        ConsultarScore: operation('score', selectScore),
        ConsultarEndeudamiento: operation('endeudamiento', selectDebt),
      },
    },
  };

  return soap.listen(httpServer, '/soap/creditos', service, wsdl);
}
