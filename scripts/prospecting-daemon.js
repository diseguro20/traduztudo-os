/**
 * TraduzTudo OS - Standalone Prospecting Daemon Worker
 * 
 * Executa continuamente em segundo plano a cada 10 minutos:
 * 1. Busca novas empresas reais com IA Gemini (/api/prospecting/search/ai)
 * 2. Dispara lote com Apresentação PDF oficial via Hostinger SMTP (/api/prospecting/cron/dispatch)
 * 3. Limpa avisos de erro via IMAP TLS (/api/email/purge-bounces)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
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

const SEGMENTS = ['CIDADANIA_ITALIANA', 'ADVOCACIA_INTERNACIONAL', 'COMERCIO_EXTERIOR', 'VISTOS_IMIGRACAO'];

async function executeCycle() {
  writeLog('--- INICIANDO CICLO AUTOMÁTICO DE PROSPECÇÃO ---');

  // Passo 1: Busca de Empresas com IA Gemini (~4s)
  const randomSeg = SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)];
  writeLog(`[1/3] Buscando novas empresas no nicho "${randomSeg}" via Gemini AI...`);
  const searchRes = await makeRequest('/api/prospecting/search/ai', {
    segment: randomSeg,
    targetCount: 10,
  });
  const addedCount = searchRes.count || 0;
  writeLog(`[1/3] Concluído: +${addedCount} novas empresas adicionadas.`);

  // Passo 2: Disparo Hostinger SMTP com Anexo PDF (~5s)
  writeLog('[2/3] Disparando lote de e-mails com apresentação PDF via Hostinger SMTP...');
  const dispatchRes = await makeRequest('/api/prospecting/cron/dispatch', { limitCount: 5, force: true }, { 'x-manual-trigger': 'true' });
  const sentCount = dispatchRes.result?.sentCount || 0;
  const failedCount = dispatchRes.result?.failedCount || 0;
  writeLog(`[2/3] Concluído: ${sentCount} enviados, ${failedCount} falhas.`);

  // Passo 3: Limpeza de Webmail IMAP (~3s)
  writeLog('[3/3] Higienizando caixa postal Hostinger via IMAP TLS...');
  const purgeRes = await makeRequest('/api/email/purge-bounces', {});
  writeLog(`[3/3] Concluído: ${purgeRes.purgedCount || 0} e-mails de erro removidos.`);

  writeLog(`--- CICLO FINALIZADO: +${addedCount} descobertas | ${sentCount} e-mails entregues com PDF ---\n`);
}

async function loop() {
  writeLog('=== PROSPECTING DAEMON INICIADO (Ciclos a cada 10 minutos) ===');
  await executeCycle();

  setInterval(async () => {
    try {
      await executeCycle();
    } catch (err) {
      writeLog(`Erro no loop do daemon: ${err.message}`);
    }
  }, INTERVAL_MS);
}

loop();
