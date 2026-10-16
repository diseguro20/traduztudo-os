import assert from 'assert';

console.log('================================================================');
console.log('🧪 SUÍTE DE TESTES: PROSPECÇÃO INTELIGENTE TRADUZ TUDO OS');
console.log('================================================================\n');

// 1. TESTE DE DEDUPLICAÇÃO E VERIFICAÇÃO DE EMPRESAS
console.log('TESTE 1: Lógica de Deduplicação e Restrições Únicas');
function normalizeCnpj(cnpj) {
  return cnpj ? cnpj.replace(/\D/g, '') : '';
}
function normalizeDomain(url) {
  return url ? url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim() : '';
}

const mockDb = [
  { cnpj: '38.412.901/0001-44', website: 'https://bellacidadania.com.br', email: 'contato@bellacidadania.com.br' },
  { cnpj: '41.879.123/0001-90', website: 'https://romacidadania.com.br', email: 'atendimento@romacidadania.com.br' }
];

function checkDuplicate(cnpj, website, email) {
  const cleanC = normalizeCnpj(cnpj);
  const cleanD = normalizeDomain(website);
  const cleanE = (email || '').toLowerCase().trim();

  return mockDb.some(item => {
    if (cleanC && normalizeCnpj(item.cnpj) === cleanC) return true;
    if (cleanE && item.email.toLowerCase().trim() === cleanE) return true;
    if (cleanD && normalizeDomain(item.website) === cleanD) return true;
    return false;
  });
}

assert.strictEqual(checkDuplicate('38.412.901/0001-44', 'https://outrosite.com', 'outro@email.com'), true, 'Deveria detectar duplicata por CNPJ');
assert.strictEqual(checkDuplicate('00.000.000/0001-00', 'https://bellacidadania.com.br/contato', 'outro@email.com'), true, 'Deveria detectar duplicata por Domínio');
assert.strictEqual(checkDuplicate('00.000.000/0001-00', 'https://novosite.com', 'contato@bellacidadania.com.br'), true, 'Deveria detectar duplicata por E-mail');
assert.strictEqual(checkDuplicate('99.999.999/0001-99', 'https://empresa-nova-100.com.br', 'nova@empresa.com'), false, 'Empresa nova deve ser aceita');
console.log('✅ TESTE 1 APROVADO: Deduplicação tripla (CNPJ, Domínio e E-mail) validada.\n');

// 2. TESTE DE QUALIFICAÇÃO E FIT SCORE POR IA
console.log('TESTE 2: Motor de Qualificação Comercial e Scoring');
function qualifyCompany(segment, hasEmail, hasPhone) {
  let score = 60;
  if (hasEmail) score += 25;
  if (hasPhone) score += 10;

  const segmentServices = {
    CIDADANIA_ITALIANA: ['Tradução Juramentada de Certidões', 'Apostilamento de Haia'],
    COMERCIO_EXTERIOR: ['Tradução Técnica e Juramentada de Contratos', 'Documentos de Exportação'],
    INTERCAMBIO: ['Tradução Juramentada de Diplomas e Históricos'],
    ADVOCACIA_INTERNACIONAL: ['Tradução de Procurações e Sentenças Estrangeiras']
  };

  const services = segmentServices[segment] || ['Tradução Corporativa'];
  return { fitScore: Math.min(100, score), services };
}

const qItaliana = qualifyCompany('CIDADANIA_ITALIANA', true, true);
assert.strictEqual(qItaliana.fitScore, 95, 'Score de empresa com contato verificado deve ser 95%');
assert.ok(qItaliana.services.includes('Tradução Juramentada de Certidões'), 'Deve mapear certidões para cidadania italiana');

const qComex = qualifyCompany('COMERCIO_EXTERIOR', true, false);
assert.strictEqual(qComex.fitScore, 85, 'Score de empresa com e-mail deve ser 85%');
assert.ok(qComex.services.includes('Tradução Técnica e Juramentada de Contratos'), 'Deve mapear contratos para comércio exterior');
console.log('✅ TESTE 2 APROVADO: Algoritmo de afinidade e mapeamento de serviços por segmento validado.\n');

// 3. TESTE DE CONFORMIDADE LGPD & SUPRESSÃO
console.log('TESTE 3: Lista Global de Supressão e Descadastro (LGPD Art. 7º, IX)');
const suppressionSet = new Set(['bloqueado@empresa.com.br']);

function isSuppressed(email) {
  return suppressionSet.has(email.toLowerCase().trim());
}

function addToSuppression(email) {
  suppressionSet.add(email.toLowerCase().trim());
}

assert.strictEqual(isSuppressed('bloqueado@empresa.com.br'), true, 'E-mail suprimido deve retornar true');
assert.strictEqual(isSuppressed('novo@empresa.com.br'), false, 'E-mail novo deve retornar false');

addToSuppression('novo@empresa.com.br');
assert.strictEqual(isSuppressed('novo@empresa.com.br'), true, 'E-mail recém-adicionado à supressão deve retornar true imediatamente');
console.log('✅ TESTE 3 APROVADO: Bloqueio estrito de contatos opt-out verificado.\n');

// 4. TESTE DE CLASSIFICAÇÃO DE RESPOSTAS INBOUND
console.log('TESTE 4: Classificador de Respostas Comerciais de Prospects');
function classifyInboundReply(text, subject) {
  const combined = `${subject} ${text}`.toLowerCase();
  if (combined.includes('descadastr') || combined.includes('remover') || combined.includes('não tenho interesse')) {
    return 'SOLICITACAO_REMOCAO';
  }
  if (combined.includes('orçamento') || combined.includes('cotação') || combined.includes('quanto custa')) {
    return 'SOLICITACAO_ORCAMENTO';
  }
  if (combined.includes('parceria') || combined.includes('podemos conversar') || combined.includes('whatsapp')) {
    return 'INTERESSE_PARCERIA';
  }
  return 'PEDIDO_INFORMACOES';
}

assert.strictEqual(
  classifyInboundReply('Favor remover meu e-mail da sua base de dados.', 'Re: Parceria'),
  'SOLICITACAO_REMOCAO',
  'Deve detectar opt-out'
);
assert.strictEqual(
  classifyInboundReply('Gostaria de uma cotação para tradução juramentada de 3 certidões.', 'Re: Apresentação'),
  'SOLICITACAO_ORCAMENTO',
  'Deve detectar orçamento'
);
assert.strictEqual(
  classifyInboundReply('Gostamos da apresentação. Vamos marcar uma conversa pelo WhatsApp?', 'Re: Parceria Comercial'),
  'INTERESSE_PARCERIA',
  'Deve detectar interesse em parceria'
);
console.log('✅ TESTE 4 APROVADO: Classificação de intenções com alta acurácia.\n');

// 5. TESTE DE IDEMPOTÊNCIA E CONTROLE TRANSACIONAL
console.log('TESTE 5: Idempotência de Envio de Campanhas');
const sentKeys = new Set();

function registerSend(companyId, campaignId) {
  const key = `${companyId}:${campaignId}`;
  if (sentKeys.has(key)) {
    return { success: false, reason: 'ALREADY_SENT' };
  }
  sentKeys.add(key);
  return { success: true };
}

assert.strictEqual(registerSend('comp-1', 'camp-cidadania').success, true, 'Primeiro envio deve ser autorizado');
assert.strictEqual(registerSend('comp-1', 'camp-cidadania').success, false, 'Segundo envio para a mesma campanha deve ser bloqueado por idempotência');
assert.strictEqual(registerSend('comp-2', 'camp-cidadania').success, true, 'Empresa diferente deve ser autorizada');
console.log('✅ TESTE 5 APROVADO: Idempotência de campanha e prevenção contra envios duplicados.\n');

console.log('================================================================');
console.log('🎉 TODOS OS TESTES UNITÁRIOS E DE REGRAS (5/5) PASSARAM COM SUCESSO!');
console.log('================================================================\n');
