import { createHash, randomBytes } from 'node:crypto';
import { saveApiToken } from '../repositories/apiToken.repository.js';

export function hashApiToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createApiToken(userId) {
  const apiToken = `snic_${randomBytes(32).toString('hex')}`;
  await saveApiToken(userId, hashApiToken(apiToken));

  return {
    apiToken,
    tipo: 'Bearer',
    mensaje: 'Guarde este token; no podra volver a consultarlo.',
  };
}
