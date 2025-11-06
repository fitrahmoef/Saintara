#!/bin/bash

#######################################################
# Database Restore Script
#
# Restores a Saintara database backup
#
# Usage:
#   ./restore-database.sh <backup_file>
#   ./restore-database.sh --s3 s3://bucket/path/to/backup.sql.gz
#######################################################

set -e  # Exit on error

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-saintara}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Check arguments
if [ $# -eq 0 ]; then
  echo "Usage: $0 <backup_file>"
  echo "   or: $0 --s3 <s3_path>"
  exit 1
fi

BACKUP_FILE="$1"
IS_S3=false

# Check if S3 path
if [ "$1" = "--s3" ]; then
  if [ $# -lt 2 ]; then
    echo "Error: S3 path required"
    exit 1
  fi

  S3_PATH="$2"
  BACKUP_FILE="/tmp/restore_backup_$(date +%s).sql.gz"
  IS_S3=true

  echo "Downloading backup from S3..."
  aws s3 cp "$S3_PATH" "$BACKUP_FILE"
  echo "✓ Downloaded to $BACKUP_FILE"
fi

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "========================================="
echo "Saintara Database Restore"
echo "========================================="
echo "Timestamp: $(date)"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo "========================================="

# Verify backup integrity
echo "Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "✓ Backup verification successful"
else
  echo "✗ Backup file is corrupted!"
  exit 1
fi

# Confirm restore
read -p "⚠ This will REPLACE the current database. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

# Create backup of current database before restore
echo "Creating safety backup of current database..."
SAFETY_BACKUP="/tmp/saintara_pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$SAFETY_BACKUP"
echo "✓ Safety backup created: $SAFETY_BACKUP"

# Restore database
echo "Restoring database..."
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

echo "✓ Database restored successfully"

# Clean up downloaded S3 file
if [ "$IS_S3" = true ]; then
  rm -f "$BACKUP_FILE"
  echo "✓ Cleaned up temporary files"
fi

echo "========================================="
echo "Restore completed at $(date)"
echo "Safety backup: $SAFETY_BACKUP"
echo "========================================="
