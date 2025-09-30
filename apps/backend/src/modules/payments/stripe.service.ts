import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { ErrorHandlerUtil, ErrorContext } from '../../common/utils/error-handler.util';

export interface CreatePaymentIntentOptions {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
  paymentMethodTypes?: string[];
  captureMethod?: 'automatic' | 'manual';
  confirmationMethod?: 'automatic' | 'manual';
  description?: string;
}

export interface CreateSubscriptionOptions {
  customerId: string;
  priceId: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
  paymentBehavior?: 'default_incomplete' | 'error_if_incomplete' | 'allow_incomplete';
}

export interface CreateCustomerOptions {
  email?: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  paymentMethod?: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get('stripe');
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
      timeout: config?.timeout || 80000,
      maxNetworkRetries: config?.maxNetworkRetries || 3,
    });
  }

  async createPaymentIntent(
    options: CreatePaymentIntentOptions,
    context?: ErrorContext,
  ): Promise<Stripe.PaymentIntent> {
    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        const paymentIntentData: Stripe.PaymentIntentCreateParams = {
          amount: Math.round(options.amount * 100), // Convert to cents
          currency: options.currency.toLowerCase(),
          metadata: options.metadata || {},
        };

        if (options.customerId) {
          paymentIntentData.customer = options.customerId;
        }

        if (options.paymentMethodTypes) {
          paymentIntentData.payment_method_types = options.paymentMethodTypes;
        }

        if (options.captureMethod) {
          paymentIntentData.capture_method = options.captureMethod;
        }

        if (options.confirmationMethod) {
          paymentIntentData.confirmation_method = options.confirmationMethod;
        }

        if (options.description) {
          paymentIntentData.description = options.description;
        }

        return this.stripe.paymentIntents.create(paymentIntentData);
      },
      {
        service: 'StripeService',
        method: 'createPaymentIntent',
        metadata: { amount: options.amount, currency: options.currency },
        ...context,
      },
      30000, // timeout
      {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
      },
    );
  }

  async createCustomer(
    options: CreateCustomerOptions,
    context?: ErrorContext,
  ): Promise<Stripe.Customer> {
    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        const customerData: Stripe.CustomerCreateParams = {
          metadata: options.metadata || {},
        };

        if (options.email) {
          customerData.email = options.email;
        }

        if (options.name) {
          customerData.name = options.name;
        }

        if (options.phone) {
          customerData.phone = options.phone;
        }

        if (options.paymentMethod) {
          customerData.payment_method = options.paymentMethod;
        }

        return this.stripe.customers.create(customerData);
      },
      {
        service: 'StripeService',
        method: 'createCustomer',
        metadata: { email: options.email },
        ...context,
      },
      30000, // timeout
      {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
      },
    );
  }

  async createSubscription(
    options: CreateSubscriptionOptions,
    context?: ErrorContext,
  ): Promise<Stripe.Subscription> {
    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        const subscriptionData: Stripe.SubscriptionCreateParams = {
          customer: options.customerId,
          items: [{ price: options.priceId }],
          metadata: options.metadata || {},
        };

        if (options.trialPeriodDays) {
          subscriptionData.trial_period_days = options.trialPeriodDays;
        }

        if (options.paymentBehavior) {
          subscriptionData.payment_behavior = options.paymentBehavior;
        }

        return this.stripe.subscriptions.create(subscriptionData);
      },
      {
        service: 'StripeService',
        method: 'createSubscription',
        metadata: { customerId: options.customerId, priceId: options.priceId },
        ...context,
      },
      30000, // timeout
      {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
      },
    );
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
    context?: ErrorContext,
  ): Promise<Stripe.PaymentIntent> {
    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        return this.stripe.paymentIntents.retrieve(paymentIntentId);
      },
      {
        service: 'StripeService',
        method: 'retrievePaymentIntent',
        metadata: { paymentIntentId },
        ...context,
      },
      15000, // timeout
      {
        maxAttempts: 2,
        delay: 1000,
      },
    );
  }

  async cancelPaymentIntent(
    paymentIntentId: string,
    context?: ErrorContext,
  ): Promise<Stripe.PaymentIntent> {
    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        return this.stripe.paymentIntents.cancel(paymentIntentId);
      },
      {
        service: 'StripeService',
        method: 'cancelPaymentIntent',
        metadata: { paymentIntentId },
        ...context,
      },
      15000,
      {
        maxAttempts: 2,
        delay: 1000,
      },
    );
  }

  async retrieveCustomer(
    customerId: string,
    context?: ErrorContext,
  ): Promise<Stripe.Customer> {
    return ErrorHandlerUtil.handleExternalApiCall(
      async () => {
        return this.stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>;
      },
      {
        service: 'StripeService',
        method: 'retrieveCustomer',
        metadata: { customerId },
        ...context,
      },
      15000, // timeout
      {
        maxAttempts: 2,
        delay: 1000,
      },
    );
  }

  async verifyWebhook(payload: any, signature: string): Promise<Stripe.Event> {
    return ErrorHandlerUtil.handleAsync(
      async () => {
        const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        
        if (!endpointSecret) {
          throw new Error('Stripe webhook secret not configured');
        }

        if (!signature) {
          throw new Error('Missing Stripe webhook signature');
        }

        try {
          const event = this.stripe.webhooks.constructEvent(
            typeof payload === 'string' ? payload : JSON.stringify(payload),
            signature,
            endpointSecret,
          );
          return event;
        } catch (err) {
          throw new Error(`Invalid Stripe webhook signature: ${err.message}`);
        }
      },
      {
        service: 'StripeService',
        method: 'verifyWebhook',
        metadata: { hasSignature: !!signature },
      },
    );
  }
}
