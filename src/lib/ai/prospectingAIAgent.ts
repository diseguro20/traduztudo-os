import {
  ProspectCompany,
  ProspectSegment,
  ProspectReplyClassification,
  PROSPECT_SEGMENT_LABELS,
} from '@/types/prospecting';

export interface CompanyQualificationResult {
  fitScore: number;
  relevantServices: string[];
  targetLanguages: string[];
  summary: string;
  reasoning: string;
  suggestedHook: string;
}

export interface GeneratedEmailMessage {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

export class ProspectingAIAgent {
  private static instance: ProspectingAIAgent;

  private constructor() {}

  public static getInstance(): ProspectingAIAgent {
    if (!ProspectingAIAgent.instance) {
      ProspectingAIAgent.instance = new ProspectingAIAgent();
    }
    return ProspectingAIAgent.instance;
  }

  /**
   * Qualifies a newly discovered company based on its profile, segment and location.
   */
  public qualifyCompany(params: {
    name: string;
    tradeName?: string;
    segment: ProspectSegment;
    city: string;
    state: string;
    website?: string;
    hasContactEmail: boolean;
    hasPhone: boolean;
  }): CompanyQualificationResult {
    const { segment, city, state, hasContactEmail, hasPhone } = params;

    let baseScore = 60;
    let relevantServices: string[] = [];
    let targetLanguages: string[] = [];
    let reasoning = '';
    let suggestedHook = '';

    if (hasContactEmail) baseScore += 25;
    if (hasPhone) baseScore += 10;
    if (params.website) baseScore += 5;

    switch (segment) {
      case 'CIDADANIA_ITALIANA':
        relevantServices = [
          'Tradução Juramentada de Certidões (Inteiro Teor)',
          'Apostilamento de Haia Integrado em Cartório',
          'Assinatura Digital Autorizada para Tribunais Italianos',
          'Alinhamento com Padrão dos Comunes e Tribunais de Roma/Veneza/Nápoles',
        ];
        targetLanguages = ['Italiano', 'Português'];
        suggestedHook = 'Parceria para fornecimento de traduções juramentadas em italiano com apostilamento para seus processos de cidadania.';
        reasoning = `Assessoria de cidadania em ${city}/${state} com alta demanda por certidões juramentadas em italiano. Grande potencial de parceria com faturamento recorrente.`;
        baseScore += 5;
        break;

      case 'CIDADANIA_PORTUGUESA_ESPANHOLA':
        relevantServices = [
          'Tradução Juramentada Oficial para Espanhol',
          'Tradução de Antecedentes Criminais e Certidões',
          'Apostilamento de Haia',
          'Documentação para Conservatórias e Consulados',
        ];
        targetLanguages = ['Espanhol', 'Português'];
        suggestedHook = 'Traduções juramentadas e apostilamento para processos de nacionalidade espanhola e portuguesa com prazos ágeis.';
        reasoning = `Assessoria especializada em cidadanias ibéricas com necessidade constante de validação notarial e juramentada de dossiês.`;
        break;

      case 'VISTOS_IMIGRACAO':
        relevantServices = [
          'Tradução Juramentada para Vistos EB-1, EB-2 NIW, D7, Golden Visa',
          'Tradução de Comprovações Financeiras e Profissionais',
          'Tradução de Cartas de Recomendação e Diplomas',
        ];
        targetLanguages = ['Inglês', 'Espanhol', 'Português'];
        suggestedHook = 'Suporte em traduções certificadas e juramentadas para processos de imigração e vistos internacionais.';
        reasoning = `Empresa de imigração exige precisão jurídica e rapidez para não perder prazos consulares dos clientes.`;
        break;

      case 'INTERCAMBIO':
      case 'ENSINO_INTERNACIONAL':
        relevantServices = [
          'Tradução Juramentada de Históricos Escolares e Diplomas',
          'Tradução de Ementas Curriculares Acadêmicas',
          'Tradução de Cartas de Motivação e Certificados de Proficiência',
        ];
        targetLanguages = ['Inglês', 'Espanhol', 'Francês', 'Alemão', 'Italiano'];
        suggestedHook = 'Condições especiais em traduções acadêmicas e juramentadas para estudantes e intercambistas da sua agência.';
        reasoning = `Agências de intercâmbio necessitam de traduções juramentadas de documentos escolares em múltiplos idiomas para matrículas em universidades estrangeiras.`;
        break;

      case 'COMERCIO_EXTERIOR':
      case 'IMPORTACAO_EXPORTACAO':
        relevantServices = [
          'Tradução Técnica e Juramentada de Contratos Internacionais',
          'Tradução de Faturas Comerciais e Certificados de Origem',
          'Tradução de Manuais Técnicos e Laudos de Conformidade',
          'Traduções Corporativas com Faturamento PJ',
        ];
        targetLanguages = ['Inglês', 'Espanhol', 'Mandarim', 'Alemão', 'Italiano'];
        suggestedHook = 'Tradução técnica e juramentada de contratos, laudos e documentos de comércio exterior com faturamento PJ.';
        reasoning = `Empresa do setor de comércio internacional com fluxo regular de contratos mercantis e especificações técnicas de importação/exportação.`;
        break;

      case 'ADVOCACIA_INTERNACIONAL':
        relevantServices = [
          'Tradução Juramentada de Procurações e Contratos Sociais',
          'Tradução de Sentenças Estrangeiras e Laudos Periciais',
          'Tradução para Homologação de Sentença Estrangeira (STJ)',
          'Assinatura Digital com Certificado ICP-Brasil',
        ];
        targetLanguages = ['Inglês', 'Espanhol', 'Italiano', 'Francês'];
        suggestedHook = 'Atendimento prioritário para escritórios jurídicos em traduções juramentadas de peças e contratos internacionais.';
        reasoning = `Banca jurídica com atuação transnacional exige rigor de sigilo, precisão jurídica e certidões juramentadas oficiais.`;
        baseScore += 5;
        break;

      case 'MULTINACIONAL':
      case 'CONSULTORIA_INTERNACIONAL':
      default:
        relevantServices = [
          'Tradução Corporativa e Juramentada com NDA e Sigilo',
          'Tradução de Relatórios Financeiros e Auditorias',
          'Tradução Simultânea para Reuniões e Eventos Corporativos',
          'Plataforma Integrada de Gestão de Demandas de Tradução',
        ];
        targetLanguages = ['Inglês', 'Espanhol', 'Português'];
        suggestedHook = 'Solução corporativa completa em traduções juramentadas, técnicas e simultâneas para empresas multinacionais.';
        reasoning = `Demanda corporativa ampla com potencial para contrato guarda-chuva de traduções para diversos departamentos.`;
        break;
    }

    const fitScore = Math.min(100, Math.max(30, baseScore));
    const summary = `${PROSPECT_SEGMENT_LABELS[segment]} em ${city}/${state}. Score de afinidade comercial: ${fitScore}%.`;

    return {
      fitScore,
      relevantServices,
      targetLanguages,
      summary,
      reasoning,
      suggestedHook,
    };
  }

  /**
   * Generates a tailored cold email draft for a specific prospect company.
   */
  public generateOutreachEmail(company: ProspectCompany, options?: { appUrl?: string }): GeneratedEmailMessage {
    const appUrl = options?.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://traduztudo-os.vercel.app';
    const unsubUrl = `${appUrl}/api/prospecting/unsubscribe?token=${encodeURIComponent(company.contactEmail)}`;

    const subject = `Tradução Juramentada, técnica e simultânea`;

    const bodyText =
`Olá, tudo bem?

Meu nome é Iago Peixoto e represento a Traduz Tudo, uma empresa especializada em soluções linguísticas para pessoas físicas e jurídicas.

Gostaria de apresentar nossos serviços e colocar nossa equipe à disposição para uma possível parceria com sua empresa.

🌐 Trabalhamos com mais de 15 idiomas, oferecendo:

- Tradução juramentada, com assinatura física ou digital;
- Tradução técnica e especializada;
- Tradução livre de documentos;
- Tradução simultânea.

Nosso compromisso é oferecer qualidade, agilidade, organização e preços altamente competitivos, atendendo desde demandas pontuais até grandes volumes de documentos.

Contamos com profissionais qualificados e buscamos construir parcerias duradouras, oferecendo condições comerciais diferenciadas para empresas com demandas recorrentes.

📌 Segue em anexo PDF contendo os valores para tradução juramentada no idioma italiano.

Será um prazer entender as necessidades da sua empresa e apresentar uma proposta personalizada, com excelentes condições comerciais.

Fico à disposição para conversarmos!

Atenciosamente,

--
Iago Peixoto | Traduz Tudo
contato@traduztudo.com | +55 11 94748-5091
https://traduztudo.com

---
Informação Legal e Privacidade (LGPD):
Este e-mail é uma comunicação institucional B2B enviada com base no Legítimo Interesse (Art. 7º, IX da Lei 13.709/18).
Caso sua empresa não deseje mais receber nossas apresentações, você pode solicitar a remoção imediata respondendo este e-mail ou clicando no link seguro de descadastro:
${unsubUrl}`;

    const bodyHtml =
`<div>Olá, tudo bem?</div><div><br></div>` +
`<div>Meu nome é <strong>Iago Peixoto</strong> e represento a <strong>Traduz Tudo</strong>, uma empresa especializada em soluções linguísticas para pessoas físicas e jurídicas.</div><div><br></div>` +
`<div>Gostaria de apresentar nossos serviços e colocar nossa equipe à disposição para uma possível parceria com sua empresa.</div><div><br></div>` +
`<div>🌐 Trabalhamos com mais de 15 idiomas, oferecendo:</div><div><br></div>` +
`<div>- Tradução juramentada, com assinatura física ou digital;</div>` +
`<div>- Tradução técnica e especializada;</div>` +
`<div>- Tradução livre de documentos;</div>` +
`<div>- Tradução simultânea.</div><div><br></div>` +
`<div>Nosso compromisso é oferecer qualidade, agilidade, organização e preços altamente competitivos, atendendo desde demandas pontuais até grandes volumes de documentos.</div><div><br></div>` +
`<div>Contamos com profissionais qualificados e buscamos construir parcerias duradouras, oferecendo condições comerciais diferenciadas para empresas com demandas recorrentes.</div><div><br></div>` +
`<div>📌 Segue em anexo PDF contendo os valores para tradução juramentada no idioma italiano.<br></div><div><br></div>` +
`<div>Será um prazer entender as necessidades da sua empresa e apresentar uma proposta personalizada, com excelentes condições comerciais.</div><div><br></div>` +
`<div>Fico à disposição para conversarmos!</div><div><br></div>` +
`<div>Atenciosamente,</div><div><br></div>` +
`<div class="hmail-signature-prefix">--</div>` +
`<div class="hmail-signature">` +
`<div><img src="cid:cartao-traduztudo" width="556" height="207" style="width: 556px; max-width: 100%; height: auto; display: block;" alt="Traduz Tudo"><br></div>` +
`</div><div><br></div>` +
`<div style="border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.4;">` +
`Comunicação corporativa B2B em conformidade com a LGPD (Lei 13.709/2018). Caso não queira mais receber nossas apresentações, ` +
`<a href="${unsubUrl}" style="color: #64748b; text-decoration: underline;">clique aqui para descadastrar com 1 clique</a>.` +
`</div>`;

    return { subject, bodyText, bodyHtml };
  }

  /**
   * Classifies an inbound response from a prospect.
   */
  public classifyInboundReply(text: string, subject: string): {
    classification: ProspectReplyClassification;
    confidence: number;
    suggestedFollowUp: string;
  } {
    const combined = `${subject} ${text}`.toLowerCase();

    // 1. Opt-out / Unsubscribe
    if (
      combined.includes('descadastr') ||
      combined.includes('remover') ||
      combined.includes('retirar da lista') ||
      combined.includes('não tenho interesse') ||
      combined.includes('favor não enviar') ||
      combined.includes('stop') ||
      combined.includes('unsubscribe')
    ) {
      return {
        classification: 'SOLICITACAO_REMOCAO',
        confidence: 0.96,
        suggestedFollowUp: 'Adicionar à lista de supressão global e marcar como Descadastrado (LGPD). Não enviar novos contatos.',
      };
    }

    // 2. Budget / Quote request
    if (
      combined.includes('orçamento') ||
      combined.includes('orcamento') ||
      combined.includes('cotação') ||
      combined.includes('cotacao') ||
      combined.includes('quanto custa') ||
      combined.includes('valor da lauda') ||
      combined.includes('tabela de preços') ||
      combined.includes('tabela de valores') ||
      combined.includes('temos um documento')
    ) {
      return {
        classification: 'SOLICITACAO_ORCAMENTO',
        confidence: 0.95,
        suggestedFollowUp: 'Converter imediatamente em Oportunidade/Orçamento no SaaS e solicitar os arquivos para contagem de laudas.',
      };
    }

    // 3. Partnership interest
    if (
      combined.includes('parceria') ||
      combined.includes('podemos conversar') ||
      combined.includes('vamos conversar') ||
      combined.includes('reunião') ||
      combined.includes('reuniao') ||
      combined.includes('me liga') ||
      combined.includes('whatsapp') ||
      combined.includes('interesse') ||
      combined.includes('manda a tabela') ||
      combined.includes('pode enviar')
    ) {
      return {
        classification: 'INTERESSE_PARCERIA',
        confidence: 0.92,
        suggestedFollowUp: 'Lead altamente qualificado! Encaminhar apresentação institucional e tabela de parceiros ou chamar no WhatsApp.',
      };
    }

    // 4. Institutional presentation request
    if (
      combined.includes('apresentação') ||
      combined.includes('apresentacao') ||
      combined.includes('material') ||
      combined.includes('portfólio') ||
      combined.includes('portfolio')
    ) {
      return {
        classification: 'PEDIDO_APRESENTACAO',
        confidence: 0.88,
        suggestedFollowUp: 'Enviar apresentação institucional em PDF com os serviços juramentados e credenciamentos da Junta Comercial.',
      };
    }

    // 5. Automatic response / Out of office
    if (
      combined.includes('auto-reply') ||
      combined.includes('automatic reply') ||
      combined.includes('estou de férias') ||
      combined.includes('ausente') ||
      combined.includes('fora do escritório') ||
      combined.includes('resposta automática')
    ) {
      return {
        classification: 'RESPOSTA_AUTOMATICA',
        confidence: 0.97,
        suggestedFollowUp: 'Mensagem de ausência automática. Manter o contato na fila de acompanhamento.',
      };
    }

    // 6. Delivery failure / Bounce
    if (
      combined.includes('delivery status notification') ||
      combined.includes('undelivered') ||
      combined.includes('mail delivery failed') ||
      combined.includes('user unknown')
    ) {
      return {
        classification: 'ERRO_ENTREGA',
        confidence: 0.98,
        suggestedFollowUp: 'Falha de entrega no endereço. Marcar contato como Inválido.',
      };
    }

    // Default: Generic inquiry
    return {
      classification: 'PEDIDO_INFORMACOES',
      confidence: 0.75,
      suggestedFollowUp: 'Cliente solicitou esclarecimentos. Equipe comercial deve responder e oferecer agendamento.',
    };
  }
}

export const prospectingAIAgent = ProspectingAIAgent.getInstance();
