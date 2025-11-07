import Xendit from 'xendit-node';
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
import crypto from 'crypto';

export class XenditProvider implements IPaymentProvider {
  private xendit: Xendit;
  private webhookToken: string;

  constructor(secretKey: string, webhookToken: string) {
    this.xendit = new Xendit({
      secretKey: secretKey,
    });
    this.webhookToken = webhookToken;
  }

  getProviderName(): PaymentProvider {
    return 'xendit';
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const { Invoice } = this.xendit;

      // Determine payment methods based on type
      const paymentMethods: string[] = [];
      switch (request.payment_method_type) {
        case 'credit_card':
        case 'debit_card':
          paymentMethods.push('CREDIT_CARD');
          break;
        case 'bank_transfer':
          paymentMethods.push('BANK_TRANSFER');
          break;
        case 'e_wallet':
          paymentMethods.push('EWALLET');
          break;
        case 'qris':
          paymentMethods.push('QR_CODE');
          break;
        case 'virtual_account':
          paymentMethods.push('VIRTUAL_ACCOUNT');
          break;
        default:
          // Allow all methods
          paymentMethods.push('CREDIT_CARD', 'BANK_TRANSFER', 'EWALLET', 'QR_CODE', 'VIRTUAL_ACCOUNT');
      }

      // Create invoice
      const invoice = await Invoice.createInvoice({
        data: {
          externalId: request.metadata.transaction_code,
          amount: request.amount,
          payerEmail: request.metadata.user_email,
          description: request.description || `Saintara ${request.metadata.package_type} Package`,
          customer: {
            givenNames: request.metadata.user_name,
            email: request.metadata.user_email,
          } as any,
          customerNotificationPreference: {
            invoiceCreated: ['email'],
            invoiceReminder: ['email'],
            invoicePaid: ['email'],
          } as any,
          successRedirectUrl: request.success_url || `${process.env.FRONTEND_URL}/payment/success`,
          failureRedirectUrl: request.cancel_url || `${process.env.FRONTEND_URL}/payment/cancel`,
          currency: request.currency,
          invoiceDuration: '86400', // 24 hours (as string)
          items: [
            {
              name: `Saintara ${request.metadata.package_type} Package`,
              quantity: 1,
              price: request.amount,
            },
          ] as any,
          fees: [] as any,
        },
      } as any);

      logger.info(`Xendit invoice created: ${invoice.id}`);

      return {
        payment_id: invoice.id as string,
        provider: 'xendit',
        status: 'pending',
        amount: request.amount,
        currency: request.currency,
        payment_url: invoice.invoiceUrl,
        expires_at: invoice.expiryDate ? new Date(invoice.expiryDate as any) : new Date(),
        metadata: {
          external_id: invoice.externalId,
          invoice_url: invoice.invoiceUrl,
        },
      };
    } catch (error) {
      logger.error('Xendit payment creation failed:', error);
      throw new Error(`Xendit payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<CreatePaymentResponse> {
    try {
      const { Invoice } = this.xendit;
      const invoice = await Invoice.getInvoiceById({
        invoiceId: paymentId,
      });

      let status: PaymentStatus = 'pending';
      if (invoice.status === 'PAID' || invoice.status === 'SETTLED') {
        status = 'paid';
      } else if (invoice.status === 'EXPIRED') {
        status = 'expired';
      } else if (invoice.status === 'PENDING') {
        status = 'pending';
      }

      return {
        payment_id: invoice.id as string,
        provider: 'xendit',
        status,
        amount: invoice.amount as number,
        currency: invoice.currency as string,
        payment_url: invoice.invoiceUrl,
        expires_at: invoice.expiryDate ? new Date(invoice.expiryDate as any) : new Date(),
        metadata: {
          external_id: invoice.externalId,
          payment_method: invoice.paymentMethod,
        },
      };
    } catch (error) {
      logger.error('Xendit payment status retrieval failed:', error);
      throw new Error(`Failed to retrieve payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyWebhook(rawBody: string | Buffer, signature: string): Promise<PaymentWebhookData> {
    try {
      // Verify webhook signature
      const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString();
      const computedSignature = crypto
        .createHmac('sha256', this.webhookToken)
        .update(bodyString)
        .digest('hex');

      if (computedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const payload = JSON.parse(bodyString);
      logger.info(`Xendit webhook received: ${payload.status}`);

      // Map Xendit status to our status
      let status: PaymentStatus = 'pending';
      if (payload.status === 'PAID' || payload.status === 'SETTLED') {
        status = 'paid';
      } else if (payload.status === 'EXPIRED') {
        status = 'expired';
      } else if (payload.status === 'FAILED') {
        status = 'failed';
      }

      return {
        provider: 'xendit',
        payment_id: payload.id,
        external_id: payload.external_id,
        status,
        amount: parseFloat(payload.amount),
        currency: payload.currency,
        paid_at: payload.paid_at ? new Date(payload.paid_at) : undefined,
        failure_reason: payload.failure_reason,
        metadata: {
          payment_method: payload.payment_method,
          payment_channel: payload.payment_channel,
          ...payload.metadata,
        },
      };
    } catch (error) {
      logger.error('Xendit webhook verification failed:', error);
      throw new Error(`Webhook verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      // Note: Xendit refunds are done through different APIs depending on payment method
      // This is a simplified version - in production, you'd need to handle each payment method differently
      logger.warn('Xendit refunds require manual processing through dashboard or specific payment method APIs');

      // For now, we'll throw an error indicating manual refund is required
      throw new Error('Xendit refunds must be processed manually through the Xendit dashboard');

      // In a production environment, you would implement specific refund logic:
      // - Credit card refunds: Use Payment API
      // - Virtual Account: Contact Xendit support
      // - E-wallet: Use specific e-wallet refund API
    } catch (error) {
      logger.error('Xendit refund failed:', error);
      throw new Error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
