/**
 * Payment Gateway Integration Types
 * Supports multiple payment providers (Stripe, Xendit)
 */

export type PaymentProvider = 'stripe' | 'xendit' | 'manual';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'expired';

export type PaymentMethodType =
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'e_wallet'
  | 'qris'
  | 'virtual_account'
  | 'manual';

export interface PaymentMetadata {
  user_id: number;
  user_email: string;
  user_name: string;
  package_type: string;
  transaction_code: string;
}

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  payment_method_type: PaymentMethodType;
  description?: string;
  metadata: PaymentMetadata;
  success_url?: string;
  cancel_url?: string;
}

export interface CreatePaymentResponse {
  payment_id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  payment_url?: string;
  payment_method?: string;
  expires_at?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentWebhookData {
  provider: PaymentProvider;
  payment_id: string;
  external_id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paid_at?: Date;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  payment_id: string;
  amount?: number; // Optional for partial refund
  reason?: string;
}

export interface RefundResponse {
  refund_id: string;
  payment_id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: Date;
}

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

export interface PaymentConfig {
  stripe?: {
    secretKey: string;
    webhookSecret: string;
    publishableKey: string;
  };
  xendit?: {
    secretKey: string;
    webhookToken: string;
  };
  defaultProvider: PaymentProvider;
  defaultCurrency: string;
}
