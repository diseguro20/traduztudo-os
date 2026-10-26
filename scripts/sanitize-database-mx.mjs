/**
 * TraduzTudo OS - Higienizador de Base Anti-Bounce
 * 
 * Varre todos os contatos do CRM, testa os servidores MX no DNS real,
 * e remove da fila elegível todas as empresas com e-mails inexistentes/alucinados.
 */

import dns from 'dns';
import https from 'https';

const dnsPromises = dns.promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);

const BASE_URL = process.env.BASE_URL || 'https://traduztudo-os.vercel.app';

function log(msg) {
  const time = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${time}] ${msg}`);
}

async function verifyMx(email) {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase().trim();
  if (!domain || domain.length < 4 || !domain.includes('.')) return false;

  // 1. Node.js DNS
  try {
    const records = await dnsPromises.resolveMx(domain);
    if (records && records.length > 0) return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') return false;
  }

  // 2. Google DNS-over-HTTPS
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/dns-json' },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.Status === 0 && Array.isArray(data.Answer)) {
        return data.Answer.some((a) => a.type === 15);
      }
      if (data.Status === 3) return false;
    }
  } catch {}

  return false;
}

async function updateStatus(companyId, status) {
  try {
    const res = await fetch(`${BASE_URL}/api/prospecting/companies/${companyId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  log('Iniciando varredura e higienização profunda de MX na base...');
  
  const res = await fetch(`${BASE_URL}/api/prospecting/companies?limit=500`);
  const data = await res.json();
  const companies = data.items || [];
  log(`Total de empresas carregadas: ${companies.length}`);

  let validCount = 0;
  let invalidCleaned = 0;

  for (const c of companies) {
    // Only verify companies that are currently in an active or eligible state
    const isEligibleOrSent = [
      'CONTATO_VERIFICADO',
      'ELEGIBILIDADE_CONFIRMADA',
      'CAMPANHA_PROGRAMADA',
      'NOVO',
      'CONTATO_ENCONTRADO'
    ].includes(c.status);

    if (!isEligibleOrSent && c.status === 'CONTATO_INVALIDO') {
      continue; // already marked as invalid
    }

    const email = c.contactEmail;
    const ok = await verifyMx(email);

    if (ok) {
      validCount++;
    } else {
      invalidCleaned++;
      log(`❌ Rejeitado: ${c.tradeName || c.name} (${email}) - Domínio sem MX. Alterando para CONTATO_INVALIDO.`);
      await updateStatus(c.id, 'CONTATO_INVALIDO');
    }
  }

  log(`=== Varredura Concluída ===`);
  log(`Empresas Válidas Mantidas: ${validCount}`);
  log(`Contatos Inválidos Higienizados (Bloqueados): ${invalidCleaned}`);

  // Purge any bounce notices in Hostinger Webmail
  try {
    log('Limpando avisos de bounce do Webmail Hostinger...');
    const purgeRes = await fetch(`${BASE_URL}/api/email/purge-bounces`, { method: 'POST' });
    const purgeData = await purgeRes.json();
    log(`Webmail limpo! ${purgeData.purgedCount || 0} e-mails de erro excluídos permanentemente.`);
  } catch (err) {
    log(`Aviso ao limpar webmail: ${err.message}`);
  }
}

run().catch((e) => console.error(e));
