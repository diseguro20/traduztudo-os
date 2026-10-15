import crypto from 'crypto';

/**
 * Constant-time string comparison to prevent timing attacks on webhook tokens.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    if (bufA.length !== bufB.length) {
      // Compare against itself to maintain constant time execution
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Checks if the message is an automated reply or loop trigger.
 */
export function isAutomatedOrLoopEmail(params: {
  from: string;
  headers?: Record<string, string>;
  subject?: string;
  bodyText?: string;
}): { isLoop: boolean; reason?: string } {
  const fromClean = params.from.toLowerCase().trim();

  // 1. Check for company internal mailboxes to avoid self-reply loops
  const internalMailboxes = [
    'contato@traduztudo.com',
    'contato@traduztudo.com.br',
    'noreply@traduztudo.com',
    'no-reply@traduztudo.com',
    'sistema@traduztudo.com',
  ];
  if (internalMailboxes.some((internal) => fromClean.includes(internal))) {
    return { isLoop: true, reason: 'Mensagem originada da própria empresa/sistema (auto-loop prevenido)' };
  }

  // 2. Daemon & common bounces
  const bounceSenders = [
    'mailer-daemon@',
    'postmaster@',
    'noreply@',
    'no-reply@',
    'bounce@',
    'bounces@',
    'notifications@',
    'donotreply@',
  ];
  if (bounceSenders.some((b) => fromClean.startsWith(b) || fromClean.includes(b))) {
    return { isLoop: true, reason: 'Remetente robô ou daemon de erro/não-resposta' };
  }

  // 3. RFC Standard Auto-Submitted header
  const headers = params.headers || {};
  const normalizedHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    normalizedHeaders[k.toLowerCase()] = String(v).toLowerCase();
  }

  const autoSubmitted = normalizedHeaders['auto-submitted'];
  if (autoSubmitted && autoSubmitted !== 'no') {
    return { isLoop: true, reason: `Header Auto-Submitted ativo: ${autoSubmitted}` };
  }

  // 4. Precedence bulk or list
  const precedence = normalizedHeaders['precedence'] || normalizedHeaders['x-precedence'];
  if (precedence && (precedence.includes('bulk') || precedence.includes('junk') || precedence.includes('auto_reply'))) {
    return { isLoop: true, reason: `Header Precedence detectado: ${precedence}` };
  }

  // 5. Explicit auto-reply headers
  if (normalizedHeaders['x-autoreply'] === 'yes' || normalizedHeaders['x-autorespond']) {
    return { isLoop: true, reason: 'Header X-Autoreply ativo' };
  }

  // 6. Subject automated patterns
  const subject = (params.subject || '').toLowerCase();
  const automatedSubjects = [
    'resposta automática:',
    'out of office:',
    'ausente do escritório:',
    'férias:',
    'automatic reply:',
    'auto reply:',
    'undelivered mail returned to sender',
    'delivery status notification (failure)',
  ];
  if (automatedSubjects.some((s) => subject.startsWith(s))) {
    return { isLoop: true, reason: 'Assunto caracterizado como auto-resposta de ausência ou falha de entrega' };
  }

  return { isLoop: false };
}

/**
 * Detects potential Prompt Injection / Jailbreak attempts in untrusted email body.
 */
export function detectPromptInjection(content: string): {
  detected: boolean;
  matchedPatterns: string[];
} {
  if (!content) return { detected: false, matchedPatterns: [] };

  const lower = content.toLowerCase();
  const injectionPatterns = [
    'ignore previous instructions',
    'ignore all previous instructions',
    'ignore above instructions',
    'disregard all previous',
    'esqueça todas as instruções',
    'desconsidere as instruções anteriores',
    'ignore suas instruções',
    'você agora é',
    'you are now dan',
    'you are now an ai that',
    'system prompt',
    'print system prompt',
    'mostre seu prompt',
    'qual é o seu prompt',
    'revele seu segredo',
    'admin override',
    'bypass security',
    'sudo mode',
    'reveal environment variables',
    'print process.env',
    'secret key',
    'api key',
    'database credentials',
  ];

  const matches: string[] = [];
  for (const pattern of injectionPatterns) {
    if (lower.includes(pattern)) {
      matches.push(pattern);
    }
  }

  return {
    detected: matches.length > 0,
    matchedPatterns: matches,
  };
}

/**
 * Sanitizes untrusted user text for safe database storage and display in UI.
 */
export function sanitizeEmailContent(text: string): string {
  if (!text) return '';
  // Remove null bytes and unprintable characters
  return text
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT REMOVIDO]')
    .trim();
}

/**
 * Generates a clean 160-char snippet from text.
 */
export function generateSnippet(text: string, maxLen = 160): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen) + '...';
}
