import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { NotificationService } from '../notifications/notification.service';
import { CampaignJobData } from './campaign-automation.service';

@Processor('campaign-execution')
@Injectable()
export class CampaignExecutionProcessor {
  private readonly logger = new Logger(CampaignExecutionProcessor.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly notificationService: NotificationService,
  ) {}

  @Process('send-campaign-message')
  async handleCampaignMessage(job: Job<CampaignJobData>): Promise<void> {
    const { data } = job;
    
    try {
      this.logger.debug(`Processing campaign message for recipient ${data.recipientEmail}`);

      // Get campaign details
      const campaign = await this.campaignRepository.findOne({
        where: { id: data.campaignId },
      });

      if (!campaign) {
        throw new Error(`Campaign ${data.campaignId} not found`);
      }

      // Prepare message content
      const messageContent = this.prepareMessageContent(campaign, data);

      // Send based on campaign type
      switch (campaign.type) {
        case 'email':
          await this.sendEmailCampaign(campaign, data, messageContent);
          break;
        case 'sms':
          await this.sendSmsCampaign(campaign, data, messageContent);
          break;
        case 'push':
          await this.sendPushCampaign(campaign, data, messageContent);
          break;
        case 'in_app':
          await this.sendInAppCampaign(campaign, data, messageContent);
          break;
        default:
          throw new Error(`Unsupported campaign type: ${campaign.type}`);
      }

      // Update campaign metrics
      await this.updateCampaignMetrics(data.campaignId, 'delivered');

      this.logger.debug(`Campaign message sent successfully to ${data.recipientEmail}`);

    } catch (error) {
      this.logger.error(`Failed to send campaign message to ${data.recipientEmail}:`, error);
      
      // Update failure metrics
      await this.updateCampaignMetrics(data.campaignId, 'failed');
      
      throw error; // Re-throw to trigger Bull retry mechanism
    }
  }

  /**
   * Prepare message content with template substitution
   */
  private prepareMessageContent(campaign: Campaign, data: CampaignJobData): {
    subject: string;
    content: string;
    htmlContent?: string;
  } {
    const templateData = {
      customerName: data.recipientName || 'Customer',
      customerEmail: data.recipientEmail,
      tenantName: 'TekAssist', // Could be fetched from tenant data
      ...data.templateData,
    };

    // Simple template substitution
    const subject = this.substituteTemplate(campaign.subject || '', templateData);
    const content = this.substituteTemplate(campaign.content || '', templateData);
    const htmlContent = campaign.htmlContent 
      ? this.substituteTemplate(campaign.htmlContent, templateData)
      : this.generateHtmlFromText(content);

    return { subject, content, htmlContent };
  }

  /**
   * Simple template substitution
   */
  private substituteTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Generate HTML from plain text
   */
  private generateHtmlFromText(text: string): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              This email was sent by TekAssist. If you no longer wish to receive these emails, 
              <a href="#" style="color: #007cba;">unsubscribe here</a>.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send email campaign
   */
  private async sendEmailCampaign(
    campaign: Campaign,
    data: CampaignJobData,
    content: { subject: string; content: string; htmlContent?: string }
  ): Promise<void> {
    if (!data.recipientEmail) {
      throw new Error('Recipient email is required for email campaigns');
    }

    // Add tracking parameters if enabled
    let htmlContent = content.htmlContent || content.content;
    
    if (campaign.settings?.tracking?.openTracking) {
      const trackingPixel = `<img src="https://api.tekassist.com/track/open/${campaign.id}/${data.recipientId}" width="1" height="1" style="display:none;">`;
      htmlContent += trackingPixel;
    }

    if (campaign.settings?.tracking?.clickTracking) {
      // Simple click tracking - would need more sophisticated URL replacement
      htmlContent = htmlContent.replace(
        /<a\s+href="([^"]+)"/g,
        `<a href="https://api.tekassist.com/track/click/${campaign.id}/${data.recipientId}?url=$1"`
      );
    }

    await this.notificationService.sendEmail({
      to: data.recipientEmail,
      subject: content.subject,
      html: htmlContent
    });
  }

  /**
   * Send SMS campaign
   */
  private async sendSmsCampaign(
    campaign: Campaign,
    data: CampaignJobData,
    content: { subject: string; content: string }
  ): Promise<void> {
    if (!data.recipientPhone) {
      throw new Error('Recipient phone is required for SMS campaigns');
    }

    // SMS content should be concise
    const smsContent = content.content.length > 160 
      ? content.content.substring(0, 157) + '...'
      : content.content;

    await this.notificationService.sendSms({
      to: data.recipientPhone,
      body: smsContent
    });
  }

  /**
   * Send push notification campaign
   */
  private async sendPushCampaign(
    campaign: Campaign,
    data: CampaignJobData,
    content: { subject: string; content: string }
  ): Promise<void> {
    // Push notifications would require integration with push service
    // For now, we'll use in-app notifications as a fallback
    this.logger.warn('Push notifications not implemented, falling back to in-app notification');
    await this.sendInAppCampaign(campaign, data, content);
  }

  /**
   * Send in-app notification campaign
   */
  private async sendInAppCampaign(
    campaign: Campaign,
    data: CampaignJobData,
    content: { subject: string; content: string }
  ): Promise<void> {
    if (!data.recipientId) {
      throw new Error('Recipient ID is required for in-app campaigns');
    }

    await this.notificationService.sendInApp({
      userId: data.recipientId,
      tenantId: data.tenantId,
      title: content.subject,
      message: content.content,
      type: 'info',
      metadata: {
        campaignId: campaign.id,
        type: 'campaign',
      }
    });
  }

  /**
   * Update campaign metrics
   */
  private async updateCampaignMetrics(
    campaignId: string,
    metricType: 'delivered' | 'failed'
  ): Promise<void> {
    try {
      const updateField = metricType === 'delivered' ? 'deliveredCount' : 'failedCount';
      
      await this.campaignRepository
        .createQueryBuilder()
        .update(Campaign)
        .set({
          [updateField]: () => `${updateField} + 1`,
        })
        .where('id = :campaignId', { campaignId })
        .execute();

    } catch (error) {
      this.logger.error(`Failed to update campaign metrics for ${campaignId}:`, error);
      // Don't throw here as it's not critical for message delivery
    }
  }

  /**
   * Handle tracking events (open, click, unsubscribe)
   */
  async handleTrackingEvent(
    campaignId: string,
    recipientId: string,
    eventType: 'open' | 'click' | 'unsubscribe'
  ): Promise<void> {
    try {
      let updateField: string;
      
      switch (eventType) {
        case 'open':
          updateField = 'openedCount';
          break;
        case 'click':
          updateField = 'clickedCount';
          break;
        case 'unsubscribe':
          updateField = 'unsubscribedCount';
          break;
        default:
          return;
      }

      await this.campaignRepository
        .createQueryBuilder()
        .update(Campaign)
        .set({
          [updateField]: () => `${updateField} + 1`,
        })
        .where('id = :campaignId', { campaignId })
        .execute();

      this.logger.debug(`Tracked ${eventType} event for campaign ${campaignId}, recipient ${recipientId}`);

    } catch (error) {
      this.logger.error(`Failed to track ${eventType} event:`, error);
    }
  }
}