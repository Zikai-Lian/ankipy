// api/qbreader.js — Vercel serverless proxy for qbreader.org
const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const { difficulties, number, categories, standardOnly, endpoint } = req.query;
    const ep = endpoint === 'bonus' ? 'random-bonus' : 'random-tossup';
    const params = new URLSearchParams();
    if (difficulties) params.set('difficulties', difficulties);
    if (number) params.set('number', number);
    if (categories) params.set('categories', categories);
    if (standardOnly) params.set('standardOnly', standardOnly);
    const path = `/api/${ep}?${params.toString()}`;

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
          res.status(200).json(JSON.parse(data));
        } catch (e) {
          res.status(500).json({ error: 'Parse error', raw: data.slice(0, 200) });
        }
      });
    });
    request.on('error', (e) => res.status(500).json({ error: e.message }));
    request.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
