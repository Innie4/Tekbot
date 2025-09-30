import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { ErrorHandlerUtil, ErrorContext } from '../../common/utils/error-handler.util';

export interface SendSmsOptions {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface SendWhatsAppOptions {
  to: string;
  body?: string;
  mediaUrl?: string[];
  contentSid?: string;
  contentVariables?: Record<string, string>;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: Twilio.Twilio;
  
  constructor(private readonly configService: ConfigService) {
    this.client = Twilio(
      configService.get<string>('TWILIO_ACCOUNT_SID'),
      configService.get<string>('TWILIO_AUTH_TOKEN')
    );
  }

  async sendSms(options: SendSmsOptions, context?: Partial<ErrorContext>) {
    const errorContext: ErrorContext = {
      service: 'TwilioService',
      method: 'sendSms',
      ...context,
      metadata: { to: options.to, ...context?.metadata },
    };

    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        this.logger.log(`Sending SMS to ${options.to}`, { context: errorContext });
        
        const message = await this.client.messages.create({
          to: options.to,
          from: options.from || this.configService.get<string>('TWILIO_PHONE_NUMBER'),
          body: options.body,
          mediaUrl: options.mediaUrl,
          statusCallback: options.statusCallback,
        });

        this.logger.log(`SMS sent successfully: ${message.sid}`, { 
          context: errorContext,
          messageSid: message.sid,
          status: message.status,
        });

        return message;
      },
      errorContext,
      30000, // 30 second timeout
      {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
      }
    );
  }

  async sendWhatsApp(options: SendWhatsAppOptions, context?: Partial<ErrorContext>) {
    const errorContext: ErrorContext = {
      service: 'TwilioService',
      method: 'sendWhatsApp',
      ...context,
      metadata: { to: options.to, ...context?.metadata },
    };

    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        this.logger.log(`Sending WhatsApp message to ${options.to}`, { context: errorContext });
        
        const whatsappNumber = options.to.startsWith('whatsapp:') 
          ? options.to 
          : `whatsapp:${options.to}`;
        
        const fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');
        if (!fromNumber) {
          throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
        }

        const messageData: any = {
          to: whatsappNumber,
          from: `whatsapp:${fromNumber}`,
        };

        if (options.contentSid) {
          messageData.contentSid = options.contentSid;
          messageData.contentVariables = JSON.stringify(options.contentVariables || {});
        } else {
          messageData.body = options.body;
          messageData.mediaUrl = options.mediaUrl;
        }

        const message = await this.client.messages.create(messageData);

        this.logger.log(`WhatsApp message sent successfully: ${message.sid}`, { 
          context: errorContext,
          messageSid: message.sid,
          status: message.status,
        });

        return message;
      },
      errorContext,
      30000,
      {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
      }
    );
  }

  async sendVerificationCode(phoneNumber: string, context?: Partial<ErrorContext>) {
    const errorContext: ErrorContext = {
      service: 'TwilioService',
      method: 'sendVerificationCode',
      ...context,
      metadata: { phoneNumber, ...context?.metadata },
    };

    const verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    if (!verifyServiceSid) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID not configured');
    }

    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        this.logger.log(`Sending verification code to ${phoneNumber}`, { context: errorContext });
        
        const verification = await this.client.verify.v2
          .services(verifyServiceSid)
          .verifications
          .create({ to: phoneNumber, channel: 'sms' });

        this.logger.log(`Verification code sent: ${verification.sid}`, { 
          context: errorContext,
          verificationSid: verification.sid,
          status: verification.status,
        });

        return verification;
      },
      errorContext,
      30000,
      {
        maxAttempts: 2,
        delay: 2000,
      }
    );
  }

  async verifyCode(phoneNumber: string, code: string, context?: Partial<ErrorContext>) {
    const errorContext: ErrorContext = {
      service: 'TwilioService',
      method: 'verifyCode',
      ...context,
      metadata: { phoneNumber, ...context?.metadata },
    };

    const verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    if (!verifyServiceSid) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID not configured');
    }

    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        this.logger.log(`Verifying code for ${phoneNumber}`, { context: errorContext });
        
        const verificationCheck = await this.client.verify.v2
          .services(verifyServiceSid)
          .verificationChecks
          .create({ to: phoneNumber, code });

        this.logger.log(`Code verification result: ${verificationCheck.status}`, { 
          context: errorContext,
          status: verificationCheck.status,
          valid: verificationCheck.valid,
        });

        return verificationCheck;
      },
      errorContext,
      15000,
      {
        maxAttempts: 1, // Don't retry verification checks
      }
    );
  }

  async verifyWebhook(req: any): Promise<boolean> {
    const errorContext: ErrorContext = {
      service: 'TwilioService',
      method: 'verifyWebhook',
    };

    return ErrorHandlerUtil.handleAsync(
      async () => {
        const twilioSignature = req.headers['x-twilio-signature'];
        if (!twilioSignature) {
          this.logger.warn('Missing Twilio signature header', { context: errorContext });
          return false;
        }

        const url = req.protocol + '://' + req.get('host') + req.originalUrl;
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        const params = req.body;
        
        const twilio = require('twilio');
        const isValid = twilio.validateRequest(authToken, twilioSignature, url, params);
        
        if (!isValid) {
          this.logger.warn('Invalid Twilio webhook signature', { 
            context: errorContext,
            url,
            signature: twilioSignature,
          });
        }

        return isValid;
      },
      errorContext,
      false // Return false if verification fails
    );
  }

  async getMessageStatus(messageSid: string, context?: Partial<ErrorContext>) {
    const errorContext: ErrorContext = {
      service: 'TwilioService',
      method: 'getMessageStatus',
      ...context,
      metadata: { messageSid, ...context?.metadata },
    };

    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        const message = await this.client.messages(messageSid).fetch();
        
        this.logger.log(`Retrieved message status: ${message.status}`, { 
          context: errorContext,
          messageSid,
          status: message.status,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
        });

        return message;
      },
      errorContext,
      15000,
      {
        maxAttempts: 2,
        delay: 1000,
      }
    );
  }

  async lookupPhoneNumber(phoneNumber: string, context?: Partial<ErrorContext>) {
    const errorContext: ErrorContext = {
      service: 'TwilioService',
      method: 'lookupPhoneNumber',
      ...context,
      metadata: { phoneNumber, ...context?.metadata },
    };

    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        const lookup = await this.client.lookups.v2
          .phoneNumbers(phoneNumber)
          .fetch({ fields: 'line_type_intelligence' });

        this.logger.log(`Phone number lookup completed`, { 
          context: errorContext,
          phoneNumber,
          valid: lookup.valid,
          lineType: lookup.lineTypeIntelligence?.type,
        });

        return lookup;
      },
      errorContext,
      15000,
      {
        maxAttempts: 2,
        delay: 1000,
      }
    );
  }
}
