import { Request, Response } from 'express';
import { getPaymentService } from '../services/payment/PaymentService';
import pool from '../config/database';
import logger from '../utils/logger';
import {
  CreatePaymentRequest,
  PaymentProvider,
  PaymentMethodType
} from '../types/payment.types';

/**
 * Create a payment using payment gateway
 */
export const createPaymentIntent = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const {
      package_type,
      amount,
      payment_method_type,
      provider = 'stripe'
    }: {
      package_type: string;
      amount: number;
      payment_method_type: PaymentMethodType;
      provider?: PaymentProvider;
    } = req.body;

    // Validate required fields
    if (!package_type || !amount || !payment_method_type) {
      return res.status(400).json({
        error: 'Missing required fields: package_type, amount, payment_method_type'
      });
    }

    // Validate package type
    const validPackages = ['personal', 'couple', 'team'];
    if (!validPackages.includes(package_type)) {
      return res.status(400).json({
        error: 'Invalid package_type. Must be: personal, couple, or team'
      });
    }

    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    const userName = (req as any).user.name;

    // Generate transaction code
    const transaction_code = `TRX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create transaction record first
    const transactionQuery = `
      INSERT INTO transactions (
        user_id, package_type, amount, status, payment_method, transaction_code
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const transactionResult = await client.query(transactionQuery, [
      userId,
      package_type,
      amount,
      'pending',
      `${provider}_${payment_method_type}`,
      transaction_code
    ]);

    const transaction = transactionResult.rows[0];

    // Get payment service and create payment intent
    const paymentService = getPaymentService();

    // Check if provider is available
    if (!paymentService.isProviderAvailable(provider)) {
      return res.status(400).json({
        error: `Payment provider '${provider}' is not configured`,
        availableProviders: paymentService.getAvailableProviders()
      });
    }

    const paymentRequest: CreatePaymentRequest = {
      amount: parseFloat(amount),
      currency: provider === 'xendit' ? 'IDR' : 'USD',
      payment_method_type,
      description: `Saintara ${package_type} package subscription`,
      metadata: {
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        package_type,
        transaction_code
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?transaction_code=${transaction_code}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?transaction_code=${transaction_code}`
    };

    const paymentResponse = await paymentService.createPayment(paymentRequest, provider);

    // Update transaction with payment gateway details
    await client.query(
      `UPDATE transactions
       SET payment_gateway_id = $1,
           payment_gateway = $2,
           payment_url = $3,
           payment_expires_at = $4
       WHERE id = $5`,
      [
        paymentResponse.payment_id,
        provider,
        paymentResponse.payment_url,
        paymentResponse.expires_at,
        transaction.id
      ]
    );

    logger.info(`Payment intent created for transaction ${transaction_code}`);

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        transaction_code,
        amount: transaction.amount,
        status: transaction.status,
      },
      payment: {
        payment_id: paymentResponse.payment_id,
        provider: paymentResponse.provider,
        payment_url: paymentResponse.payment_url,
        expires_at: paymentResponse.expires_at,
      }
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { transaction_code } = req.params;
    const userId = (req as any).user.id;

    const query = `
      SELECT * FROM transactions
      WHERE transaction_code = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [transaction_code, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];

    // If transaction has a payment gateway ID, fetch latest status
    if (transaction.payment_gateway_id && transaction.payment_gateway) {
      const paymentService = getPaymentService();

      const paymentStatus = await paymentService.getPaymentStatus(
        transaction.payment_gateway_id,
        transaction.payment_gateway
      );

      res.json({
        transaction: {
          id: transaction.id,
          transaction_code: transaction.transaction_code,
          amount: transaction.amount,
          status: transaction.status,
          package_type: transaction.package_type,
          created_at: transaction.created_at,
        },
        payment: paymentStatus
      });
    } else {
      // Manual payment - return transaction status only
      res.json({
        transaction: {
          id: transaction.id,
          transaction_code: transaction.transaction_code,
          amount: transaction.amount,
          status: transaction.status,
          package_type: transaction.package_type,
          payment_proof_url: transaction.payment_proof_url,
          created_at: transaction.created_at,
        }
      });
    }
  } catch (error) {
    logger.error('Error fetching payment status:', error);
    res.status(500).json({
      error: 'Failed to fetch payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * List available payment providers
 */
export const getAvailableProviders = async (req: Request, res: Response) => {
  try {
    const paymentService = getPaymentService();
    const providers = paymentService.getAvailableProviders();

    res.json({
      providers: providers.map(provider => ({
        name: provider,
        available: true,
        currency: provider === 'xendit' ? 'IDR' : 'USD',
        supportedMethods: provider === 'xendit'
          ? ['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'qris', 'virtual_account']
          : ['credit_card', 'debit_card']
      }))
    });
  } catch (error) {
    logger.error('Error fetching providers:', error);
    res.status(500).json({
      error: 'Failed to fetch available providers',
      providers: []
    });
  }
};

/**
 * Refund a payment
 */
export const refundPayment = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { transaction_id } = req.params;
    const { amount, reason } = req.body;

    // Get transaction details
    const transactionQuery = `
      SELECT * FROM transactions WHERE id = $1
    `;
    const transactionResult = await client.query(transactionQuery, [transaction_id]);

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];

    // Check if transaction is paid
    if (transaction.status !== 'paid') {
      return res.status(400).json({
        error: 'Can only refund paid transactions'
      });
    }

    // Check if transaction has payment gateway details
    if (!transaction.payment_gateway_id || !transaction.payment_gateway) {
      return res.status(400).json({
        error: 'Transaction does not have payment gateway information. Manual refund required.'
      });
    }

    // Process refund through payment gateway
    const paymentService = getPaymentService();
    const refundResponse = await paymentService.refundPayment(
      {
        payment_id: transaction.payment_gateway_id,
        amount: amount ? parseFloat(amount) : undefined,
        reason
      },
      transaction.payment_gateway
    );

    // Update transaction status
    await client.query(
      `UPDATE transactions
       SET status = 'refunded',
           refund_id = $1,
           refund_amount = $2,
           refund_reason = $3,
           refunded_at = $4
       WHERE id = $5`,
      [
        refundResponse.refund_id,
        refundResponse.amount,
        reason,
        new Date(),
        transaction_id
      ]
    );

    logger.info(`Refund processed for transaction ${transaction.transaction_code}`);

    res.json({
      success: true,
      refund: refundResponse
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      error: 'Failed to process refund',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};
