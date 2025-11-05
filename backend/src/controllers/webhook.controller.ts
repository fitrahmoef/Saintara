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

    // Extract webhook ID for idempotency (Stripe sends 'id' field)
    const webhookId = webhookData.id || webhookData.event_id;

    if (!webhookId) {
      logger.error('Stripe webhook missing ID field');
      return res.status(400).json({ error: 'Webhook missing unique identifier' });
    }

    // Check for duplicate webhook (idempotency protection)
    const isDuplicate = await checkDuplicateWebhook('stripe', webhookId);
    if (isDuplicate) {
      logger.info(`Duplicate Stripe webhook detected: ${webhookId} - Ignoring`);
      return res.json({ received: true, note: 'Duplicate webhook ignored' });
    }

    logger.info(`Stripe webhook received: ${webhookData.status} for payment ${webhookData.payment_id}`);

    // Process webhook data with idempotency tracking
    await processWebhookData(webhookData, 'stripe', webhookId);

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

    // Extract webhook ID for idempotency (Xendit sends 'id' field)
    const webhookId = webhookData.id || webhookData.payment_id;

    if (!webhookId) {
      logger.error('Xendit webhook missing ID field');
      return res.status(400).json({ error: 'Webhook missing unique identifier' });
    }

    // Check for duplicate webhook (idempotency protection)
    const isDuplicate = await checkDuplicateWebhook('xendit', webhookId);
    if (isDuplicate) {
      logger.info(`Duplicate Xendit webhook detected: ${webhookId} - Ignoring`);
      return res.json({ received: true, note: 'Duplicate webhook ignored' });
    }

    logger.info(`Xendit webhook received: ${webhookData.status} for payment ${webhookData.payment_id}`);

    // Process webhook data with idempotency tracking
    await processWebhookData(webhookData, 'xendit', webhookId);

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
 * Check if webhook has already been processed (idempotency check)
 */
async function checkDuplicateWebhook(provider: string, webhookId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT id FROM webhook_events WHERE provider = $1 AND webhook_id = $2',
      [provider, webhookId]
    );
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error checking duplicate webhook:', error);
    // If table doesn't exist (migration not run), return false to allow processing
    return false;
  }
}

/**
 * Create webhook event record for tracking
 */
async function createWebhookEvent(
  client: any,
  provider: string,
  webhookId: string,
  eventType: string,
  paymentId: string,
  payload: any
): Promise<number> {
  try {
    const result = await client.query(
      `INSERT INTO webhook_events (webhook_id, provider, event_type, payment_id, status, payload)
       VALUES ($1, $2, $3, $4, 'processing', $5)
       RETURNING id`,
      [webhookId, provider, eventType, paymentId, JSON.stringify(payload)]
    );
    return result.rows[0].id;
  } catch (error) {
    // If table doesn't exist, log and continue
    logger.warn('webhook_events table not found - skipping idempotency tracking');
    return 0;
  }
}

/**
 * Update webhook event status
 */
async function updateWebhookEvent(
  client: any,
  webhookEventId: number,
  status: 'completed' | 'failed',
  transactionId?: number,
  errorMessage?: string
) {
  if (!webhookEventId) return; // Skip if table doesn't exist

  try {
    await client.query(
      `UPDATE webhook_events
       SET status = $1, transaction_id = $2, error_message = $3, processed_at = NOW()
       WHERE id = $4`,
      [status, transactionId, errorMessage, webhookEventId]
    );
  } catch (error) {
    logger.warn('Failed to update webhook event:', error);
  }
}

/**
 * Create payment log entry for audit trail
 */
async function createPaymentLog(
  client: any,
  transactionId: number,
  paymentGateway: string,
  paymentGatewayId: string,
  eventType: string,
  oldStatus: string,
  newStatus: string,
  amount?: number,
  metadata?: any
) {
  try {
    await client.query(
      `INSERT INTO payment_logs (transaction_id, payment_gateway, payment_gateway_id, event_type, old_status, new_status, amount, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [transactionId, paymentGateway, paymentGatewayId, eventType, oldStatus, newStatus, amount, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    logger.warn('Failed to create payment log:', error);
  }
}

/**
 * Process webhook data and update transaction
 */
async function processWebhookData(webhookData: any, provider: string, webhookId: string) {
  const client = await pool.connect();
  let webhookEventId = 0;

  try {
    await client.query('BEGIN');

    // Create webhook event record for idempotency tracking
    webhookEventId = await createWebhookEvent(
      client,
      provider,
      webhookId,
      webhookData.event_type || webhookData.status,
      webhookData.payment_id,
      webhookData
    );

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
      await updateWebhookEvent(client, webhookEventId, 'failed', undefined, 'Transaction not found');
      await client.query('ROLLBACK');
      return;
    }

    logger.info(`Processing webhook for transaction ${transaction.transaction_code}, status: ${webhookData.status}`);

    const oldStatus = transaction.status;

    // Update webhook tracking on transaction
    await client.query(
      `UPDATE transactions
       SET last_webhook_received_at = NOW(),
           webhook_event_count = webhook_event_count + 1
       WHERE id = $1`,
      [transaction.id]
    );

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

      // Create payment log for audit trail
      await createPaymentLog(
        client,
        transaction.id,
        provider,
        webhookData.payment_id,
        'payment_paid',
        oldStatus,
        'paid',
        transaction.amount,
        { webhook_id: webhookId }
      );

      // Auto-generate voucher (only if doesn't exist to prevent duplicates)
      const existingVoucher = await client.query(
        `SELECT id FROM vouchers WHERE user_id = $1 AND package_type = $2 AND is_used = false
         ORDER BY created_at DESC LIMIT 1`,
        [transaction.user_id, transaction.package_type]
      );

      let voucherCode;
      if (existingVoucher.rows.length === 0) {
        voucherCode = `${transaction.package_type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

        await client.query(
          `INSERT INTO vouchers (user_id, code, package_type, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [transaction.user_id, voucherCode, transaction.package_type, expiresAt]
        );

        logger.info(`Voucher created: ${voucherCode} for transaction ${transaction.transaction_code}`);
      } else {
        voucherCode = existingVoucher.rows[0].code;
        logger.info(`Using existing voucher: ${voucherCode} for transaction ${transaction.transaction_code}`);
      }

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

      // Create payment log for audit trail
      await createPaymentLog(
        client,
        transaction.id,
        provider,
        webhookData.payment_id,
        'payment_failed',
        oldStatus,
        'failed',
        transaction.amount,
        { webhook_id: webhookId, failure_reason: webhookData.failure_reason }
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

      // Create payment log for audit trail
      await createPaymentLog(
        client,
        transaction.id,
        provider,
        webhookData.payment_id,
        'refund_completed',
        oldStatus,
        'refunded',
        transaction.amount,
        { webhook_id: webhookId }
      );

      logger.info(`Transaction ${transaction.transaction_code} refunded and vouchers invalidated`);

      // TODO: Send refund confirmation email
      // await sendRefundConfirmationEmail(transaction);
    }

    // Update webhook event status to completed
    await updateWebhookEvent(client, webhookEventId, 'completed', transaction.id);

    await client.query('COMMIT');
    logger.info(`Webhook processed successfully for transaction ${transaction.transaction_code}`);

  } catch (error) {
    await client.query('ROLLBACK');

    // Update webhook event status to failed
    if (webhookEventId) {
      const errorClient = await pool.connect();
      try {
        await updateWebhookEvent(
          errorClient,
          webhookEventId,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
      } finally {
        errorClient.release();
      }
    }

    logger.error('Error processing webhook data:', error);
    throw error;
  } finally {
    client.release();
  }
}
