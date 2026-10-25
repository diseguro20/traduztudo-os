/**
 * TraduzTudo OS - Standalone Prospecting Daemon Worker
 * 
 * Executa continuamente em segundo plano a cada 10 minutos:
 * 1. Busca novas empresas reais com IA Gemini
 * 2. Valida MX e conformidade anti-bounce
 * 3. Dispara e-mails comerciais com Apresentação PDF oficial via Hostinger SMTP
 * 4. Limpa avisos de erro via IMAP TLS
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
const TARGET_URL = 'https://traduztudo-os.vercel.app/api/prospecting/cycle/run';
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

async function executeCycle() {
  writeLog('Iniciando ciclo automático de prospecção (Busca + Disparo SMTP Hostinger com PDF)...');

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      force: true,
      discoveryCount: 10,
      dispatchLimit: 5,
    });

    const url = new URL(TARGET_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-manual-trigger': 'true',
        'User-Agent': 'TraduzTudo-Daemon/1.0',
      },
      timeout: 60000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            const disc = json.discovery?.count || 0;
            const sent = json.dispatch?.sentCount || 0;
            const purged = json.purge?.purgedCount || 0;
            writeLog(`SUCESSO: +${disc} empresas descobertas | ${sent} e-mails entregues com PDF | ${purged} bounces higienizados.`);
          } else {
            writeLog(`ALERTA: Resposta da API: ${json.message || json.error || 'Desconhecido'}`);
          }
        } catch (e) {
          writeLog(`Resposta bruta recebida (Status ${res.statusCode}): ${data.substring(0, 150)}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      writeLog(`ERRO DE REDE: ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      writeLog('TIMEOUT: A requisição de ciclo expirou após 60 segundos.');
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function loop() {
  writeLog('=== PROSPECTING DAEMON INICIADO (Ciclos a cada 10 minutos) ===');
  // Executa imediatamente na inicialização
  await executeCycle();

  // Executa recursivamente no intervalo
  setInterval(async () => {
    try {
      await executeCycle();
    } catch (err) {
      writeLog(`Erro no loop: ${err.message}`);
    }
  }, INTERVAL_MS);
}

loop();
