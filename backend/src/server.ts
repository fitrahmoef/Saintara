import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import pool from './config/database'
import { generalLimiter } from './middleware/rate-limit.middleware'
import { csrfProtection } from './middleware/csrf.middleware'
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware'
import { swaggerSpec } from './config/swagger'
import logger, { morganStream } from './config/logger'

// Import routes
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import testRoutes from './routes/test.routes'
import resultRoutes from './routes/result.routes'
import adminRoutes from './routes/admin.routes'
import transactionRoutes from './routes/transaction.routes'
import voucherRoutes from './routes/voucher.routes'
import agentRoutes from './routes/agent.routes'
import eventRoutes from './routes/event.routes'
import approvalRoutes from './routes/approval.routes'
import articleRoutes from './routes/article.routes'
import institutionRoutes from './routes/institution.routes'
import customerRoutes from './routes/customer.routes'
import paymentRoutes from './routes/payment.routes'
import productRoutes from './routes/product.routes'
import faqRoutes from './routes/faq.routes'
import partnershipRoutes from './routes/partnership.routes'

// Import payment service
import { initializePaymentService } from './services/payment/PaymentService'
import { PaymentConfig } from './types/payment.types'
import { rawBodyMiddleware } from './middleware/rawBody'

dotenv.config()

// Initialize Payment Service
const paymentConfig: PaymentConfig = {
  stripe: process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET ? {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  } : undefined,
  xendit: process.env.XENDIT_SECRET_KEY && process.env.XENDIT_WEBHOOK_TOKEN ? {
    secretKey: process.env.XENDIT_SECRET_KEY,
    webhookToken: process.env.XENDIT_WEBHOOK_TOKEN,
  } : undefined,
  defaultProvider: (process.env.DEFAULT_PAYMENT_PROVIDER as any) || 'stripe',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
};

try {
  initializePaymentService(paymentConfig);
  logger.info('✅ Payment service initialized successfully');
} catch (error) {
  logger.warn('⚠️  Payment service initialization failed. Payment gateway features will be unavailable.');
  logger.warn(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

const app: Application = express()
const PORT = process.env.PORT || 5000

// Middleware
// Enhanced security headers with Helmet
app.use(helmet({
  // Enforce HTTPS with HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  // Content Security Policy (CSP)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: 'deny',
  },
  // X-Content-Type-Options: Prevent MIME type sniffing
  noSniff: true,
  // X-XSS-Protection: Enable XSS filter (legacy browsers)
  xssFilter: true,
  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}))

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('combined', { stream: morganStream }))

// Cookie parser middleware (for httpOnly auth cookies)
app.use(cookieParser())

// Raw body middleware for webhooks (must be before express.json())
app.use(rawBodyMiddleware)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Saintara API Docs',
}))

// Serve Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Apply rate limiting to all API routes
app.use('/api/', generalLimiter)

// Apply CSRF protection to all API routes
app.use('/api/', csrfProtection)

// Health check route
app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT NOW()')
    res.status(200).json({
      status: 'success',
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
    })
  }
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/results', resultRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/vouchers', voucherRoutes)
app.use('/api/agents', agentRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/institutions', institutionRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/products', productRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/api/partnership', partnershipRoutes)

// 404 Handler - must be after all routes
app.use(notFoundHandler)

// Global Error Handler - must be last
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`)
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
})

export default app
