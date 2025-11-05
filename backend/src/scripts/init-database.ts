/**
 * Database Initialization Script for Neon
 *
 * This script initializes your Neon database with the required schema
 * Run with: npm run db:init
 */

import pool from '../config/database'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...\n')

  try {
    const client = await pool.connect()

    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql')
    console.log('📖 Reading schema file...')

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`)
    }

    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Execute schema
    console.log('🔨 Creating database schema...')
    await client.query(schema)
    console.log('✅ Schema created successfully!')

    // Check if we should run seed data
    const seedPath = path.join(__dirname, '../../database/seed.sql')

    if (fs.existsSync(seedPath)) {
      console.log('\n📦 Seed file found. Do you want to run seed data? (Y/n)')
      console.log('💡 Running seed data automatically...')

      const seed = fs.readFileSync(seedPath, 'utf8')
      await client.query(seed)
      console.log('✅ Seed data inserted successfully!')
    }

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    console.log('\n📚 Created tables:')
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`)
    })

    client.release()

    console.log('\n🎉 Database initialization completed successfully!')
    console.log('✨ Your Neon database is ready to use!\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error)
    console.log('\n📝 Error details:')

    if (error instanceof Error) {
      console.log(error.message)
    }

    console.log('\n💡 Tips:')
    console.log('   - Make sure your DATABASE_URL is correct')
    console.log('   - Verify your Neon database is active')
    console.log('   - Check that schema.sql exists in backend/database/')
    console.log('   - Ensure you have proper permissions\n')

    process.exit(1)
  }
}

// Run the initialization
initializeDatabase()
