import { Request, Response } from 'express';
import { getPaymentService } from '../services/payment/PaymentService';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { PaymentProvider } from '../types/payment.types';

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Get raw body for signature verification
    const rawBody = (req as any).rawBody;

    if (!rawBody) {
      return res.status(400).json({ error: 'Missing request body' });
    }

    const paymentService = getPaymentService();
    const webhookData = await paymentService.verifyWebhook(rawBody, signature, 'stripe');

    logger.info(`Stripe webhook processed: ${webhookData.status} for payment ${webhookData.payment_id}`);

    // Process webhook data
    await processWebhookData(webhookData);

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(400).json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Handle Xendit webhook events
 */
export const handleXenditWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-callback-token'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing x-callback-token header' });
    }

    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const paymentService = getPaymentService();
    const webhookData = await paymentService.verifyWebhook(rawBody, signature, 'xendit');

    logger.info(`Xendit webhook processed: ${webhookData.status} for payment ${webhookData.payment_id}`);

    // Process webhook data
    await processWebhookData(webhookData);

    res.json({ received: true });
  } catch (error) {
    logger.error('Xendit webhook error:', error);
    res.status(400).json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Process webhook data and update transaction
 */
async function processWebhookData(webhookData: any) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find transaction by payment_gateway_id or transaction_code
    let transaction;

    if (webhookData.payment_id) {
      const result = await client.query(
        'SELECT * FROM transactions WHERE payment_gateway_id = $1',
        [webhookData.payment_id]
      );
      transaction = result.rows[0];
    }

    // Try to find by external_id (transaction_code) if not found
    if (!transaction && webhookData.external_id) {
      const result = await client.query(
        'SELECT * FROM transactions WHERE transaction_code = $1',
        [webhookData.external_id]
      );
      transaction = result.rows[0];
    }

    // Try to find by metadata transaction_code
    if (!transaction && webhookData.metadata?.transaction_code) {
      const result = await client.query(
        'SELECT * FROM transactions WHERE transaction_code = $1',
        [webhookData.metadata.transaction_code]
      );
      transaction = result.rows[0];
    }

    if (!transaction) {
      logger.warn(`Transaction not found for payment ${webhookData.payment_id}`);
      await client.query('ROLLBACK');
      return;
    }

    logger.info(`Processing webhook for transaction ${transaction.transaction_code}, status: ${webhookData.status}`);

    // Update transaction status based on webhook data
    if (webhookData.status === 'paid') {
      // Update transaction to paid
      await client.query(
        `UPDATE transactions
         SET status = 'paid',
             paid_at = $1,
             payment_gateway_id = $2
         WHERE id = $3`,
        [webhookData.paid_at || new Date(), webhookData.payment_id, transaction.id]
      );

      // Auto-generate voucher
      const voucherCode = `${transaction.package_type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

      await client.query(
        `INSERT INTO vouchers (user_id, code, package_type, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [transaction.user_id, voucherCode, transaction.package_type, expiresAt]
      );

      logger.info(`Voucher created: ${voucherCode} for transaction ${transaction.transaction_code}`);

      // TODO: Send payment confirmation email
      // await sendPaymentConfirmationEmail(transaction, voucherCode);

    } else if (webhookData.status === 'failed') {
      await client.query(
        `UPDATE transactions
         SET status = 'failed',
             payment_failure_reason = $1
         WHERE id = $2`,
        [webhookData.failure_reason || 'Payment failed', transaction.id]
      );

      logger.info(`Transaction ${transaction.transaction_code} marked as failed`);

      // TODO: Send payment failure email
      // await sendPaymentFailureEmail(transaction);

    } else if (webhookData.status === 'refunded') {
      await client.query(
        `UPDATE transactions
         SET status = 'refunded',
             refunded_at = $1
         WHERE id = $2`,
        [new Date(), transaction.id]
      );

      // Invalidate vouchers
      await client.query(
        `UPDATE vouchers
         SET is_used = true,
             used_at = $1
         WHERE user_id = $2 AND package_type = $3 AND is_used = false`,
        [new Date(), transaction.user_id, transaction.package_type]
      );

      logger.info(`Transaction ${transaction.transaction_code} refunded and vouchers invalidated`);

      // TODO: Send refund confirmation email
      // await sendRefundConfirmationEmail(transaction);
    }

    await client.query('COMMIT');
    logger.info(`Webhook processed successfully for transaction ${transaction.transaction_code}`);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error processing webhook data:', error);
    throw error;
  } finally {
    client.release();
  }
}
