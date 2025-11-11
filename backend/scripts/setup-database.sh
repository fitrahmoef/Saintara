#!/bin/bash

# Saintara Database Setup Script
# This script will create and initialize the Saintara database

set -e  # Exit on error

echo "🚀 Saintara Database Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_NAME="saintara"
DB_USER="postgres"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"

# Check if .env file exists
if [ -f "../.env" ]; then
    echo "📄 Loading configuration from .env file..."
    source ../.env

    if [ ! -z "$DB_NAME" ]; then
        DB_NAME=$DB_NAME
    fi
    if [ ! -z "$DB_USER" ]; then
        DB_USER=$DB_USER
    fi
    if [ ! -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$DB_PASSWORD
    fi
    if [ ! -z "$DB_HOST" ]; then
        DB_HOST=$DB_HOST
    fi
    if [ ! -z "$DB_PORT" ]; then
        DB_PORT=$DB_PORT
    fi
fi

echo ""
echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Function to run SQL file
run_sql() {
    local file=$1
    local description=$2

    echo -n "  - $description... "

    if [ ! -z "$DB_PASSWORD" ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" > /dev/null 2>&1
    else
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" > /dev/null 2>&1
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi
}

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL client (psql) is not installed.${NC}"
    echo "Please install PostgreSQL first:"
    echo "  - macOS: brew install postgresql@14"
    echo "  - Ubuntu: sudo apt install postgresql-client"
    echo "  - Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Test database connection
echo "🔌 Testing database connection..."
if [ ! -z "$DB_PASSWORD" ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "\q" > /dev/null 2>&1
else
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "\q" > /dev/null 2>&1
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Cannot connect to PostgreSQL${NC}"
    echo ""
    echo "Please check:"
    echo "  1. PostgreSQL is running"
    echo "  2. Username and password are correct"
    echo "  3. Database credentials in .env file"
    exit 1
fi
echo -e "${GREEN}✓ Connection successful${NC}"
echo ""

# Check if database exists
echo "📦 Checking if database exists..."
if [ ! -z "$DB_PASSWORD" ]; then
    DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
else
    DB_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
fi

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠  Database '$DB_NAME' already exists${NC}"
    echo ""
    read -p "Do you want to continue? This will add/update tables. (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
else
    echo "Creating database '$DB_NAME'..."
    if [ ! -z "$DB_PASSWORD" ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1
    else
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database created${NC}"
    else
        echo -e "${RED}✗ Failed to create database${NC}"
        exit 1
    fi
fi
echo ""

# Run schema
echo "📊 Setting up database schema..."
run_sql "../database/schema.sql" "Creating tables from schema"
echo ""

# Run migrations
echo "🔄 Running migrations..."

if [ -f "../database/migrations/add_password_reset_tokens.sql" ]; then
    run_sql "../database/migrations/add_password_reset_tokens.sql" "Adding password reset tokens"
fi

if [ -f "../database/migrations/002_add_email_verification.sql" ]; then
    run_sql "../database/migrations/002_add_email_verification.sql" "Adding email verification"
fi

if [ -f "../database/migrations/add_biodata_fields.sql" ]; then
    run_sql "../database/migrations/add_biodata_fields.sql" "Adding biodata fields"
fi

if [ -f "../migrations/006_add_institution_hierarchy.sql" ]; then
    run_sql "../migrations/006_add_institution_hierarchy.sql" "Adding institution hierarchy"
fi

if [ -f "../migrations/011_add_refresh_tokens_and_csrf.sql" ]; then
    run_sql "../migrations/011_add_refresh_tokens_and_csrf.sql" "Adding refresh tokens"
fi

echo ""

# Optional: Run seed data
if [ -f "../database/seed.sql" ]; then
    echo "🌱 Seed data available"
    read -p "Do you want to load seed data? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_sql "../database/seed.sql" "Loading seed data"
        echo ""
    fi
fi

# Verify tables
echo "🔍 Verifying database setup..."
if [ ! -z "$DB_PASSWORD" ]; then
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
else
    TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
fi

if [ $TABLE_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Database setup complete! ($TABLE_COUNT tables created)${NC}"
else
    echo -e "${RED}✗ No tables found. Something went wrong.${NC}"
    exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ Database is ready!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Start the backend server: npm run dev"
echo "  2. Open http://localhost:5000/api/health to verify"
echo "  3. Test registration at http://localhost:3000/register"
echo ""
echo "Database info:"
echo "  Connection: postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "  Tables: $TABLE_COUNT"
echo ""
