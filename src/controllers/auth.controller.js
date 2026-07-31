import { login } from '../services/auth.service.js';
import { createApiToken } from '../services/apiToken.service.js';

export async function loginController(req, res) {
  const result = await login(req.body.usuario.trim(), req.body.password);
  res.json(result);
}

export async function createApiTokenController(req, res) {
  const result = await createApiToken(req.auth.userId);
  res.status(201).json(result);
}
