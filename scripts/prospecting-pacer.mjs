/**
 * TraduzTudo OS - Motor de Cadência Contínua de Prospecção (50 e-mails/hora)
 * 
 * Funcionalidade:
 * - Mantém uma taxa exata de ~50 e-mails/hora (1 envio a cada ~72 segundos).
 * - Imune a timeouts de serverless (cada disparo individual leva 2-3s).
 * - Blindagem total contra suspensão da Hostinger (zero rajadas, entrega humana contínua).
 * - Auto-reposição contínua: alimenta a fila com novas empresas via Gemini Flash AI sempre que a fila estiver baixa.
 * - Limpeza periódica de bounces via IMAP sem sobrecarregar a caixa postal.
 * - Suporta execução contínua 24/7 (relay race em GitHub Actions e daemon local).
 */

import https from 'https';
import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'https://traduztudo-os.vercel.app';
const TARGET_PER_HOUR = Number(process.env.TARGET_PER_HOUR) || 50;
const DELAY_SECONDS = Math.round(3600 / TARGET_PER_HOUR); // ~72 segundos para 50/hora

function log(msg) {
  const time = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${time}] ${msg}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = data ? JSON.stringify(data) : '';

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TraduzTudo-Pacer/2.0',
        ...(data ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
      timeout: 120000,
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve({ raw, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Request timeout' });
    });

    if (data) req.write(bodyStr);
    req.end();
  });
}

// 1. Verifica status do dashboard e auto-reabastece com IA se fila baixa
async function ensureQueueReady() {
  try {
    const dash = await apiRequest('/api/prospecting/dashboard');
    const eligible = dash?.stats?.eligibleCount || 0;
    log(`Status da fila: ${eligible} empresas elegíveis para envio.`);

    if (eligible < 20) {
      log(`Fila baixa (${eligible} < 20). Auto-reabastecendo via IA com validação estrita de website...`);
      const segs = ['COMERCIO_EXTERIOR', 'VISTOS_IMIGRACAO', 'CIDADANIA_ITALIANA', 'ADVOCACIA_INTERNACIONAL'];
      
      for (const seg of segs.sort(() => 0.5 - Math.random())) {
        const searchRes = await apiRequest('/api/prospecting/search/ai', 'POST', {
          segment: seg,
          targetCount: 15,
        });
        log(`Busca IA (${seg}): +${searchRes.count || 0} novas empresas adicionadas.`);
      }
    }
  } catch (err) {
    log(`Aviso ao checar fila: ${err.message}`);
  }
}

// 2. Dispara um único e-mail via endpoint dedicado
async function dispatchSingleEmail(isManual = false) {
  try {
    const res = await apiRequest('/api/prospecting/cron/dispatch', 'POST', {
      limitCount: 1,
      force: isManual,
    });

    if (res.skipped) {
      return { skipped: true, message: res.message };
    }

    if (res.success && res.result) {
      const detail = res.result.details?.[0];
      return {
        success: true,
        sentCount: res.result.sentCount || 0,
        failedCount: res.result.failedCount || 0,
        recipient: detail?.recipientEmail || 'N/A',
        company: detail?.companyName || 'N/A',
        messageId: detail?.messageId || 'N/A',
      };
    }

    return { error: res.error || res.message || 'Resposta inesperada' };
  } catch (err) {
    return { error: err.message };
  }
}

// 3. Higieniza caixa de entrada Hostinger (expurga bounces)
async function cleanBounces() {
  try {
    log(`Higienizando caixa postal Hostinger (expurgo de avisos de erro)...`);
    const res = await apiRequest('/api/email/purge-bounces', 'POST');
    log(`Higienização concluída: ${res.purgedCount || 0} e-mails de erro removidos.`);
  } catch (err) {
    log(`Aviso na higienização: ${err.message}`);
  }
}

// 4. Dispara o próximo runner caso este esteja prestes a encerrar a janela de 6 horas
function triggerNextRunner() {
  try {
    log(`[Relay] Disparando próximo workflow de GitHub Actions para transição contínua sem parar...`);
    execSync('gh workflow run prospecting-automation.yml', { stdio: 'inherit' });
    log(`[Relay] Próximo workflow disparado com sucesso!`);
  } catch (err) {
    log(`[Relay] Aviso ao disparar próximo workflow: ${err.message}`);
  }
}

// 5. Executa o ciclo de disparos cadenciados
async function runCadencePacer() {
  const args = process.argv.slice(2);
  const isContinuous = args.includes('--continuous');
  
  let batchTarget = 25;
  const batchIdx = args.indexOf('--batch');
  if (batchIdx !== -1 && args[batchIdx + 1]) {
    batchTarget = parseInt(args[batchIdx + 1], 10) || 25;
  }

  let maxMinutes = null;
  const maxMinIdx = args.indexOf('--max-minutes');
  if (maxMinIdx !== -1 && args[maxMinIdx + 1]) {
    maxMinutes = parseInt(args[maxMinIdx + 1], 10);
  }

  const startTime = Date.now();

  log(`=== Iniciando Motor de Cadência Contínua (Meta: ${TARGET_PER_HOUR} envios/hora) ===`);
  log(`Modo: ${isContinuous ? 'Contínuo 24/7' : `Lote de ${batchTarget} e-mails`}`);
  log(`Intervalo entre envios: ~${DELAY_SECONDS} segundos`);
  if (maxMinutes) log(`Duração máxima da sessão: ${maxMinutes} minutos`);

  // Garante empresas na fila antes de começar
  await ensureQueueReady();

  let sentInSession = 0;
  let cycle = 0;
  let consecutiveEmpty = 0;

  while (true) {
    // Checa tempo máximo da sessão (para runners do GitHub Actions)
    if (maxMinutes && (Date.now() - startTime) >= maxMinutes * 60 * 1000) {
      log(`Tempo máximo da sessão atingido (${maxMinutes} min). Preparando troca de bastão...`);
      triggerNextRunner();
      break;
    }

    // Se estiver em modo lote fixo e atingiu a meta, encerra
    if (!isContinuous && sentInSession >= batchTarget) {
      log(`Meta do lote atingida (${sentInSession} e-mails enviados)!`);
      break;
    }

    cycle++;
    
    // Dispara 1 e-mail
    const result = await dispatchSingleEmail(false);

    if (result.skipped) {
      log(`⏸️  Pausa preventiva: ${result.message}`);
      if (!isContinuous) break;
      // Aguarda 5 minutos antes de checar novamente se a cota liberou
      await sleep(5 * 60 * 1000);
      continue;
    }

    if (result.success && result.sentCount > 0) {
      sentInSession++;
      consecutiveEmpty = 0;
      log(`[#${sentInSession}${!isContinuous ? `/${batchTarget}` : ''}] ✅ Entregue para ${result.company} (${result.recipient}) | Message-ID: ${result.messageId}`);
    } else {
      consecutiveEmpty++;
      if (result.error) {
        log(`[#${cycle}] ⚠️ Falha no envio: ${result.error}`);
      } else {
        log(`[#${cycle}] ℹ️ Nenhum e-mail elegível enviado neste ciclo.`);
      }

      if (isContinuous) {
        log(`Fila necessita de novos contatos. Executando reabastecimento via Agente IA...`);
        await ensureQueueReady();
        log(`Aguardando 30s para reprocessar fila...`);
        await sleep(30 * 1000);
        continue;
      } else {
        if (consecutiveEmpty === 1) {
          log(`Fila momentaneamente sem contatos. Executando auto-reabastecimento imediato...`);
          await ensureQueueReady();
        }

        if (consecutiveEmpty >= 5) {
          log(`Fila sem novos contatos elegíveis após 5 tentativas. Finalizando lote com segurança.`);
          break;
        }
      }
    }

    // Intervalo cadenciado com pequena variação humana (ex: 68 a 76 segundos)
    const jitter = Math.floor(Math.random() * 8) - 4; // -4s a +4s
    const actualDelay = Math.max(30, DELAY_SECONDS + jitter);
    log(`Aguardando ${actualDelay}s até o próximo disparo para manter cadência de 50/h...`);
    await sleep(actualDelay * 1000);

    // A cada 5 disparos, higieniza a caixa postal para expurgar eventuais avisos
    if (cycle % 5 === 0) {
      await cleanBounces();
    }

    // A cada 10 disparos, checa se a fila precisa de reposição proativa
    if (cycle % 10 === 0) {
      await ensureQueueReady();
    }
  }

  // Higieniza ao término
  await cleanBounces();
  log(`=== Ciclo finalizado. Total entregue: ${sentInSession} e-mails ===`);
}

runCadencePacer().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
