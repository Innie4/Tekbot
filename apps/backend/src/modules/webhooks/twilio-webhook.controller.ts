import { Controller, Post, Req, Inject, Logger, HttpStatus, HttpException, Headers, SetMetadata } from '@nestjs/common';
import { TwilioService } from '../messaging/twilio.service';
import { ConversationsService } from '../conversations/conversations.service';
import { NotificationService } from '../notifications/notification.service';
import { CustomersService } from '../customers/customers.service';

interface TwilioWebhookEvent {
  MessageSid?: string;
  AccountSid?: string;
  MessagingServiceSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  SmsStatus?: string;
  MessageStatus?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  SmsSid?: string;
  SmsMessageSid?: string;
  NumSegments?: string;
  Price?: string;
  PriceUnit?: string;
  ApiVersion?: string;
  Direction?: string;
  ForwardedFrom?: string;
  CallerName?: string;
  ProfileName?: string;
  WaId?: string;
  ButtonText?: string;
  ButtonPayload?: string;
  ListId?: string;
  ListTitle?: string;
  Description?: string;
}

@Controller('webhooks/twilio')
@SetMetadata('skipThrottle', true)
export class TwilioWebhookController {
  private readonly logger = new Logger(TwilioWebhookController.name);

  constructor(
    @Inject(TwilioService)
    private readonly twilioService: TwilioService,
    private readonly conversationsService: ConversationsService,
    private readonly notificationService: NotificationService,
    private readonly customersService: CustomersService,
  ) {}

  @Post('messages')
  async handleMessages(@Req() req: any) {
    try {
      if (!this.twilioService.verifyWebhook(req)) {
        this.logger.warn('Invalid Twilio webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      const event: TwilioWebhookEvent = req.body;
      this.logger.log(`Received Twilio message webhook: ${JSON.stringify(event)}`);

      // Handle different message events
      if (event.SmsStatus || event.MessageStatus) {
        await this.handleMessageStatus(event);
      } else if (event.Body && event.From) {
        await this.handleIncomingMessage(event);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Twilio message webhook error: ${error.message}`, error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('sms')
  async handleSms(@Req() req: any) {
    try {
      if (!this.twilioService.verifyWebhook(req)) {
        this.logger.warn('Invalid Twilio SMS webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      const event: TwilioWebhookEvent = req.body;
      this.logger.log(`Received Twilio SMS webhook: ${JSON.stringify(event)}`);

      await this.handleIncomingMessage(event);
      return { received: true };
    } catch (error) {
      this.logger.error(`Twilio SMS webhook error: ${error.message}`, error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('whatsapp')
  async handleWhatsApp(@Req() req: any) {
    try {
      if (!this.twilioService.verifyWebhook(req)) {
        this.logger.warn('Invalid Twilio WhatsApp webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      const event: TwilioWebhookEvent = req.body;
      this.logger.log(`Received Twilio WhatsApp webhook: ${JSON.stringify(event)}`);

      await this.handleWhatsAppMessage(event);
      return { received: true };
    } catch (error) {
      this.logger.error(`Twilio WhatsApp webhook error: ${error.message}`, error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('status')
  async handleStatus(@Req() req: any) {
    try {
      if (!this.twilioService.verifyWebhook(req)) {
        this.logger.warn('Invalid Twilio status webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      const event: TwilioWebhookEvent = req.body;
      this.logger.log(`Received Twilio status webhook: ${JSON.stringify(event)}`);

      await this.handleMessageStatus(event);
      return { received: true };
    } catch (error) {
      this.logger.error(`Twilio status webhook error: ${error.message}`, error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  private async handleIncomingMessage(event: TwilioWebhookEvent): Promise<void> {
    try {
      const phoneNumber = this.normalizePhoneNumber(event.From);
      const messageBody = event.Body || '';
      const channel = event.From?.startsWith('whatsapp:') ? 'whatsapp' : 'sms';

      // Find or create customer by phone number
      let customer = await this.customersService.findByPhone(phoneNumber);
      if (!customer) {
        customer = await this.customersService.create({
          phone: phoneNumber,
          name: event.ProfileName || event.CallerName || `Customer ${phoneNumber}`,
        });
      }

      // Find or create conversation
      let conversation = await this.conversationsService.getConversationsByCustomer(
        customer.id,
        customer.tenantId
      );

      // Get the first active conversation or create a new one
      let activeConversation = conversation.find(c => c.status === 'active' && c.channel === channel);
      
      if (!activeConversation) {
        activeConversation = await this.conversationsService.create({
          tenantId: customer.tenantId,
          customerId: customer.id,
          channel,
          title: `${channel.toUpperCase()} conversation with ${customer.name}`,
          metadata: {
            twilioMessageSid: event.MessageSid,
            from: event.From,
            to: event.To,
          },
        });
      }

      // Create message record
      const messageData = {
        conversationId: activeConversation.id,
        tenantId: customer.tenantId,
        customerId: customer.id,
        channel,
        direction: 'inbound',
        content: messageBody,
        metadata: {
          twilioMessageSid: event.MessageSid,
          from: event.From,
          to: event.To,
          numMedia: event.NumMedia,
          mediaUrl: event.MediaUrl0,
          mediaContentType: event.MediaContentType0,
          profileName: event.ProfileName,
          waId: event.WaId,
          buttonText: event.ButtonText,
          buttonPayload: event.ButtonPayload,
        },
      };

      await this.conversationsService.addMessage(activeConversation.id, customer.tenantId, messageData);

      // Send notification to admin/staff
      await this.notificationService.sendInApp({
        tenantId: customer.tenantId,
        title: `New ${channel.toUpperCase()} message`,
        message: `${customer.name}: ${messageBody}`,
        type: 'message_received',
        metadata: {
          conversationId: activeConversation.id,
          customerId: customer.id,
          channel,
        },
      });

      this.logger.log(`Processed incoming ${channel} message from ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Error handling incoming message: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleWhatsAppMessage(event: TwilioWebhookEvent): Promise<void> {
    try {
      // Handle WhatsApp-specific features
      if (event.ButtonPayload) {
        await this.handleWhatsAppButtonResponse(event);
      } else if (event.ListId) {
        await this.handleWhatsAppListResponse(event);
      } else {
        await this.handleIncomingMessage(event);
      }
    } catch (error) {
      this.logger.error(`Error handling WhatsApp message: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleWhatsAppButtonResponse(event: TwilioWebhookEvent): Promise<void> {
    this.logger.log(`WhatsApp button response: ${event.ButtonText} - ${event.ButtonPayload}`);
    
    // Create a modified event for button response
    const buttonEvent = {
      ...event,
      Body: `Button: ${event.ButtonText} (${event.ButtonPayload})`,
    };

    await this.handleIncomingMessage(buttonEvent);
  }

  private async handleWhatsAppListResponse(event: TwilioWebhookEvent): Promise<void> {
    this.logger.log(`WhatsApp list response: ${event.ListTitle} - ${event.Description}`);
    
    // Create a modified event for list response
    const listEvent = {
      ...event,
      Body: `List: ${event.ListTitle} - ${event.Description}`,
    };

    await this.handleIncomingMessage(listEvent);
  }

  private async handleMessageStatus(event: TwilioWebhookEvent): Promise<void> {
    try {
      const status = event.SmsStatus || event.MessageStatus;
      const messageSid = event.MessageSid || event.SmsSid || event.SmsMessageSid;

      this.logger.log(`Message status update: ${messageSid} - ${status}`);

      // Handle different status types
      switch (status) {
        case 'delivered':
          await this.handleMessageDelivered(event);
          break;
        case 'failed':
        case 'undelivered':
          await this.handleMessageFailed(event);
          break;
        case 'read':
          await this.handleMessageRead(event);
          break;
        case 'sent':
          await this.handleMessageSent(event);
          break;
        default:
          this.logger.log(`Unhandled message status: ${status}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message status: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleMessageDelivered(event: TwilioWebhookEvent): Promise<void> {
    this.logger.log(`Message delivered: ${event.MessageSid}`);
    // TODO: Update message delivery status in database
    // TODO: Send delivery confirmation to admin if needed
  }

  private async handleMessageFailed(event: TwilioWebhookEvent): Promise<void> {
    this.logger.error(`Message failed: ${event.MessageSid} - ${event.ErrorCode}: ${event.ErrorMessage}`);
    
    // Send alert to admin about failed message
    await this.notificationService.sendSlack({
      channel: 'alerts',
      text: `⚠️ Message delivery failed: ${event.ErrorCode} - ${event.ErrorMessage}`,
    });

    // TODO: Update message status in database
    // TODO: Implement retry logic if appropriate
  }

  private async handleMessageRead(event: TwilioWebhookEvent): Promise<void> {
    this.logger.log(`Message read: ${event.MessageSid}`);
    // TODO: Update message read status in database
  }

  private async handleMessageSent(event: TwilioWebhookEvent): Promise<void> {
    this.logger.log(`Message sent: ${event.MessageSid}`);
    // TODO: Update message sent status in database
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove whatsapp: prefix if present
    let normalized = phoneNumber.replace(/^whatsapp:/, '');
    
    // Remove any non-digit characters except +
    normalized = normalized.replace(/[^\d+]/g, '');
    
    return normalized;
  }
}
