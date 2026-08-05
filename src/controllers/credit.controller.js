import { getCreditHistory, selectDebt, selectScore } from '../services/credit.service.js';
import { getResponseFormat, sendFormatted } from '../utils/response.js';

function getQueryContext(req, endpoint) {
  return {
    institutionId: req.auth.institutionId,
    userId: req.auth.userId,
    endpoint,
    responseFormat: getResponseFormat(req),
    ipAddress: req.ip,
  };
}

export async function historyController(req, res) {
  const data = await getCreditHistory(
    req.params.identificacion,
    getQueryContext(req, 'historial-crediticio'),
  );
  sendFormatted(req, res, data, 'historialCrediticio');
}

export async function scoreController(req, res) {
  const history = await getCreditHistory(req.params.identificacion, getQueryContext(req, 'score'));
  const data = selectScore(history);
  sendFormatted(req, res, data, 'scoreCrediticio');
}

export async function debtController(req, res) {
  const history = await getCreditHistory(req.params.identificacion, getQueryContext(req, 'endeudamiento'));
  const data = selectDebt(history);
  sendFormatted(req, res, data, 'endeudamiento');
}
