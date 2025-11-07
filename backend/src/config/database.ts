import { Pool } from 'pg'
import { neon, neonConfig } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import logger from './logger'

dotenv.config()

// Configure Neon for WebSocket connections (required for serverless environments)
neonConfig.fetchConnectionCache = true

// Create database pool based on configuration
// Support both Neon connection string (DATABASE_URL) and traditional PostgreSQL config
let pool: Pool

if (process.env.DATABASE_URL) {
  // Neon Database connection using connection string
  logger.info('📊 Configuring Neon Database connection...')

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error if connection takes longer than 10 seconds
  })
} else {
  // Traditional PostgreSQL connection using individual parameters
  logger.info('📊 Configuring traditional PostgreSQL connection...')

  pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })
}

// Connection event handlers
pool.on('connect', () => {
  logger.info('✅ Database connected successfully')
})

pool.on('error', (err) => {
  // FIXED: Don't crash server on DB error - log and handle gracefully
  logger.error('❌ Unexpected error on idle client', err)

  // Log critical error but don't crash the server
  // The error will be handled in individual queries
  if (err.message.includes('Connection terminated') ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('ETIMEDOUT')) {
    logger.error('🔴 CRITICAL: Database connection lost. Attempting to reconnect...')
    // Pool will automatically attempt to reconnect on next query
  }

  // Don't call process.exit() - let the app continue running
  // Individual queries will handle connection errors appropriately
})

// Helper function to test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    logger.info('✅ Database connection test successful:', result.rows[0].now)
    return true
  } catch (error) {
    logger.error('❌ Database connection test failed:', error)
    return false
  }
}

// Helper function to get Neon SQL client (for serverless functions)
export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export default pool
