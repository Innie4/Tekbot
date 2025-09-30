import { Controller, Post, Req, Inject, Logger, HttpStatus, HttpException, RawBodyRequest } from '@nestjs/common';
import { PaystackService } from '../payments/paystack.service';
import { PaymentsService } from '../payments/payments.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { NotificationService } from '../notifications/notification.service';
import { Request } from 'express';

@Controller('webhooks/paystack')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(
    @Inject(PaystackService)
    private readonly paystackService: PaystackService,
    private readonly paymentsService: PaymentsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('payments')
  async handlePayments(@Req() req: RawBodyRequest<Request>) {
    try {
      if (!this.paystackService.verifyWebhook(req)) {
        this.logger.error('Invalid Paystack webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }

      const event = req.body;
      
      switch (event.event) {
        case 'charge.success':
          await this.handleChargeSuccess(event.data);
          break;
        case 'charge.failed':
          await this.handleChargeFailed(event.data);
          break;
        case 'transfer.success':
          await this.handleTransferSuccess(event.data);
          break;
        case 'transfer.failed':
          await this.handleTransferFailed(event.data);
          break;
        case 'subscription.create':
          await this.handleSubscriptionCreated(event.data);
          break;
        case 'subscription.disable':
          await this.handleSubscriptionDisabled(event.data);
          break;
        case 'invoice.create':
          await this.handleInvoiceCreated(event.data);
          break;
        case 'invoice.update':
          await this.handleInvoiceUpdated(event.data);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data);
          break;
        case 'customeridentification.success':
          await this.handleCustomerVerificationSuccess(event.data);
          break;
        case 'customeridentification.failed':
          await this.handleCustomerVerificationFailed(event.data);
          break;
        case 'dispute.create':
          await this.handleDisputeCreated(event.data);
          break;
        case 'dispute.resolve':
          await this.handleDisputeResolved(event.data);
          break;
        default:
          this.logger.warn(`Unhandled Paystack event type: ${event.event}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Paystack webhook error: ${error.message}`, error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  private async handleChargeSuccess(data: any) {
    const { metadata, amount, currency, reference, customer } = data;
    const tenantId = metadata?.tenantId;
    const appointmentId = metadata?.appointmentId;

    if (!tenantId || !appointmentId) {
      this.logger.warn('Missing tenantId or appointmentId in charge metadata');
      return;
    }

    // Update or create payment record
    const existingPayment = await this.paymentsService.findOneForTenant(tenantId, reference);
    if (existingPayment) {
      await this.paymentsService.updateForTenant(tenantId, existingPayment.id, {
        status: 'completed',
        transaction_id: reference,
      });
    } else {
      await this.paymentsService.createForTenant(tenantId, {
        appointmentId,
        amount: amount / 100, // Convert from kobo to naira
        currency: currency.toUpperCase(),
        status: 'completed',
        provider: 'paystack',
        transaction_id: reference,
      });
    }

    // Update appointment status
    await this.appointmentsService.updateForTenant(tenantId, appointmentId, {
      status: 'confirmed',
    });

    // Send notifications
    await this.notificationService.sendPaymentConfirmation(tenantId, appointmentId, amount / 100);
    
    this.logger.log(`Paystack charge succeeded for appointment ${appointmentId}, tenant ${tenantId}`);
  }

  private async handleChargeFailed(data: any) {
    const { metadata, amount, currency, reference } = data;
    const tenantId = metadata?.tenantId;
    const appointmentId = metadata?.appointmentId;

    if (!tenantId || !appointmentId) {
      this.logger.warn('Missing tenantId or appointmentId in charge metadata');
      return;
    }

    // Create payment record with failed status
    await this.paymentsService.createForTenant(tenantId, {
      appointmentId,
      amount: amount / 100,
      currency: currency.toUpperCase(),
      status: 'failed',
      provider: 'paystack',
      transaction_id: reference,
    });

    // Update appointment status
    await this.appointmentsService.updateForTenant(tenantId, appointmentId, {
      status: 'payment_failed',
    });

    // Send failure notification
    await this.notificationService.sendPaymentFailure(tenantId, appointmentId);
    
    this.logger.warn(`Paystack charge failed for appointment ${appointmentId}, tenant ${tenantId}`);
  }

  private async handleTransferSuccess(data: any) {
    const { reference, amount, recipient } = data;
    this.logger.log(`Transfer successful: ${reference}, Amount: ${amount / 100}`);
    
    // Handle successful transfer logic (payouts, refunds, etc.)
    // This could involve updating payout records, notifying recipients, etc.
  }

  private async handleTransferFailed(data: any) {
    const { reference, amount, recipient, failure_reason } = data;
    this.logger.error(`Transfer failed: ${reference}, Amount: ${amount / 100}, Reason: ${failure_reason}`);
    
    // Handle failed transfer logic
    await this.notificationService.sendAdminAlert('Transfer Failed', 
      `Transfer ${reference} failed. Amount: ₦${amount / 100}. Reason: ${failure_reason}`);
  }

  private async handleSubscriptionCreated(data: any) {
    const { customer, plan, subscription_code } = data;
    const tenantId = data.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn('Missing tenantId in subscription metadata');
      return;
    }

    this.logger.log(`Paystack subscription created for tenant ${tenantId}`);
    // Handle subscription creation logic
  }

  private async handleSubscriptionDisabled(data: any) {
    const { customer, subscription_code } = data;
    const tenantId = data.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn('Missing tenantId in subscription metadata');
      return;
    }

    this.logger.log(`Paystack subscription disabled for tenant ${tenantId}`);
    // Handle subscription cancellation logic
  }

  private async handleInvoiceCreated(data: any) {
    const { customer, amount, due_date } = data;
    const tenantId = data.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn('Missing tenantId in invoice metadata');
      return;
    }

    this.logger.log(`Invoice created for tenant ${tenantId}, Amount: ₦${amount / 100}`);
    // Handle invoice creation logic
  }

  private async handleInvoiceUpdated(data: any) {
    const { customer, amount, status } = data;
    const tenantId = data.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn('Missing tenantId in invoice metadata');
      return;
    }

    this.logger.log(`Invoice updated for tenant ${tenantId}, Status: ${status}`);
    // Handle invoice update logic
  }

  private async handleInvoicePaymentFailed(data: any) {
    const { customer, amount } = data;
    const tenantId = data.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn('Missing tenantId in invoice metadata');
      return;
    }

    this.logger.warn(`Invoice payment failed for tenant ${tenantId}`);
    await this.notificationService.sendAdminAlert('Invoice Payment Failed', 
      `Invoice payment failed for tenant ${tenantId}. Amount: ₦${amount / 100}`);
  }

  private async handleCustomerVerificationSuccess(data: any) {
    const { customer_id, customer_code } = data;
    this.logger.log(`Customer verification successful: ${customer_code}`);
    // Handle successful customer verification
  }

  private async handleCustomerVerificationFailed(data: any) {
    const { customer_id, customer_code, reason } = data;
    this.logger.warn(`Customer verification failed: ${customer_code}, Reason: ${reason}`);
    // Handle failed customer verification
  }

  private async handleDisputeCreated(data: any) {
    const { transaction, amount, currency, reason } = data;
    
    this.logger.error(`Dispute created for transaction: ${transaction.reference}`, {
      amount: amount / 100,
      currency,
      reason,
    });

    // Send alert to admin
    await this.notificationService.sendAdminAlert('Payment Dispute', 
      `A dispute has been created for transaction ${transaction.reference}. Amount: ₦${amount / 100}. Reason: ${reason}`);
  }

  private async handleDisputeResolved(data: any) {
    const { transaction, resolution } = data;
    
    this.logger.log(`Dispute resolved for transaction: ${transaction.reference}, Resolution: ${resolution}`);
    
    // Handle dispute resolution logic
    await this.notificationService.sendAdminAlert('Dispute Resolved', 
      `Dispute for transaction ${transaction.reference} has been resolved: ${resolution}`);
  }
}
