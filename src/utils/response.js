function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toXml(data, root = 'historialCrediticio') {
  const fields = Object.entries(data)
    .map(([key, value]) => `  <${key}>${value === null ? '' : escapeXml(value)}</${key}>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n${fields}\n</${root}>`;
}

export function sendFormatted(req, res, data, root) {
  const wantsXml = getResponseFormat(req) === 'XML';

  if (wantsXml) {
    return res.type('application/xml').send(toXml(data, root));
  }

  return res.json(data);
}

export function getResponseFormat(req) {
  return req.query.format === 'xml' || req.accepts(['json', 'xml']) === 'xml' ? 'XML' : 'JSON';
}
