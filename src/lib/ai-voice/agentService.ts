import { AIAgentConfig, AICallConversation } from '@/types/ai-voice';

export const DEFAULT_AGENT_CONFIG: AIAgentConfig = {
  id: 'agt-traduztudo-principal',
  orgId: 'tenant-traduztudo',
  name: 'Sofia TraduzTudo',
  type: 'omni', // Atendimento em vídeo, ligação telefônica e chat
  channels: ['phone', 'webchat'],
  voiceId: 'camila',
  language: 'pt-BR',
  greeting: 'Olá! Sou a Sofia da TraduzTudo. Como posso te ajudar com sua tradução juramentada ou orçamento hoje?',
  greetingPersonalized: true,
  greetingMode: 'auto',
  greetingRules: [],
  prompt: `Você é a Sofia, consultora sênior da TraduzTudo (traduztudo.com).
Sua missão é atender clientes e empresas em reuniões de vídeo e ligações telefônicas, tirar dúvidas sobre traduções juramentadas e livres, calcular laudas estimadas e fechar orçamentos ou parcerias B2B.

DIRETRIZES DE ATENDIMENTO:
1. Tom: Profissional, calorosa, confiante e extremamente ágil.
2. Seja concisa: como é uma conversa falada por voz e vídeo, não dê respostas longas demais. Responda em 1 a 3 frases por intervenção.
3. Informações da TraduzTudo:
   - Tradução Juramentada: R$ 95,00 por lauda juramentada (1.000 caracteres sem espaços ou 160 palavras).
   - Tradução Técnica/Livre: R$ 75,00 por lauda.
   - Prazos padrão: 3 a 5 dias úteis. Opção de urgência em 24h a 48h.
   - Entregamos com assinatura digital ICP-Brasil com validade jurídica nacional e internacional.
   - Fazemos Apostilamento de Haia e envio físico por Sedex ou portador quando solicitado.
4. Coleta de Dados para Orçamento:
   - Pergunte o tipo de documento (Certidão de nascimento, diploma, contrato, procuração, etc.).
   - Pergunte o par de idiomas (ex: Português para Italiano, Inglês para Português, etc.).
   - Pergunte a quantidade aproximada de páginas ou palavras.
   - Peça o nome, e-mail e WhatsApp para envio imediato da proposta oficial em PDF.
5. Se for um advogado, cartório ou empresa querendo parceria B2B:
   - Ofereça faturamento em 30 dias, tabela diferenciada para volume e gerente de conta dedicado.`,
  companyInfo: 'TraduzTudo Serviços de Tradução Juramentada e Soluções Linguísticas B2B. Atendimento nacional e internacional com certificação digital ICP-Brasil.',
  businessHours: {
    timezone: 'America/Sao_Paulo',
    schedule: [
      { day: 1, enabled: true, ranges: [{ from: '08:30', to: '18:30' }] },
      { day: 2, enabled: true, ranges: [{ from: '08:30', to: '18:30' }] },
      { day: 3, enabled: true, ranges: [{ from: '08:30', to: '18:30' }] },
      { day: 4, enabled: true, ranges: [{ from: '08:30', to: '18:30' }] },
      { day: 5, enabled: true, ranges: [{ from: '08:30', to: '18:30' }] },
      { day: 6, enabled: false, ranges: [] },
      { day: 0, enabled: false, ranges: [] },
    ],
    outsideBehavior: 'Anotar recado e avisar que nossa equipe entrará em contato logo no primeiro horário útil.',
  },
  rules: {
    aiDisclosure: 'if_asked',
    style: 'professional',
    offTopic: {
      active: true,
      behavior: 'REDIRECT_NICELY',
      noteAndOffer: true,
      smallTalk: 'ENGAGE_BRIEFLY',
    },
    angry: {
      active: true,
      behavior: 'STAY_CALM_AND_LISTEN',
      offerTransfer: true,
    },
    sales: {
      active: true,
      reaction: 'DECLINE_FRIENDLY',
      hangUp: false,
      handleCompetitors: true,
      competitorBehavior: 'STAY_NEUTRAL',
    },
    pronunciation: [
      { word: 'TraduzTudo', phonetic: 'Traduz Tudo' },
      { word: 'lauda', phonetic: 'láuda' },
      { word: 'Haia', phonetic: 'Ráia' },
      { word: 'ICP-Brasil', phonetic: 'I C P Brasil' },
    ],
    custom: [],
  },
  technical: {
    maxCallDuration: 20, // 20 minutos
    silenceTimeout: 10, // 10 segundos
    recordAudio: true,
    autoDeleteOnRefusal: false,
    ambientSound: 'office', // Ruído ambiente suave de escritório para naturalidade humana
    ambientVolume: 0.15,
    technicalTerms: ['Apostilamento de Haia', 'Lauda juramentada', 'Junta Comercial', 'ICP-Brasil'],
    speechSpeed: 1.25,
    sensitivity: 0.65, // VAD alta precisão
    temperature: 0.1,
    preciseExtraction: [
      { id: 'pe_email', name: 'Email do Cliente', example: 'contato@empresa.com.br' },
      { id: 'pe_phone', name: 'Telefone / WhatsApp', example: '(11) 98765-4321' },
      { id: 'pe_doc_type', name: 'Tipo de Documento', example: 'Certidão de Nascimento, Contrato Social' },
      { id: 'pe_languages', name: 'Idiomas (Origem e Destino)', example: 'Português -> Italiano' },
      { id: 'pe_pages', name: 'Quantidade de Páginas/Laudas', example: '4 páginas' },
    ],
    freeTransfer: true,
    dtmf: true,
    protectGreeting: true,
    noInterruptions: false,
    responseSpeed: 'fast',
  },
  tools: [
    'search_knowledge',
    'lookup_contact',
    'create_quote',
    'schedule_booking',
    'transfer_call',
    'send_whatsapp',
  ],
  telephony: {
    enabled: true,
    provider: 'twilio',
    phoneNumber: '+55 11 4003-8822',
    sipDomain: 'traduztudo.sip.livekit.cloud',
    transferNumber: '+55 11 99999-8888',
    inboundWebhookUrl: 'https://traduztudo.com/api/ai/telephony/webhook',
  },
  webSearch: {
    enabled: false,
    instruction: '',
    allowedDomains: ['traduztudo.com'],
  },
  knowledgeBaseEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AGENT_STORAGE_KEY = 'traduztudo_ai_agent_config_v1';
const CONV_STORAGE_KEY = 'traduztudo_ai_conversations_v1';

export function getStoredAgentConfig(): AIAgentConfig {
  if (typeof window === 'undefined') return DEFAULT_AGENT_CONFIG;
  try {
    const raw = localStorage.getItem(AGENT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(DEFAULT_AGENT_CONFIG));
      return DEFAULT_AGENT_CONFIG;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_AGENT_CONFIG;
  }
}

export function saveStoredAgentConfig(config: AIAgentConfig): void {
  if (typeof window === 'undefined') return;
  try {
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save agent config:', e);
  }
}

export function getStoredConversations(): AICallConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONV_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredConversation(conv: AICallConversation): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredConversations();
    const existingIndex = list.findIndex(c => c.id === conv.id || c.room === conv.room);
    if (existingIndex >= 0) {
      list[existingIndex] = conv;
    } else {
      list.unshift(conv);
    }
    localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save conversation:', e);
  }
}
