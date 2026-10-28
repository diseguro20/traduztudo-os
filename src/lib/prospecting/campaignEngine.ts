import { OutboundMessageRecord, OutreachCampaign, ProspectCompany, ProspectSegment } from '@/types/prospecting';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';
import { prospectingAIAgent } from '@/lib/ai/prospectingAIAgent';
import { hostingerMailService } from '@/lib/services/hostingerMailService';
import { geminiCompanyFinder } from '@/lib/ai/geminiCompanyFinder';
import fs from 'fs';
import path from 'path';

export interface CampaignDispatchOptions {
  campaignId?: string;
  limitCount?: number;
  dryRun?: boolean; // If true, only prepares without calling SMTP
}

export interface CampaignDispatchResult {
  campaignId?: string;
  campaignName?: string;
  processedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  details: Array<{
    companyId: string;
    companyName: string;
    recipientEmail: string;
    status: 'SENT' | 'FAILED' | 'SKIPPED';
    messageId?: string;
    error?: string;
  }>;
}

export class CampaignEngine {
  private static instance: CampaignEngine;

  private constructor() {}

  public static getInstance(): CampaignEngine {
    if (!CampaignEngine.instance) {
      CampaignEngine.instance = new CampaignEngine();
    }
    return CampaignEngine.instance;
  }

  /**
   * Retrieves attachments for outbound prospecting.
   * ANTI-SUSPENSION RULE: Cold initial outreach must NEVER carry heavy PDF attachments (~1MB),
   * as bulk PDF attachments trigger MailChannels and corporate spam filters (Proofpoint/Defender).
   * Presentation is offered via direct link or upon reply.
   */
  public getStandardAttachments(): Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
    cid?: string;
  }> {
    // Deliver cold outreach as clean, ultra-lightweight text/HTML (< 5 KB) for 100% inbox deliverability
    return [];
  }

  /**
   * Dispatches eligible queued outreach emails for an active campaign.
   */
  public async executeCampaignDispatch(options?: CampaignDispatchOptions): Promise<CampaignDispatchResult> {
    const settings = await prospectingStorage.getSettings();
    const campaigns = await prospectingStorage.listCampaigns();

    // Select active campaign or specified
    let targetCampaign: OutreachCampaign | null = null;
    let campaignSegment: ProspectSegment | 'ALL' = 'ALL';

    if (options?.campaignId) {
      targetCampaign = await prospectingStorage.getCampaignById(options.campaignId);
      campaignSegment = targetCampaign ? targetCampaign.segment : 'ALL';
    } else {
      // General batch: dispatch to all eligible prospects across all active segments
      campaignSegment = 'ALL';
      targetCampaign = campaigns.find((c) => c.status === 'ACTIVE') || campaigns[0] || null;
    }

    const maxLimit = options?.limitCount || targetCampaign?.dailyLimit || settings.dailySendLimit || 15;

    const result: CampaignDispatchResult = {
      campaignId: targetCampaign?.id,
      campaignName: options?.campaignId ? targetCampaign?.name : 'Disparo Geral Multi-Segmento',
      processedCount: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      details: [],
    };

    // Circuit breaker check
    if (settings.circuitBreakerTripped) {
      console.warn('[CampaignEngine] Envio abortado: Circuit breaker ativo devido a falhas anteriores.');
      return result;
    }

    let eligibleCompanies = await prospectingStorage.getEligibleProspectsForCampaign(campaignSegment, maxLimit);

    // AUTO-REPLENISHMENT: If eligible queue is low, automatically discover fresh companies with Gemini on the fly!
    if (eligibleCompanies.length < maxLimit) {
      console.log(`[CampaignEngine] Fila baixa (${eligibleCompanies.length}/${maxLimit}). Buscando novas empresas via Agente IA Gemini automaticamente...`);
      const needed = Math.max(10, maxLimit - eligibleCompanies.length + 5);
      const activeSegs = settings.activeSegments && settings.activeSegments.length > 0
        ? settings.activeSegments
        : ['CIDADANIA_ITALIANA', 'ADVOCACIA_INTERNACIONAL', 'COMERCIO_EXTERIOR'];
      const segToDiscover = (campaignSegment !== 'ALL'
        ? campaignSegment
        : activeSegs[Math.floor(Math.random() * activeSegs.length)]) as ProspectSegment;

      try {
        await geminiCompanyFinder.searchAndIngest({
          segment: segToDiscover,
          targetState: 'ALL',
          targetCount: needed,
        });
        // Re-query eligible after Gemini discovery
        eligibleCompanies = await prospectingStorage.getEligibleProspectsForCampaign(campaignSegment, maxLimit);
      } catch (err: any) {
        console.warn('[CampaignEngine] Auto-reposição Gemini aviso:', err?.message);
      }
    }

    console.log(
      `[CampaignEngine] Disparando campanha "${options?.campaignId ? targetCampaign?.name : 'Geral'}". Empresas elegíveis encontradas: ${eligibleCompanies.length}`
    );

    const attachments = this.getStandardAttachments();

    for (const company of eligibleCompanies) {
      result.processedCount++;

      // 1. Suppression List Check (Strict LGPD)
      const suppressed = await prospectingStorage.isSuppressed(company.contactEmail, company.website);
      if (suppressed || company.optOut || company.status === 'CONTATO_PENDENTE' || company.status === 'CONTATO_INVALIDO') {
        result.skippedCount++;
        result.details.push({
          companyId: company.id,
          companyName: company.tradeName || company.name,
          recipientEmail: company.contactEmail,
          status: 'SKIPPED',
          error: 'Destinatário em lista de supressão ou contato pendente/inválido',
        });
        continue;
      }

      // 1.1 Pre-Flight MX DNS Guard: verify recipient domain accepts emails to prevent bounces
      const isMxValid = await geminiCompanyFinder.verifyDomainMx(company.contactEmail);
      if (!isMxValid) {
        console.warn(`[CampaignEngine] Destinatário sem servidor MX válido: ${company.contactEmail}. Descartando e marcando CONTATO_INVALIDO.`);
        await prospectingStorage.updateCompany(company.id, {
          status: 'CONTATO_INVALIDO',
          optOut: true,
          notes: 'Domínio sem registro MX ativo no DNS (bloqueio preventivo contra bounces)',
        });
        result.skippedCount++;
        result.details.push({
          companyId: company.id,
          companyName: company.tradeName || company.name,
          recipientEmail: company.contactEmail,
          status: 'SKIPPED',
          error: 'Domínio sem registro MX ativo no DNS (bloqueio preventivo contra bounces)',
        });
        continue;
      }

      // 2. Generate Tailored Email Message via AI Agent
      const emailContent = prospectingAIAgent.generateOutreachEmail(company);
      const idempotencyKey = `idemp_${company.id}_${Date.now()}`;

      // 3. Dry Run Check
      if (options?.dryRun) {
        result.sentCount++;
        result.details.push({
          companyId: company.id,
          companyName: company.tradeName || company.name,
          recipientEmail: company.contactEmail,
          status: 'SENT',
          messageId: `sim_dry_run_${Date.now()}`,
        });
        continue;
      }

      // 4. Send via Hostinger Mail Service (Nodemailer / SMTP)
      try {
        const sendResult = await hostingerMailService.sendEmail({
          to: company.contactEmail,
          subject: emailContent.subject,
          bodyText: emailContent.bodyText,
          bodyHtml: emailContent.bodyHtml,
          fromName: 'Iago Peixoto | Traduz Tudo',
          attachments,
        });

        const now = new Date().toISOString();

        if (sendResult.success) {
          result.sentCount++;

          // Match campaign per company segment
          const matchedCampaign = options?.campaignId
            ? targetCampaign
            : (campaigns.find((c) => c.segment === company.segment) || campaigns[0] || targetCampaign);

          // Record Outbound Message
          const outboundRecord: OutboundMessageRecord = {
            id: `out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tenantId: 'traduztudo-matriz',
            campaignId: matchedCampaign?.id || 'camp-default',
            companyId: company.id,
            recipientEmail: company.contactEmail,
            recipientName: company.tradeName || company.name,
            subject: emailContent.subject,
            bodyText: emailContent.bodyText,
            bodyHtml: emailContent.bodyHtml,
            messageId: sendResult.messageId,
            sentAt: now,
            status: 'SENT',
            idempotencyKey,
          };

          await prospectingStorage.saveOutboundMessage(outboundRecord);

          // Update Company Stage and Activity
          await prospectingStorage.updateCompany(company.id, {
            status: 'EMAIL_ENVIADO',
            campaignId: matchedCampaign?.id,
            lastContactedAt: now,
            contactCount: (company.contactCount || 0) + 1,
          });

          await prospectingStorage.addActivity(company.id, {
            type: 'EMAIL_SENT',
            description: `E-mail de prospecção comercial enviado com sucesso (${sendResult.mode}). Assunto: "${emailContent.subject}"`,
            actor: 'AI_AGENT',
            metadata: {
              messageId: sendResult.messageId,
              campaignId: matchedCampaign?.id,
              mode: sendResult.mode,
            },
          });

          // Update campaign stats
          if (matchedCampaign) {
            await prospectingStorage.updateCampaign(matchedCampaign.id, {
              sentCount: (matchedCampaign.sentCount || 0) + 1,
              deliveredCount: (matchedCampaign.deliveredCount || 0) + 1,
            });
          }

          result.details.push({
            companyId: company.id,
            companyName: company.tradeName || company.name,
            recipientEmail: company.contactEmail,
            status: 'SENT',
            messageId: sendResult.messageId,
          });
        } else {
          result.failedCount++;
          result.details.push({
            companyId: company.id,
            companyName: company.tradeName || company.name,
            recipientEmail: company.contactEmail,
            status: 'FAILED',
            error: sendResult.error || 'Erro no despacho pelo provedor SMTP',
          });
        }
      } catch (err: any) {
        result.failedCount++;
        result.details.push({
          companyId: company.id,
          companyName: company.tradeName || company.name,
          recipientEmail: company.contactEmail,
          status: 'FAILED',
          error: err?.message || 'Falha de conexão',
        });
      }

      // Serverless-safe cadence delay (3 to 5 seconds) between emails to prevent Vercel 60s timeout
      if (result.processedCount < eligibleCompanies.length) {
        const delayMs = 3000 + Math.floor(Math.random() * 2000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Update global settings metrics
    await prospectingStorage.updateSettings({
      lastCronRunAt: new Date().toISOString(),
      lastDispatchCount: result.sentCount,
    });

    console.log(
      `[CampaignEngine] Disparos concluídos: ${result.sentCount} enviados com sucesso, ${result.failedCount} falhas, ${result.skippedCount} ignorados.`
    );

    return result;
  }
}

export const campaignEngine = CampaignEngine.getInstance();
