import { OutboundMessageRecord, OutreachCampaign, ProspectCompany, ProspectSegment } from '@/types/prospecting';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';
import { prospectingAIAgent } from '@/lib/ai/prospectingAIAgent';
import { hostingerMailService } from '@/lib/services/hostingerMailService';
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
   * Retrieves the official company proposal PDF and business card image for outbound prospecting.
   */
  public getStandardAttachments(): Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
    cid?: string;
  }> {
    const list: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
      cid?: string;
    }> = [];

    try {
      const pdfPath = path.join(process.cwd(), 'public', 'attachments', 'Proposta_Comercial_Traduz_Tudo_Italiano.pdf');
      if (fs.existsSync(pdfPath)) {
        list.push({
          filename: 'Proposta_Comercial_Traduz_Tudo_Italiano.pdf',
          content: fs.readFileSync(pdfPath),
          contentType: 'application/pdf',
        });
      }

      const imgPath = path.join(process.cwd(), 'public', 'attachments', 'assinatura-cartao-traduztudo.png');
      if (fs.existsSync(imgPath)) {
        list.push({
          filename: 'assinatura corrigidda.jpeg',
          content: fs.readFileSync(imgPath),
          cid: 'cartao-traduztudo',
          contentType: 'image/jpeg',
        });
      }
    } catch (err: any) {
      console.warn('[CampaignEngine] Erro ao carregar anexos padrão:', err?.message);
    }

    return list;
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

    const eligibleCompanies = await prospectingStorage.getEligibleProspectsForCampaign(campaignSegment, maxLimit);

    console.log(
      `[CampaignEngine] Disparando campanha "${options?.campaignId ? targetCampaign?.name : 'Geral'}". Empresas elegíveis encontradas: ${eligibleCompanies.length}`
    );

    const attachments = this.getStandardAttachments();

    for (const company of eligibleCompanies) {
      result.processedCount++;

      // 1. Suppression List Check (Strict LGPD)
      const suppressed = await prospectingStorage.isSuppressed(company.contactEmail, company.website);
      if (suppressed || company.optOut) {
        result.skippedCount++;
        result.details.push({
          companyId: company.id,
          companyName: company.tradeName || company.name,
          recipientEmail: company.contactEmail,
          status: 'SKIPPED',
          error: 'Destinatário em lista de supressão (Opt-Out LGPD)',
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

      // Human-like cadence delay (1.2 to 2.0 seconds) between emails to protect SMTP sender reputation while fitting serverless execution window
      if (result.processedCount < eligibleCompanies.length) {
        const delayMs = 1200 + Math.floor(Math.random() * 800);
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
