/**
 * Database Connection Test Script
 *
 * This script tests the connection to your database (Neon or PostgreSQL)
 * Run with: npm run db:test
 */

import pool, { testConnection } from '../config/database'
import dotenv from 'dotenv'

dotenv.config()

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n')

  // Display connection information
  if (process.env.DATABASE_URL) {
    // Extract host from connection string for display (hide password)
    const url = new URL(process.env.DATABASE_URL)
    console.log('📊 Connection Type: Neon Database (Serverless PostgreSQL)')
    console.log(`🌐 Host: ${url.host}`)
    console.log(`🗄️  Database: ${url.pathname.slice(1)}\n`)
  } else {
    console.log('📊 Connection Type: Traditional PostgreSQL')
    console.log(`🌐 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`)
    console.log(`🗄️  Database: ${process.env.DB_NAME}\n`)
  }

  // Test connection
  const success = await testConnection()

  if (success) {
    // Get additional database info
    try {
      const client = await pool.connect()

      // Get PostgreSQL version
      const versionResult = await client.query('SELECT version()')
      console.log('\n📌 PostgreSQL Version:')
      console.log(versionResult.rows[0].version.split('\n')[0])

      // Get database size
      const sizeResult = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `)
      console.log(`\n💾 Database Size: ${sizeResult.rows[0].size}`)

      // Get number of tables
      const tablesResult = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `)
      console.log(`📋 Number of Tables: ${tablesResult.rows[0].count}`)

      // List all tables
      const tableListResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)

      if (tableListResult.rows.length > 0) {
        console.log('\n📚 Tables in database:')
        tableListResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.table_name}`)
        })
      }

      client.release()

      console.log('\n✅ Database connection test completed successfully!')
      console.log('🎉 Your database is ready to use!\n')

      process.exit(0)
    } catch (error) {
      console.error('\n❌ Error getting database information:', error)
      process.exit(1)
    }
  } else {
    console.log('\n❌ Database connection test failed!')
    console.log('\n📝 Troubleshooting steps:')
    console.log('   1. Check your .env file configuration')
    console.log('   2. Verify your DATABASE_URL or database credentials')
    console.log('   3. Ensure your Neon database is active (if using Neon)')
    console.log('   4. Check your network connection')
    console.log('   5. Verify firewall settings\n')

    process.exit(1)
  }
}

// Run the test
testDatabaseConnection()
