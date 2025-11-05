import { IPaymentProvider } from './PaymentProvider.interface';
import { StripeProvider } from './StripeProvider';
import { XenditProvider } from './XenditProvider';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentWebhookData,
  RefundRequest,
  RefundResponse,
  PaymentProvider,
  PaymentConfig
} from '../../types/payment.types';
import { logger } from '../../utils/logger';

/**
 * Payment Service Factory
 * Manages multiple payment providers and routes requests to the appropriate provider
 */
export class PaymentService {
  private providers: Map<PaymentProvider, IPaymentProvider>;
  private defaultProvider: PaymentProvider;

  constructor(config: PaymentConfig) {
    this.providers = new Map();
    this.defaultProvider = config.defaultProvider;

    // Initialize Stripe provider
    if (config.stripe?.secretKey && config.stripe?.webhookSecret) {
      const stripeProvider = new StripeProvider(
        config.stripe.secretKey,
        config.stripe.webhookSecret
      );
      this.providers.set('stripe', stripeProvider);
      logger.info('Stripe payment provider initialized');
    }

    // Initialize Xendit provider
    if (config.xendit?.secretKey && config.xendit?.webhookToken) {
      const xenditProvider = new XenditProvider(
        config.xendit.secretKey,
        config.xendit.webhookToken
      );
      this.providers.set('xendit', xenditProvider);
      logger.info('Xendit payment provider initialized');
    }

    if (this.providers.size === 0) {
      logger.warn('No payment providers configured. Payment gateway features will be unavailable.');
    }
  }

  /**
   * Get a specific payment provider
   */
  getProvider(provider?: PaymentProvider): IPaymentProvider {
    const targetProvider = provider || this.defaultProvider;
    const providerInstance = this.providers.get(targetProvider);

    if (!providerInstance) {
      throw new Error(`Payment provider '${targetProvider}' is not configured`);
    }

    return providerInstance;
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: PaymentProvider): boolean {
    return this.providers.has(provider);
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): PaymentProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Create a payment using the specified or default provider
   */
  async createPayment(
    request: CreatePaymentRequest,
    provider?: PaymentProvider
  ): Promise<CreatePaymentResponse> {
    try {
      const paymentProvider = this.getProvider(provider);
      logger.info(`Creating payment with provider: ${paymentProvider.getProviderName()}`);

      const response = await paymentProvider.createPayment(request);
      return response;
    } catch (error) {
      logger.error('Payment creation failed:', error);
      throw error;
    }
  }

  /**
   * Get payment status from the specified provider
   */
  async getPaymentStatus(
    paymentId: string,
    provider: PaymentProvider
  ): Promise<CreatePaymentResponse> {
    try {
      const paymentProvider = this.getProvider(provider);
      return await paymentProvider.getPaymentStatus(paymentId);
    } catch (error) {
      logger.error('Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Verify webhook from the specified provider
   */
  async verifyWebhook(
    rawBody: string | Buffer,
    signature: string,
    provider: PaymentProvider
  ): Promise<PaymentWebhookData> {
    try {
      const paymentProvider = this.getProvider(provider);
      return await paymentProvider.verifyWebhook(rawBody, signature);
    } catch (error) {
      logger.error('Webhook verification failed:', error);
      throw error;
    }
  }

  /**
   * Process refund using the specified provider
   */
  async refundPayment(
    request: RefundRequest,
    provider: PaymentProvider
  ): Promise<RefundResponse> {
    try {
      const paymentProvider = this.getProvider(provider);
      logger.info(`Processing refund with provider: ${provider}`);

      return await paymentProvider.refundPayment(request);
    } catch (error) {
      logger.error('Refund processing failed:', error);
      throw error;
    }
  }
}

// Singleton instance
let paymentServiceInstance: PaymentService | null = null;

/**
 * Initialize the payment service with configuration
 */
export function initializePaymentService(config: PaymentConfig): PaymentService {
  paymentServiceInstance = new PaymentService(config);
  return paymentServiceInstance;
}

/**
 * Get the payment service instance
 */
export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    throw new Error('Payment service not initialized. Call initializePaymentService first.');
  }
  return paymentServiceInstance;
}
