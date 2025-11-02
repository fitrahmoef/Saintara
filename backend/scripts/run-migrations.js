/**
 * Database Migration Script for Neon PostgreSQL
 *
 * This script runs all database migrations in the correct order.
 * Usage: node scripts/run-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Create database connection
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

// Migration files in order
const migrations = [
  {
    name: 'Main Schema',
    file: 'database/schema.sql',
  },
  {
    name: 'Seed Data',
    file: 'database/seed.sql',
  },
  {
    name: 'Articles Table',
    file: 'database/migrations/add_articles_table.sql',
  },
  {
    name: 'Password Reset Tokens',
    file: 'database/migrations/add_password_reset_tokens.sql',
  },
];

async function runMigration(name, filePath) {
  try {
    console.log(`${colors.blue}📄 Running migration: ${name}${colors.reset}`);

    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`${colors.yellow}⚠️  File not found: ${filePath}${colors.reset}`);
      return false;
    }

    const sql = fs.readFileSync(fullPath, 'utf8');

    await pool.query(sql);

    console.log(`${colors.green}✅ Successfully ran: ${name}${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error running ${name}:${colors.reset}`, error.message);

    // Check if error is due to table already existing
    if (error.message.includes('already exists')) {
      console.log(`${colors.yellow}⚠️  Table/object already exists, skipping...${colors.reset}\n`);
      return true;
    }

    return false;
  }
}

async function checkConnection() {
  try {
    console.log(`${colors.blue}🔌 Connecting to database...${colors.reset}`);

    const result = await pool.query('SELECT NOW()');

    console.log(`${colors.green}✅ Database connected successfully!${colors.reset}`);
    console.log(`${colors.blue}📅 Server time: ${result.rows[0].now}${colors.reset}\n`);

    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Database connection failed:${colors.reset}`, error.message);
    return false;
  }
}

async function verifyTables() {
  try {
    console.log(`${colors.blue}🔍 Verifying tables...${colors.reset}`);

    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`${colors.green}✅ Found ${result.rows.length} tables:${colors.reset}`);
    result.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.table_name}`);
    });

    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error verifying tables:${colors.reset}`, error.message);
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}
╔════════════════════════════════════════╗
║   Saintara Database Migration Tool     ║
╚════════════════════════════════════════╝
${colors.reset}`);

  // Check connection
  const connected = await checkConnection();
  if (!connected) {
    console.log(`${colors.red}Failed to connect to database. Please check your configuration.${colors.reset}`);
    process.exit(1);
  }

  // Ask for confirmation
  console.log(`${colors.yellow}⚠️  This will run all database migrations.${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Make sure you have a backup if running on production!${colors.reset}\n`);

  // Auto-proceed in non-interactive environments, or if you want to skip confirmation
  // For interactive confirmation, you'd need to use readline

  console.log(`${colors.blue}Starting migrations...${colors.reset}\n`);

  let successCount = 0;
  let failCount = 0;

  // Run migrations in order
  for (const migration of migrations) {
    const success = await runMigration(migration.name, migration.file);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Verify tables
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
  await verifyTables();

  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ Successful migrations: ${successCount}${colors.reset}`);

  if (failCount > 0) {
    console.log(`${colors.red}❌ Failed migrations: ${failCount}${colors.reset}`);
  }

  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  // Close connection
  await pool.end();

  if (failCount > 0) {
    process.exit(1);
  }

  console.log(`${colors.green}🎉 Migration completed successfully!${colors.reset}\n`);
}

// Run migrations
main().catch((error) => {
  console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error);
  process.exit(1);
});
