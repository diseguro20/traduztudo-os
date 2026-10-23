export type AgentType = 'voice' | 'omni' | 'chat';

export type VoiceGender = 'Feminino' | 'Masculino';

export interface AgentVoice {
  id: string;
  name: string;
  gender: VoiceGender;
  language: string;
  accent: string;
  detail: string;
  color: string;
  flag?: string;
  popular?: boolean;
  provider: 'openai' | 'elevenlabs' | 'cartesia' | 'custom';
  sampleUrl?: string;
}

export interface PreciseExtractionEntity {
  id: string;
  name: string;
  example: string;
  description?: string;
}

export interface AgentTechnicalSettings {
  maxCallDuration: number; // minutes (e.g. 20)
  silenceTimeout: number; // seconds (e.g. 10)
  recordAudio: boolean;
  autoDeleteOnRefusal: boolean;
  ambientSound: '' | 'office' | 'callcenter' | 'coffee' | 'silent';
  ambientVolume: number; // 0 to 1
  technicalTerms: string[];
  speechSpeed: number; // e.g. 1.25 to 1.35
  sensitivity: number; // 0 to 1 (VAD interruption sensitivity)
  temperature: number; // e.g. 0.1
  preciseExtraction: PreciseExtractionEntity[];
  freeTransfer: boolean;
  dtmf: boolean;
  protectGreeting: boolean;
  noInterruptions: boolean;
  responseSpeed: 'normal' | 'fast' | 'dynamic';
}

export interface AgentRules {
  aiDisclosure: 'if_asked' | 'always' | 'never';
  style: 'default' | 'friendly' | 'professional' | 'direct';
  offTopic: {
    active: boolean;
    behavior: 'POINT_OUT_NOT_RESPONSIBLE' | 'REDIRECT_NICELY' | 'DECLINE';
    noteAndOffer: boolean;
    smallTalk: 'ENGAGE_BRIEFLY' | 'DECLINE' | 'IGNORE';
  };
  angry: {
    active: boolean;
    behavior: 'STAY_CALM_AND_LISTEN' | 'OFFER_MANAGER' | 'APOLOGIZE';
    offerTransfer: boolean;
  };
  sales: {
    active: boolean;
    reaction: 'DECLINE_FRIENDLY' | 'TAKE_MESSAGE' | 'HANG_UP';
    hangUp: boolean;
    handleCompetitors: boolean;
    competitorBehavior: 'STAY_NEUTRAL' | 'EMPHASIZE_STRENGTHS';
  };
  pronunciation: Array<{
    word: string;
    phonetic: string;
  }>;
  custom: Array<{
    name: string;
    instruction: string;
  }>;
}

export interface BusinessHoursSchedule {
  day: number; // 0-6 (0 is Sunday, 1 is Monday)
  enabled: boolean;
  ranges: Array<{ from: string; to: string }>;
}

export interface AgentTelephony {
  enabled: boolean;
  provider: 'twilio';
  phoneNumber?: string;
  sipDomain?: string;
  transferNumber?: string;
  inboundWebhookUrl?: string;
}

export interface AIAgentConfig {
  id: string;
  orgId: string;
  name: string;
  type: AgentType;
  channels: string[];
  voiceId: string;
  language: string;
  greeting: string;
  greetingPersonalized: boolean;
  greetingMode: 'auto' | 'custom';
  greetingRules: Array<{
    id: string;
    conditions: Array<{ field: string; operator: string; value: string }>;
    message: string;
  }>;
  prompt: string;
  companyInfo: string;
  businessHours: {
    timezone: string;
    schedule: BusinessHoursSchedule[];
    outsideBehavior: string;
  };
  rules: AgentRules;
  technical: AgentTechnicalSettings;
  tools: string[]; // 'search_knowledge' | 'lookup_contact' | 'create_quote' | 'schedule_booking' | 'transfer_call' | 'send_whatsapp'
  telephony: AgentTelephony;
  webSearch: {
    enabled: boolean;
    instruction: string;
    allowedDomains: string[];
  };
  knowledgeBaseEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptLine {
  id: string;
  timestamp: number; // seconds from call start
  speaker: 'caller' | 'assistant';
  text: string;
}

export interface AICallConversation {
  id: string;
  room: string;
  agentId: string;
  callerName?: string;
  callerPhone?: string;
  callerEmail?: string;
  direction: 'inbound_phone' | 'outbound_phone' | 'web_video' | 'test';
  status: 'active' | 'completed' | 'failed' | 'missed';
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
  transcripts: TranscriptLine[];
  extractedData: {
    clientName?: string;
    email?: string;
    phone?: string;
    documentType?: string;
    sourceLang?: string;
    targetLang?: string;
    estimatedLaudas?: number;
    estimatedValue?: number;
    urgency?: string;
    summary?: string;
  };
  createdQuoteId?: string;
  createdLeadId?: string;
  recordingUrl?: string;
}

export interface LiveKitTokenResponse {
  url: string;
  token: string;
  room: string;
  conversationId: string;
  mode: 'livekit_cloud' | 'local_fallback';
}
