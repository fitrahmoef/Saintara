import { Router } from 'express';
import {
  createPaymentIntent,
  getPaymentStatus,
  getAvailableProviders,
  refundPayment
} from '../controllers/payment.controller';
import {
  handleStripeWebhook,
  handleXenditWebhook
} from '../controllers/webhook.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/payments/intent
 * @desc    Create a payment intent with payment gateway
 * @access  Private (User)
 */
router.post('/intent', authenticate, createPaymentIntent);

/**
 * @route   GET /api/payments/status/:transaction_code
 * @desc    Get payment status for a transaction
 * @access  Private (User - own transactions only)
 */
router.get('/status/:transaction_code', authenticate, getPaymentStatus);

/**
 * @route   GET /api/payments/providers
 * @desc    Get list of available payment providers
 * @access  Private (User)
 */
router.get('/providers', authenticate, getAvailableProviders);

/**
 * @route   POST /api/payments/refund/:transaction_id
 * @desc    Refund a payment
 * @access  Private (Admin only)
 */
router.post('/refund/:transaction_id', authenticate, requireRole(['admin']), refundPayment);

/**
 * @route   POST /api/payments/webhook/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (but signature verified)
 */
router.post('/webhook/stripe', handleStripeWebhook);

/**
 * @route   POST /api/payments/webhook/xendit
 * @desc    Handle Xendit webhook events
 * @access  Public (but signature verified)
 */
router.post('/webhook/xendit', handleXenditWebhook);

export default router;
