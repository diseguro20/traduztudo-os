/**
 * TraduzTudo OS - Standalone Prospecting Worker
 * 
 * Executa sob demanda ou em intervalos controlados seguros (após reativação da conta).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_HOST = 'traduztudo-os.vercel.app';
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'prospecting-daemon.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function writeLog(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  process.stdout.write(line);
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    // ignore
  }
}

function makeRequest(apiPath, postData = null, headers = {}) {
  return new Promise((resolve) => {
    const payload = postData ? JSON.stringify(postData) : '';
    const options = {
      hostname: BASE_HOST,
      port: 443,
      path: apiPath,
      method: postData ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TraduzTudo-Daemon/1.0',
        ...headers,
        ...(postData ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });

    if (postData) req.write(payload);
    req.end();
  });
}

async function runSingleSafeCycle() {
  writeLog('Iniciando ciclo seguro de baixa frequência...');
  const res = await makeRequest('/api/prospecting/cron/dispatch', { limitCount: 2, force: false });
  writeLog(`Resultado: ${JSON.stringify(res)}`);
}

if (require.main === module) {
  runSingleSafeCycle();
}

module.exports = { runSingleSafeCycle };
