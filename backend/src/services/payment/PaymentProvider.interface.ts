import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentWebhookData,
  RefundRequest,
  RefundResponse,
  PaymentProvider
} from '../../types/payment.types';

/**
 * Abstract Payment Provider Interface
 * All payment providers must implement this interface
 */
export interface IPaymentProvider {
  /**
   * Create a new payment intent/invoice
   */
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;

  /**
   * Retrieve payment status by payment ID
   */
  getPaymentStatus(paymentId: string): Promise<CreatePaymentResponse>;

  /**
   * Verify webhook signature and parse payload
   */
  verifyWebhook(rawBody: string | Buffer, signature: string): Promise<PaymentWebhookData>;

  /**
   * Process refund
   */
  refundPayment(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Get provider name
   */
  getProviderName(): PaymentProvider;
}
