/**
 * Database Initialization Script for Neon
 *
 * This script initializes your Neon database with the required schema
 * Run with: npm run db:init
 */

import pool from '../config/database'
import logger from '../config/logger'
import dotenv from 'dotenv'
import logger from '../config/logger'
import fs from 'fs'
import logger from '../config/logger'
import path from 'path'
import logger from '../config/logger'

dotenv.config()

async function initializeDatabase() {
  logger.info('🚀 Starting database initialization...\n')

  try {
    const client = await pool.connect()

    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql')
    logger.info('📖 Reading schema file...')

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`)
    }

    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Execute schema
    logger.info('🔨 Creating database schema...')
    await client.query(schema)
    logger.info('✅ Schema created successfully!')

    // Check if we should run seed data
    const seedPath = path.join(__dirname, '../../database/seed.sql')

    if (fs.existsSync(seedPath)) {
      logger.info('\n📦 Seed file found. Do you want to run seed data? (Y/n)')
      logger.info('💡 Running seed data automatically...')

      const seed = fs.readFileSync(seedPath, 'utf8')
      await client.query(seed)
      logger.info('✅ Seed data inserted successfully!')
    }

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    logger.info('\n📚 Created tables:')
    tablesResult.rows.forEach((row, index) => {
      logger.info(`   ${index + 1}. ${row.table_name}`)
    })

    client.release()

    logger.info('\n🎉 Database initialization completed successfully!')
    logger.info('✨ Your Neon database is ready to use!\n')

    process.exit(0)
  } catch (error) {
    logger.error('\n❌ Database initialization failed:', error)
    logger.info('\n📝 Error details:')

    if (error instanceof Error) {
      logger.info(error.message)
    }

    logger.info('\n💡 Tips:')
    logger.info('   - Make sure your DATABASE_URL is correct')
    logger.info('   - Verify your Neon database is active')
    logger.info('   - Check that schema.sql exists in backend/database/')
    logger.info('   - Ensure you have proper permissions\n')

    process.exit(1)
  }
}

// Run the initialization
initializeDatabase()
