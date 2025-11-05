import { Pool } from 'pg'
import { neon, neonConfig } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

// Configure Neon for WebSocket connections (required for serverless environments)
neonConfig.fetchConnectionCache = true

// Create database pool based on configuration
// Support both Neon connection string (DATABASE_URL) and traditional PostgreSQL config
let pool: Pool

if (process.env.DATABASE_URL) {
  // Neon Database connection using connection string
  console.log('📊 Configuring Neon Database connection...')

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error if connection takes longer than 10 seconds
  })
} else {
  // Traditional PostgreSQL connection using individual parameters
  console.log('📊 Configuring traditional PostgreSQL connection...')

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
  console.log('✅ Database connected successfully')
})

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err)
  process.exit(-1)
})

// Helper function to test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    console.log('✅ Database connection test successful:', result.rows[0].now)
    return true
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return false
  }
}

// Helper function to get Neon SQL client (for serverless functions)
export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export default pool
