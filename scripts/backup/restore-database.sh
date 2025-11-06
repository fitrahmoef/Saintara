#!/bin/bash

#############################################
# Database Restore Script for Saintara
#############################################
# This script restores a PostgreSQL database from a backup
# Usage: ./restore-database.sh <backup_file>
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Backup file not specified${NC}"
  echo "Usage: $0 <backup_file>"
  echo "Example: $0 ./backups/backup_20250115_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_FILE}${NC}"
  exit 1
fi

# Load environment variables
if [ -f "$(dirname "$0")/../../.env" ]; then
  export $(grep -v '^#' $(dirname "$0")/../../.env | xargs)
fi

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-saintara}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"

# If using DATABASE_URL (Neon/Supabase)
if [ ! -z "$DATABASE_URL" ]; then
  export PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | cut -d'?' -f1)
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
else
  export PGPASSWORD="${DB_PASSWORD}"
fi

echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
echo "Database: ${DB_NAME}"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo -e "${YELLOW}🚫 Restore cancelled${NC}"
  exit 0
fi

# Verify backup integrity
echo -e "${YELLOW}🔍 Verifying backup integrity...${NC}"
if ! gunzip -t "${BACKUP_FILE}" 2>/dev/null; then
  echo -e "${RED}❌ Backup file is corrupted!${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Backup integrity verified${NC}"

# Create a pre-restore backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PRE_RESTORE_BACKUP="./backups/pre_restore_${TIMESTAMP}.sql.gz"
mkdir -p ./backups

echo -e "${YELLOW}📦 Creating pre-restore backup...${NC}"
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-acl | gzip > "${PRE_RESTORE_BACKUP}"; then
  echo -e "${GREEN}✅ Pre-restore backup created: ${PRE_RESTORE_BACKUP}${NC}"
else
  echo -e "${YELLOW}⚠️  Pre-restore backup failed (database might be empty)${NC}"
fi

# Perform restore
echo -e "${YELLOW}🔄 Starting database restore...${NC}"

if gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database restore completed successfully!${NC}"

  # Verify restore
  echo -e "${YELLOW}🔍 Verifying restore...${NC}"
  TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
  echo "Tables restored: ${TABLE_COUNT}"

  if [ "${TABLE_COUNT}" -gt 0 ]; then
    echo -e "${GREEN}✅ Restore verification successful${NC}"
  else
    echo -e "${RED}❌ Warning: No tables found after restore${NC}"
  fi

else
  echo -e "${RED}❌ Restore failed!${NC}"
  echo -e "${YELLOW}💡 Rolling back to pre-restore backup...${NC}"

  if [ -f "${PRE_RESTORE_BACKUP}" ]; then
    gunzip -c "${PRE_RESTORE_BACKUP}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1
    echo -e "${GREEN}✅ Rolled back to pre-restore state${NC}"
  else
    echo -e "${RED}❌ Rollback failed - pre-restore backup not found${NC}"
  fi

  unset PGPASSWORD
  exit 1
fi

# Unset password
unset PGPASSWORD

echo -e "${GREEN}✅ Database restore completed successfully!${NC}"
