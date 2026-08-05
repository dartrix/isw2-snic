import soap from 'soap';

const apiBase = process.env.API_BASE_URL || 'http://localhost:3000';
const operation = process.argv[2] || 'ConsultarHistorial';
const identificacion = process.argv[3] || '001-1234567-8';
const validOperations = [
  'ConsultarHistorial',
  'ConsultarScore',
  'ConsultarEndeudamiento',
];

async function requestJson(path, options) {
  const response = await fetch(`${apiBase}${path}`, options);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.mensaje || `Solicitud HTTP fallida (${response.status})`);
  }

  return body;
}

async function getApiToken() {
  if (process.env.API_TOKEN) {
    return process.env.API_TOKEN;
  }

  const login = await requestJson('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: process.env.DEMO_USER || 'banco.demo',
      password: process.env.DEMO_PASSWORD || 'Banco123*',
    }),
  });
  const token = await requestJson('/api/v1/auth/api-token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${login.tokenSesion}` },
  });

  return token.apiToken;
}

async function main() {
  if (!validOperations.includes(operation)) {
    throw new Error(`Operacion invalida. Use: ${validOperations.join(', ')}`);
  }

  const apiToken = await getApiToken();
  const client = await soap.createClientAsync(`${apiBase}/soap/creditos?wsdl`);
  client.setEndpoint(`${apiBase}/soap/creditos`);
  client.on('request', (xml) => console.log('\nSOAP REQUEST\n', xml));
  client.on('response', (xml) => console.log('\nSOAP RESPONSE\n', xml));

  const [result] = await client[`${operation}Async`]({ apiToken, identificacion });
  console.log('\nRESULTADO INTERPRETADO\n', JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('Error del cliente SOAP:', error.message);
  process.exitCode = 1;
});
