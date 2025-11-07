/**
 * Database Connection Test Script
 *
 * This script tests the connection to your database (Neon or PostgreSQL)
 * Run with: npm run db:test
 */

import pool, { testConnection } from '../config/database'
import logger from '../config/logger'
import dotenv from 'dotenv'

dotenv.config()

async function testDatabaseConnection() {
  logger.info('🔍 Testing database connection...\n')

  // Display connection information
  if (process.env.DATABASE_URL) {
    // Extract host from connection string for display (hide password)
    const url = new URL(process.env.DATABASE_URL)
    logger.info('📊 Connection Type: Neon Database (Serverless PostgreSQL)')
    logger.info(`🌐 Host: ${url.host}`)
    logger.info(`🗄️  Database: ${url.pathname.slice(1)}\n`)
  } else {
    logger.info('📊 Connection Type: Traditional PostgreSQL')
    logger.info(`🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`)
    logger.info(`🗄️  Database: ${process.env.DB_NAME}\n`)
  }

  // Test connection
  const success = await testConnection()

  if (success) {
    // Get additional database info
    try {
      const client = await pool.connect()

      // Get PostgreSQL version
      const versionResult = await client.query('SELECT version()')
      logger.info('\n📌 PostgreSQL Version:')
      logger.info(versionResult.rows[0].version.split('\n')[0])

      // Get database size
      const sizeResult = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `)
      logger.info(`\n💾 Database Size: ${sizeResult.rows[0].size}`)

      // Get number of tables
      const tablesResult = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `)
      logger.info(`📋 Number of Tables: ${tablesResult.rows[0].count}`)

      // List all tables
      const tableListResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)

      if (tableListResult.rows.length > 0) {
        logger.info('\n📚 Tables in database:')
        tableListResult.rows.forEach((row, index) => {
          logger.info(`   ${index + 1}. ${row.table_name}`)
        })
      }

      client.release()

      logger.info('\n✅ Database connection test completed successfully!')
      logger.info('🎉 Your database is ready to use!\n')

      process.exit(0)
    } catch (error) {
      logger.error('\n❌ Error getting database information:', error)
      process.exit(1)
    }
  } else {
    logger.info('\n❌ Database connection test failed!')
    logger.info('\n📝 Troubleshooting steps:')
    logger.info('   1. Check your .env file configuration')
    logger.info('   2. Verify your DATABASE_URL or database credentials')
    logger.info('   3. Ensure your Neon database is active (if using Neon)')
    logger.info('   4. Check your network connection')
    logger.info('   5. Verify firewall settings\n')

    process.exit(1)
  }
}

// Run the test
testDatabaseConnection()
