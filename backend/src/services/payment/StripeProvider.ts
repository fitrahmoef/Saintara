import Stripe from 'stripe';
import { IPaymentProvider } from './PaymentProvider.interface';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentWebhookData,
  RefundRequest,
  RefundResponse,
  PaymentStatus,
  PaymentProvider
} from '../../types/payment.types';
import { logger } from '../../utils/logger';

export class StripeProvider implements IPaymentProvider {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = webhookSecret;
  }

  getProviderName(): PaymentProvider {
    return 'stripe';
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      // Create a Stripe Checkout Session for hosted payment page
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: request.currency.toLowerCase(),
              product_data: {
                name: `Saintara ${request.metadata.package_type} Package`,
                description: request.description || `Package subscription for ${request.metadata.user_name}`,
              },
              unit_amount: Math.round(request.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: request.success_url || `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: request.cancel_url || `${process.env.FRONTEND_URL}/payment/cancel`,
        client_reference_id: request.metadata.transaction_code,
        customer_email: request.metadata.user_email,
        metadata: {
          user_id: request.metadata.user_id.toString(),
          package_type: request.metadata.package_type,
          transaction_code: request.metadata.transaction_code,
        },
      });

      logger.info(`Stripe payment session created: ${session.id}`);

      return {
        payment_id: session.id,
        provider: 'stripe',
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        payment_url: session.url || undefined,
        expires_at: new Date(session.expires_at * 1000),
        metadata: {
          session_id: session.id,
          payment_intent: session.payment_intent,
        },
      };
    } catch (error) {
      logger.error('Stripe payment creation failed:', error);
      throw new Error(`Stripe payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<CreatePaymentResponse> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(paymentId);

      let status: PaymentStatus = 'pending';
      if (session.payment_status === 'paid') {
        status = 'paid';
      } else if (session.payment_status === 'unpaid') {
        status = 'pending';
      } else if (session.status === 'expired') {
        status = 'expired';
      }

      return {
        payment_id: session.id,
        provider: 'stripe',
        status,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'USD',
        payment_url: session.url || undefined,
        payment_method: session.payment_method_types?.[0],
        expires_at: new Date(session.expires_at * 1000),
        metadata: {
          customer_email: session.customer_email,
          payment_intent: session.payment_intent,
        },
      };
    } catch (error) {
      logger.error('Stripe payment status retrieval failed:', error);
      throw new Error(`Failed to retrieve payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyWebhook(rawBody: string | Buffer, signature: string): Promise<PaymentWebhookData> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );

      logger.info(`Stripe webhook received: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          return {
            provider: 'stripe',
            payment_id: session.id,
            external_id: session.payment_intent as string,
            status: session.payment_status === 'paid' ? 'paid' : 'pending',
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || 'USD',
            paid_at: session.payment_status === 'paid' ? new Date() : undefined,
            metadata: {
              transaction_code: session.client_reference_id,
              user_id: session.metadata?.user_id,
              package_type: session.metadata?.package_type,
              customer_email: session.customer_email,
            },
          };
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          return {
            provider: 'stripe',
            payment_id: paymentIntent.id,
            external_id: paymentIntent.id,
            status: 'paid',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            paid_at: new Date(paymentIntent.created * 1000),
            metadata: paymentIntent.metadata,
          };
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;

          return {
            provider: 'stripe',
            payment_id: paymentIntent.id,
            external_id: paymentIntent.id,
            status: 'failed',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            failure_reason: paymentIntent.last_payment_error?.message,
            metadata: paymentIntent.metadata,
          };
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;

          return {
            provider: 'stripe',
            payment_id: charge.payment_intent as string,
            external_id: charge.id,
            status: 'refunded',
            amount: charge.amount_refunded / 100,
            currency: charge.currency.toUpperCase(),
            metadata: charge.metadata,
          };
        }

        default:
          throw new Error(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Stripe webhook verification failed:', error);
      throw new Error(`Webhook verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      // Get the payment intent from the session
      const session = await this.stripe.checkout.sessions.retrieve(request.payment_id);

      if (!session.payment_intent) {
        throw new Error('No payment intent found for this session');
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        amount: request.amount ? Math.round(request.amount * 100) : undefined,
        reason: request.reason as any,
      });

      logger.info(`Stripe refund created: ${refund.id}`);

      return {
        refund_id: refund.id,
        payment_id: request.payment_id,
        amount: refund.amount / 100,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        created_at: new Date(refund.created * 1000),
      };
    } catch (error) {
      logger.error('Stripe refund failed:', error);
      throw new Error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
