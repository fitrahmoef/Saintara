# Payment Gateway Integration Documentation

## Overview

The Saintara backend now supports **automated payment processing** through multiple payment gateways:

- **Stripe** - For international payments (Credit/Debit cards)
- **Xendit** - For Indonesian payments (Credit cards, Bank transfer, E-wallets, QRIS, Virtual accounts)

## Features

✅ **Multiple Payment Providers** - Support for Stripe and Xendit
✅ **Automatic Payment Confirmation** - Webhooks automatically update transaction status
✅ **Secure Webhook Verification** - Signature verification for all webhooks
✅ **Auto Voucher Generation** - Automatically creates vouchers on successful payment
✅ **Refund Support** - Process refunds through payment gateways
✅ **Payment Audit Trail** - Comprehensive logging of all payment events
✅ **SQL Injection Fix** - Fixed security vulnerability in transaction queries

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Payment Service Layer                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           PaymentService (Factory)                    │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                         │
│        ┌────────────┴────────────┐                           │
│        │                         │                           │
│  ┌─────▼──────┐          ┌──────▼────────┐                 │
│  │  Stripe    │          │    Xendit     │                 │
│  │  Provider  │          │    Provider   │                 │
│  └────────────┘          └───────────────┘                 │
└─────────────────────────────────────────────────────────────┘
         │                          │
         │                          │
         ▼                          ▼
   Stripe API                  Xendit API
    (Checkout)                 (Invoice)
```

---

## Setup Instructions

### 1. Environment Configuration

Update your `.env` file with payment gateway credentials:

```bash
# Frontend URL (for payment redirects)
FRONTEND_URL=http://localhost:3000

# Payment Gateway Configuration
DEFAULT_PAYMENT_PROVIDER=stripe
DEFAULT_CURRENCY=USD

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Xendit Configuration
XENDIT_SECRET_KEY=xnd_xxxxxxxxxxxxxxxxxxxxx
XENDIT_WEBHOOK_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `stripe@^14.14.0` - Stripe SDK
- `xendit-node@^4.2.0` - Xendit SDK

### 3. Run Database Migration

Apply the payment gateway migration:

```bash
npm run migrate up
```

This migration adds:
- Payment gateway fields to `transactions` table
- `payment_logs` table for audit trail
- Indexes for performance
- New permissions for payment operations

### 4. Get Payment Provider Credentials

#### For Stripe:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Get your **Secret Key** and **Publishable Key**
3. Create a webhook endpoint:
   - Go to [Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://your-domain.com/api/payments/webhook/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
   - Copy the **Webhook Secret**

#### For Xendit:
1. Go to [Xendit Dashboard](https://dashboard.xendit.co/settings/developers)
2. Get your **Secret Key** from API Keys section
3. Setup webhook:
   - Go to [Webhooks](https://dashboard.xendit.co/settings/developers#webhooks)
   - Add callback URL: `https://your-domain.com/api/payments/webhook/xendit`
   - Copy the **Verification Token**

---

## API Endpoints

### 1. Create Payment Intent

**Endpoint:** `POST /api/payments/intent`
**Auth:** Required (User)
**Description:** Create a new payment and get payment URL

**Request Body:**
```json
{
  "package_type": "personal",
  "amount": 50000,
  "payment_method_type": "credit_card",
  "provider": "stripe"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 123,
    "transaction_code": "TRX-1699012345-ABC123",
    "amount": "50000.00",
    "status": "pending"
  },
  "payment": {
    "payment_id": "cs_test_xxxxxxxxxxxxx",
    "provider": "stripe",
    "payment_url": "https://checkout.stripe.com/c/pay/cs_test_xxxxxxxxxxxxx",
    "expires_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Supported Payment Method Types:**
- `credit_card`
- `debit_card`
- `bank_transfer` (Xendit only)
- `e_wallet` (Xendit only)
- `qris` (Xendit only)
- `virtual_account` (Xendit only)

---

### 2. Get Payment Status

**Endpoint:** `GET /api/payments/status/:transaction_code`
**Auth:** Required (User)
**Description:** Get current payment status

**Response:**
```json
{
  "transaction": {
    "id": 123,
    "transaction_code": "TRX-1699012345-ABC123",
    "amount": "50000.00",
    "status": "paid",
    "package_type": "personal",
    "created_at": "2024-01-15T09:00:00.000Z"
  },
  "payment": {
    "payment_id": "cs_test_xxxxxxxxxxxxx",
    "provider": "stripe",
    "status": "paid",
    "amount": 50000,
    "currency": "USD"
  }
}
```

---

### 3. Get Available Providers

**Endpoint:** `GET /api/payments/providers`
**Auth:** Required (User)
**Description:** List all configured payment providers

**Response:**
```json
{
  "providers": [
    {
      "name": "stripe",
      "available": true,
      "currency": "USD",
      "supportedMethods": ["credit_card", "debit_card"]
    },
    {
      "name": "xendit",
      "available": true,
      "currency": "IDR",
      "supportedMethods": [
        "credit_card",
        "debit_card",
        "bank_transfer",
        "e_wallet",
        "qris",
        "virtual_account"
      ]
    }
  ]
}
```

---

### 4. Process Refund

**Endpoint:** `POST /api/payments/refund/:transaction_id`
**Auth:** Required (Admin)
**Description:** Refund a paid transaction

**Request Body:**
```json
{
  "amount": 50000,
  "reason": "Customer requested refund"
}
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "refund_id": "re_xxxxxxxxxxxxx",
    "payment_id": "cs_test_xxxxxxxxxxxxx",
    "amount": 50000,
    "status": "succeeded",
    "created_at": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Webhook Endpoints

#### Stripe Webhook
**Endpoint:** `POST /api/payments/webhook/stripe`
**Auth:** None (verified by signature)
**Headers:** `stripe-signature: xxxxxxxxxxxxx`

#### Xendit Webhook
**Endpoint:** `POST /api/payments/webhook/xendit`
**Auth:** None (verified by token)
**Headers:** `x-callback-token: xxxxxxxxxxxxx`

---

## Payment Flow

### User Payment Flow

```
1. User selects package → Frontend calls POST /api/payments/intent
                                ↓
2. Backend creates transaction and payment intent
                                ↓
3. User redirected to payment_url (Stripe Checkout / Xendit Invoice)
                                ↓
4. User completes payment on gateway
                                ↓
5. Gateway sends webhook → POST /api/payments/webhook/{provider}
                                ↓
6. Backend verifies webhook signature
                                ↓
7. Backend updates transaction status to 'paid'
                                ↓
8. Backend auto-generates voucher (1 year expiry)
                                ↓
9. User redirected to success page
```

### Webhook Processing

When a webhook is received:

1. **Signature Verification** - Verify webhook is from legitimate source
2. **Find Transaction** - Lookup transaction by payment_id or transaction_code
3. **Update Status** - Update transaction status based on webhook event
4. **Create Voucher** - If status = 'paid', auto-generate voucher
5. **Log Event** - Record event in payment_logs table

---

## Database Schema Changes

### New Fields in `transactions` Table

| Column | Type | Description |
|--------|------|-------------|
| `payment_gateway` | VARCHAR(50) | Provider: stripe, xendit, manual |
| `payment_gateway_id` | VARCHAR(255) | Payment ID from gateway |
| `payment_url` | TEXT | Payment URL for user |
| `payment_expires_at` | TIMESTAMP | Payment link expiration |
| `payment_failure_reason` | TEXT | Reason for payment failure |
| `refund_id` | VARCHAR(255) | Refund ID from gateway |
| `refund_amount` | DECIMAL(10,2) | Amount refunded |
| `refund_reason` | TEXT | Reason for refund |
| `refunded_at` | TIMESTAMP | Refund timestamp |

### New `payment_logs` Table

Audit trail for all payment events:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `transaction_id` | INTEGER | FK to transactions |
| `event_type` | VARCHAR(50) | Event type |
| `provider` | VARCHAR(50) | Payment provider |
| `old_status` | VARCHAR(50) | Previous status |
| `new_status` | VARCHAR(50) | New status |
| `metadata` | JSONB | Additional event data |
| `created_by` | INTEGER | User who triggered event |
| `created_at` | TIMESTAMP | Event timestamp |

---

## Security Features

### 1. SQL Injection Prevention
✅ **FIXED** - `getAllTransactions` now uses parameterized queries

**Before (Vulnerable):**
```typescript
const query = `WHERE status = '${status}'`; // ❌ SQL Injection risk
```

**After (Secure):**
```typescript
const query = `WHERE status = $1`; // ✅ Parameterized query
const result = await pool.query(query, [status]);
```

### 2. Webhook Signature Verification

**Stripe:**
- Verifies `stripe-signature` header using HMAC-SHA256
- Rejects webhooks with invalid signatures

**Xendit:**
- Verifies `x-callback-token` header
- Compares against configured webhook token

### 3. Raw Body Preservation

Raw body middleware ensures webhook signatures can be verified:

```typescript
// Raw body captured BEFORE express.json() parsing
app.use(rawBodyMiddleware);
app.use(express.json());
```

---

## Testing

### Manual Testing with Stripe Test Cards

Use Stripe test cards for testing:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Declined payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

**Test Mode:**
- All amounts ending in `00` will succeed
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC

### Testing Webhooks Locally

Use **Stripe CLI** or **ngrok** to test webhooks locally:

#### Option 1: Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/payments/webhook/stripe

# Test webhook
stripe trigger checkout.session.completed
```

#### Option 2: Ngrok
```bash
# Start ngrok tunnel
ngrok http 5000

# Update webhook URL in Stripe dashboard
https://xxxx-xxxx-xxxx.ngrok.io/api/payments/webhook/stripe
```

---

## Monitoring & Logging

All payment events are logged using Winston logger:

```typescript
logger.info('Payment intent created', { transaction_code, provider });
logger.error('Payment failed', { transaction_code, error });
logger.warn('Webhook signature invalid', { provider });
```

**Log Locations:**
- Console output (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Payment provider 'stripe' is not configured` | Missing env variables | Add Stripe keys to `.env` |
| `Webhook verification failed` | Invalid signature | Check webhook secret |
| `Transaction not found` | Invalid payment ID | Check transaction exists |
| `Can only refund paid transactions` | Transaction not paid | Only refund paid transactions |

### Error Response Format

```json
{
  "error": "Failed to create payment intent",
  "details": "Stripe API key is invalid"
}
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Switch to **live API keys** (remove `_test_` from keys)
- [ ] Update webhook URLs to production domain
- [ ] Configure HTTPS/SSL certificates
- [ ] Set `NODE_ENV=production`
- [ ] Setup error monitoring (Sentry, etc.)
- [ ] Test webhook delivery in production
- [ ] Enable payment gateway dashboard alerts
- [ ] Setup backup and disaster recovery
- [ ] Document runbook for payment issues

### Environment Variables for Production

```bash
NODE_ENV=production
FRONTEND_URL=https://saintara.com

# Live Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Live Xendit Keys
XENDIT_SECRET_KEY=xnd_production_xxxxxxxxxxxxxxxxxxxxx
XENDIT_WEBHOOK_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

---

## Troubleshooting

### Issue: Webhooks Not Received

**Symptoms:** Transactions stuck in 'pending' status after payment

**Solutions:**
1. Check webhook URL is publicly accessible
2. Verify webhook secret is correct
3. Check payment gateway dashboard for delivery failures
4. Review server logs for webhook errors
5. Test webhook manually using provider's dashboard

### Issue: Payment Intent Creation Fails

**Symptoms:** Error when creating payment

**Solutions:**
1. Verify API keys are correct
2. Check amount is valid (positive number)
3. Ensure provider is configured (check logs)
4. Verify database connection is working

### Issue: Refund Fails

**Symptoms:** Refund request returns error

**Solutions:**
1. Verify transaction is in 'paid' status
2. Check refund amount doesn't exceed original amount
3. Ensure payment gateway has sufficient balance
4. For Xendit: Some payment methods require manual refunds

---

## Future Improvements

Potential enhancements for future versions:

- [ ] Add PayPal support
- [ ] Implement partial refunds
- [ ] Add payment retry mechanism
- [ ] Support for recurring subscriptions
- [ ] Payment analytics dashboard
- [ ] Multi-currency support
- [ ] Save payment methods for future use
- [ ] Email notifications for payment events
- [ ] SMS notifications for payment confirmations
- [ ] Installment payment support (Xendit)

---

## Support

For payment-related issues:

- **Stripe Support:** https://support.stripe.com
- **Xendit Support:** https://help.xendit.co
- **Backend Issues:** Create an issue in the repository

---

## License

This payment integration is part of the Saintara project and follows the same license terms.
