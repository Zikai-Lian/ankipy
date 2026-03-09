// api/qbreader.js — Vercel serverless proxy for qbreader.org
const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { difficulties = '1,2,3', number = '20', categories = 'Science', standardOnly = 'true' } = req.query;
  const path = `/api/random-tossup?difficulties=${difficulties}&number=${number}&categories=${encodeURIComponent(categories)}&standardOnly=${standardOnly}`;

  const options = {
    hostname: 'www.qbreader.org',
    path,
    method: 'GET',
    headers: { 'User-Agent': 'AnkiPy/1.0', 'Accept': 'application/json' }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.status(200).json(json);
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse qbreader response', raw: data.slice(0, 200) });
      }
    });
  });

  request.on('error', (e) => {
    res.status(500).json({ error: e.message });
  });

  request.end();
};
