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

    const companyDisplayName = company.tradeName || company.name;
    const servicesList = company.relevantServices.slice(0, 3).map((s) => `• ${s}`).join('\n');
    const languages = company.targetLanguages.join(', ');

    let subject = '';
    let introHook = '';

    switch (company.segment) {
      case 'CIDADANIA_ITALIANA':
        subject = `Parceria em Traduções Juramentadas e Apostilamento — ${companyDisplayName} & Traduz Tudo`;
        introHook =
          `Olá equipe da ${companyDisplayName},\n\n` +
          `Acompanhamos o trabalho sério que vocês realizam na assessoria de cidadania e gostaríamos de propor uma parceria comercial.\n\n` +
          `Sabemos como o prazo e a aceitação das certidões perante consulados e tribunais italianos são vitais para o sucesso dos processos dos seus clientes.`;
        break;

      case 'CIDADANIA_PORTUGUESA_ESPANHOLA':
        subject = `Traduções Juramentadas para Cidadania & Dossiês — ${companyDisplayName}`;
        introHook =
          `Olá equipe da ${companyDisplayName},\n\n` +
          `Entramos em contato para apresentar a Traduz Tudo como parceira oficial de traduções juramentadas para seus processos de cidadania portuguesa e espanhola.`;
        break;

      case 'VISTOS_IMIGRACAO':
        subject = `Agilidade em Traduções Juramentadas para Processos de Vistos — ${companyDisplayName}`;
        introHook =
          `Olá,\n\n` +
          `A Traduz Tudo apoia assessorias de imigração e vistos com traduções juramentadas e certificadas de comprovantes, certidões e cartas de recomendação em prazos prioritários.`;
        break;

      case 'INTERCAMBIO':
      case 'ENSINO_INTERNACIONAL':
        subject = `Traduções Juramentadas de Diplomas e Históricos para ${companyDisplayName}`;
        introHook =
          `Olá equipe da ${companyDisplayName},\n\n` +
          `Sabemos que seus intercambistas e alunos frequentemente necessitam de traduções juramentadas de históricos escolares, ementas e diplomas para admissão no exterior.\n\n` +
          `Gostaríamos de firmar uma parceria com condições exclusivas e tabela especial para os seus estudantes.`;
        break;

      case 'COMERCIO_EXTERIOR':
      case 'IMPORTACAO_EXPORTACAO':
        subject = `Traduções Técnicas e Juramentadas de Contratos Internacionais — ${companyDisplayName}`;
        introHook =
          `Prezados da ${companyDisplayName},\n\n` +
          `A Traduz Tudo é especializada em traduções corporativas, técnicas e juramentadas de contratos mercantis, faturas comerciais, laudos e documentos alfandegários com faturamento direto para PJ.`;
        break;

      case 'ADVOCACIA_INTERNACIONAL':
        subject = `Suporte em Traduções Juramentadas Oficiais para ${companyDisplayName}`;
        introHook =
          `Prezados doutores da ${companyDisplayName},\n\n` +
          `Entramos em contato para colocar a Traduz Tudo à disposição do seu escritório para a tradução juramentada de procurações, cartas rogatórias, laudos periciais e contratos internacionais.`;
        break;

      default:
        subject = `Parceria Comercial em Traduções Juramentadas e Técnicas — ${companyDisplayName}`;
        introHook =
          `Olá equipe da ${companyDisplayName},\n\n` +
          `Apresentamos a Traduz Tudo, especializada em traduções juramentadas oficiais, técnicas e simultâneas para empresas com atuação internacional.`;
        break;
    }

    const bodyText =
      `${introHook}\n\n` +
      `Por que empresas do seu segmento escolhem a Traduz Tudo?\n` +
      `${servicesList}\n` +
      `• Idiomas atendidos: ${languages} e demais idiomas internacionais\n` +
      `• Tradutores Juramentados habilitados na Junta Comercial\n` +
      `• Emissão com assinatura digital ICP-Brasil (validade jurídica imediata) e vias físicas\n` +
      `• Tabela de preços exclusiva e condições diferenciadas para parceiros recorrentes\n\n` +
      `Podemos agendar uma rápida conversa de 5 minutos ou enviar nossa apresentação e tabela de parceiros?\n\n` +
      `Será um prazer colaborar com os projetos da ${companyDisplayName}!\n\n` +
      `Atenciosamente,\n` +
      `Departamento Comercial | Traduz Tudo\n` +
      `E-mail: contato@traduztudo.com\n` +
      `Website: https://traduztudo.com\n` +
      `WhatsApp Corporativo: +55 (11) 94748-5091\n\n` +
      `---\n` +
      `Informação Legal e Privacidade (LGPD):\n` +
      `Este e-mail é uma comunicação institucional B2B enviada com base no Legítimo Interesse (Art. 7º, IX da Lei 13.709/18). ` +
      `Caso sua empresa não deseje mais receber nossas apresentações, você pode solicitar a remoção imediata respondendo este e-mail ou clicando no link seguro de descadastro:\n` +
      `${unsubUrl}`;

    const bodyHtml =
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">` +
      `<p style="font-size: 15px; margin-bottom: 16px;">${introHook.replace(/\n\n/g, '</p><p style="font-size: 15px; margin-bottom: 16px;">').replace(/\n/g, '<br/>')}</p>` +
      `<div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">` +
      `<p style="font-weight: 600; margin: 0 0 10px 0; color: #0f172a; font-size: 14px;">Diferenciais Traduz Tudo para sua empresa:</p>` +
      `<ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">` +
      company.relevantServices.slice(0, 3).map((s) => `<li style="margin-bottom: 4px;">${s}</li>`).join('') +
      `<li style="margin-bottom: 4px;">Idiomas: <strong>${languages}</strong></li>` +
      `<li style="margin-bottom: 4px;">Tradutores habilitados na Junta Comercial e assinatura digital ICP-Brasil</li>` +
      `<li style="margin-bottom: 4px;">Tabela especial com faturamento PJ para parceiros</li>` +
      `</ul>` +
      `</div>` +
      `<p style="font-size: 15px; margin-bottom: 20px;">Podemos agendar uma rápida conversa ou enviar nossa tabela de parceiros em PDF?</p>` +
      `<p style="font-size: 15px; margin-bottom: 24px;">Será um prazer apoiar as demandas da <strong>${companyDisplayName}</strong>!</p>` +
      `<div style="border-top: 2px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #475569;">` +
      `<p style="margin: 0 0 4px 0; font-weight: 600; color: #0f172a;">Departamento Comercial | Traduz Tudo</p>` +
      `<p style="margin: 0 0 4px 0;">E-mail: <a href="mailto:contato@traduztudo.com" style="color: #2563eb; text-decoration: none;">contato@traduztudo.com</a> | Site: <a href="https://traduztudo.com" style="color: #2563eb; text-decoration: none;">traduztudo.com</a></p>` +
      `<p style="margin: 0;">WhatsApp Comercial: <strong>+55 (11) 94748-5091</strong></p>` +
      `</div>` +
      `<div style="border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px; font-size: 11px; color: #94a3b8; line-height: 1.4;">` +
      `Este e-mail é uma comunicação corporativa B2B baseada no Legítimo Interesse (Art. 7º, IX da LGPD). Caso não deseje receber nossos contatos, ` +
      `<a href="${unsubUrl}" style="color: #64748b; text-decoration: underline;">clique aqui para descadastrar com 1 clique</a>.` +
      `</div>` +
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
