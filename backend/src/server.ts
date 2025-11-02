import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import pool from './config/database'
import { generalLimiter } from './middleware/rate-limit.middleware'
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

dotenv.config()

const app: Application = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('combined', { stream: morganStream }))
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

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  })
})

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`)
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
})

export default app
