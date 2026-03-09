// api/claude.js — Vercel serverless proxy for Anthropic Claude API
const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'anthropic-version': '2023-06-01',
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          res.status(response.statusCode).json(JSON.parse(data));
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse Claude response', raw: data.slice(0, 200) });
        }
      });
    });

    request.on('error', (e) => res.status(500).json({ error: e.message }));
    request.write(body);
    request.end();
  });
};
