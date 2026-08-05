import { findCreditProfile, registerQuery } from '../repositories/credit.repository.js';
import { AppError } from '../utils/appError.js';
import { classifyDebt } from '../utils/credit.js';

export async function getCreditHistory(identification, queryContext) {
  const profile = await findCreditProfile(identification);

  if (!profile) {
    throw new AppError('Ciudadano no encontrado', 404);
  }

  await registerQuery({
    ...queryContext,
    citizenId: profile.id,
    identification: profile.identificacion,
  });

  const hasHistory = profile.posee_historial;
  return {
    identificacion: profile.identificacion,
    poseeHistorial: hasHistory,
    scoreCrediticio: hasHistory ? profile.score_crediticio : null,
    prestamosActivos: profile.prestamos_activos,
    tarjetasCredito: profile.tarjetas_credito,
    porcentajeEndeudamiento: hasHistory ? Number(profile.porcentaje_endeudamiento) : null,
    nivelEndeudamiento: hasHistory ? classifyDebt(Number(profile.porcentaje_endeudamiento)) : 'Sin historial',
    poseeMoraActual: hasHistory ? profile.posee_mora_actual : false,
    estadoGeneral: hasHistory ? profile.estado_general : 'Sin historial',
  };
}

export function selectScore(history) {
  return {
    identificacion: history.identificacion,
    poseeHistorial: history.poseeHistorial,
    scoreCrediticio: history.scoreCrediticio,
    estadoGeneral: history.estadoGeneral,
  };
}

export function selectDebt(history) {
  return {
    identificacion: history.identificacion,
    prestamosActivos: history.prestamosActivos,
    tarjetasCredito: history.tarjetasCredito,
    porcentajeEndeudamiento: history.porcentajeEndeudamiento,
    nivelEndeudamiento: history.nivelEndeudamiento,
    poseeMoraActual: history.poseeMoraActual,
  };
}
