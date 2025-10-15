import { Controller, Post, Body, Headers, Inject, Logger, HttpStatus, HttpException, RawBodyRequest, Req, SetMetadata } from '@nestjs/common';
import { StripeService } from '../payments/stripe.service';
import { PaymentsService } from '../payments/payments.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { NotificationService } from '../notifications/notification.service';
import Stripe from 'stripe';
import { Request } from 'express';

@Controller('webhooks/stripe')
@SetMetadata('skipThrottle', true)
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    @Inject(StripeService)
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('payments')
  async handlePayments(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    try {
      const event = await this.stripeService.verifyWebhook(req.rawBody, sig);
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDispute(event.data.object as Stripe.Dispute);
          break;
        default:
          this.logger.warn(`Unhandled payment event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Stripe payment webhook error: ${error.message}`, error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('subscriptions')
  async handleSubscriptions(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    try {
      const event = await this.stripeService.verifyWebhook(req.rawBody, sig);
      
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          this.logger.warn(`Unhandled subscription event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Stripe subscription webhook error: ${error.message}`, error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('customers')
  async handleCustomers(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') sig: string) {
    try {
      const event = await this.stripeService.verifyWebhook(req.rawBody, sig);
      
      switch (event.type) {
        case 'customer.created':
          await this.handleCustomerCreated(event.data.object as Stripe.Customer);
          break;
        case 'customer.updated':
          await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
          break;
        case 'customer.deleted':
          await this.handleCustomerDeleted(event.data.object as Stripe.Customer);
          break;
        default:
          this.logger.warn(`Unhandled customer event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Stripe customer webhook error: ${error.message}`, error.stack);
      throw new HttpException('Webhook processing failed', HttpStatus.BAD_REQUEST);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { metadata } = paymentIntent;
    const tenantId = metadata?.tenantId;
    const appointmentId = metadata?.appointmentId;

    if (!tenantId || !appointmentId) {
      this.logger.warn('Missing tenantId or appointmentId in payment metadata');
      return;
    }

    // Update payment record
    const payment = await this.paymentsService.findOneForTenant(tenantId, paymentIntent.id);
    if (payment) {
      await this.paymentsService.updateForTenant(tenantId, payment.id, {
        status: 'completed',
        transaction_id: paymentIntent.id,
      });
    } else {
      // Create new payment record
      await this.paymentsService.createForTenant(tenantId, {
        appointmentId,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'completed',
        provider: 'stripe',
        transaction_id: paymentIntent.id,
      });
    }

    // Update appointment status
    await this.appointmentsService.updateForTenant(tenantId, appointmentId, {
      status: 'confirmed',
    });

    // Send notifications
    await this.notificationService.sendPaymentConfirmation(tenantId, appointmentId, paymentIntent.amount / 100);
    
    this.logger.log(`Payment succeeded for appointment ${appointmentId}, tenant ${tenantId}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const { metadata } = paymentIntent;
    const tenantId = metadata?.tenantId;
    const appointmentId = metadata?.appointmentId;

    if (!tenantId || !appointmentId) {
      this.logger.warn('Missing tenantId or appointmentId in payment metadata');
      return;
    }

    // Update payment record
    await this.paymentsService.createForTenant(tenantId, {
      appointmentId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'failed',
      provider: 'stripe',
      transaction_id: paymentIntent.id,
    });

    // Update appointment status
    await this.appointmentsService.updateForTenant(tenantId, appointmentId, {
      status: 'payment_failed',
    });

    // Send failure notification
    await this.notificationService.sendPaymentFailure(tenantId, appointmentId);
    
    this.logger.warn(`Payment failed for appointment ${appointmentId}, tenant ${tenantId}`);
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    const { metadata } = paymentIntent;
    const tenantId = metadata?.tenantId;
    const appointmentId = metadata?.appointmentId;

    if (!tenantId || !appointmentId) {
      this.logger.warn('Missing tenantId or appointmentId in payment metadata');
      return;
    }

    // Update payment record
    await this.paymentsService.createForTenant(tenantId, {
      appointmentId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'canceled',
      provider: 'stripe',
      transaction_id: paymentIntent.id,
    });

    // Update appointment status
    await this.appointmentsService.updateForTenant(tenantId, appointmentId, {
      status: 'payment_canceled',
    });
    
    this.logger.log(`Payment canceled for appointment ${appointmentId}, tenant ${tenantId}`);
  }

  private async handleChargeDispute(dispute: Stripe.Dispute) {
    const charge = dispute.charge as Stripe.Charge;
    const paymentIntent = charge.payment_intent as string;
    
    // Log dispute for manual review
    this.logger.error(`Charge dispute created for payment intent: ${paymentIntent}`, {
      disputeId: dispute.id,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
    });

    // Send alert to admin
    await this.notificationService.sendAdminAlert('Payment Dispute', 
      `A dispute has been created for payment ${paymentIntent}. Amount: $${dispute.amount / 100}. Reason: ${dispute.reason}`);
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      this.logger.warn('Missing tenantId in subscription metadata');
      return;
    }

    this.logger.log(`Subscription created for tenant ${tenantId}, customer ${customerId}`);
    // Additional subscription logic can be added here
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata?.tenantId;
    
    if (!tenantId) {
      this.logger.warn('Missing tenantId in subscription metadata');
      return;
    }

    this.logger.log(`Subscription updated for tenant ${tenantId}`);
    // Handle subscription changes (plan upgrades, downgrades, etc.)
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata?.tenantId;
    
    if (!tenantId) {
      this.logger.warn('Missing tenantId in subscription metadata');
      return;
    }

    this.logger.log(`Subscription canceled for tenant ${tenantId}`);
    // Handle subscription cancellation logic
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const tenantId = invoice.metadata?.tenantId;
    
    if (!tenantId) {
      this.logger.warn('Missing tenantId in invoice metadata');
      return;
    }

    this.logger.log(`Invoice payment succeeded for tenant ${tenantId}`);
    // Handle successful invoice payment
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const tenantId = invoice.metadata?.tenantId;
    
    if (!tenantId) {
      this.logger.warn('Missing tenantId in invoice metadata');
      return;
    }

    this.logger.warn(`Invoice payment failed for tenant ${tenantId}`);
    // Handle failed invoice payment
    await this.notificationService.sendAdminAlert('Invoice Payment Failed', 
      `Invoice payment failed for tenant ${tenantId}. Amount: $${invoice.amount_due / 100}`);
  }

  private async handleCustomerCreated(customer: Stripe.Customer) {
    this.logger.log(`Customer created: ${customer.id}`);
    // Handle new customer creation logic
  }

  private async handleCustomerUpdated(customer: Stripe.Customer) {
    this.logger.log(`Customer updated: ${customer.id}`);
    // Handle customer update logic
  }

  private async handleCustomerDeleted(customer: Stripe.Customer) {
    this.logger.log(`Customer deleted: ${customer.id}`);
    // Handle customer deletion logic
  }
}
