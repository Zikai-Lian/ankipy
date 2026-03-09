// api/qbreader.js
// Vercel serverless function — proxies requests to qbreader.org
// This runs on Vercel's servers, so there are no CORS restrictions

export default async function handler(req, res) {
  // Allow requests from our own app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const { difficulties, number, categories, standardOnly } = req.query;
    const params = new URLSearchParams({ difficulties, number, categories, standardOnly });
    const url = `https://www.qbreader.org/api/random-tossup?${params}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'AnkiPy/1.0', 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
