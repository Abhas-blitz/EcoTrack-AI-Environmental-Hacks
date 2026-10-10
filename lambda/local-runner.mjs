/**
 * EcoTrack AI — Local Lambda Runner (Port 3000)
 * Allows testing the Lambda handler over HTTP without requiring Docker or SAM CLI installation.
 * Uses the exact same lambda/risk.mjs handler logic.
 */

import http from 'http';
import { handler } from './risk.mjs';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/assess' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const event = {
          httpMethod: 'POST',
          body,
        };
        const lambdaRes = await handler(event);
        res.writeHead(lambdaRes.statusCode, lambdaRes.headers);
        res.end(lambdaRes.body);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Route not found. Use POST /assess' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 EcoTrack AI — Lambda Local Server listening on:`);
  console.log(`   http://127.0.0.1:${PORT}/assess`);
  console.log(`   Simulates AWS SAM Local endpoint using lambda/risk.mjs`);
  console.log(`======================================================\n`);
});
