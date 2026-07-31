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
