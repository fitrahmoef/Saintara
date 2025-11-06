# 📦 Database Backup & Recovery Guide

This document explains how to backup and restore the Saintara PostgreSQL database.

## Table of Contents

- [Quick Start](#quick-start)
- [Backup Scripts](#backup-scripts)
- [Manual Backup](#manual-backup)
- [Automated Backups](#automated-backups)
- [Restore Database](#restore-database)
- [Backup Verification](#backup-verification)
- [Disaster Recovery](#disaster-recovery)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Create a Backup

```bash
# Run from project root
./scripts/backup/backup-database.sh

# Or with custom name
./scripts/backup/backup-database.sh my_backup_name
```

### List Backups

```bash
./scripts/backup/list-backups.sh
```

### Restore from Backup

```bash
./scripts/backup/restore-database.sh ./backups/backup_20250115_120000.sql.gz
```

### Verify Backups

```bash
# Verify single backup
./scripts/backup/verify-backup.sh ./backups/backup_20250115_120000.sql.gz

# Verify all backups
./scripts/backup/verify-backup.sh all
```

---

## 📦 Backup Scripts

### Available Scripts

All backup scripts are located in `./scripts/backup/`:

| Script | Description |
|--------|-------------|
| `backup-database.sh` | Create a compressed database backup |
| `restore-database.sh` | Restore database from backup |
| `verify-backup.sh` | Verify backup integrity |
| `list-backups.sh` | List all available backups |
| `setup-cron.sh` | Setup automated daily backups |

### Script Features

✅ **Compression**: All backups are gzip compressed
✅ **Metadata**: Each backup includes a `.meta` JSON file with backup info
✅ **Integrity Check**: Automatic verification after backup
✅ **Retention**: Auto-delete backups older than 30 days (configurable)
✅ **Pre-restore Backup**: Automatic backup before restore
✅ **Rollback**: Automatic rollback if restore fails

---

## 📝 Manual Backup

### Basic Backup

Create a backup with default settings:

```bash
./scripts/backup/backup-database.sh
```

Output:
```
🔄 Starting database backup...
Database: saintara
Backup file: ./backups/backup_20250115_120000.sql.gz
✅ Backup completed successfully!
Backup file: ./backups/backup_20250115_120000.sql.gz
Backup size: 2.3M
🔍 Verifying backup integrity...
✅ Backup integrity verified
🧹 Cleaning up old backups (keeping last 30 days)...
Remaining backups: 15
✅ Database backup completed successfully!
```

### Custom Backup Name

```bash
./scripts/backup/backup-database.sh before_migration
```

This creates: `./backups/before_migration.sql.gz`

### Environment Variables

Configure backup behavior with environment variables:

```bash
# Backup directory (default: ./backups)
export BACKUP_DIR="/mnt/backups"

# Retention period in days (default: 30)
export BACKUP_RETENTION_DAYS=90

# Run backup
./scripts/backup/backup-database.sh
```

### Backup to S3 (Optional)

After creating a backup, upload to S3 for off-site storage:

```bash
# Install AWS CLI
# apt-get install awscli  # Ubuntu
# brew install awscli     # macOS

# Configure AWS credentials
aws configure

# Upload backup
aws s3 cp ./backups/backup_20250115_120000.sql.gz s3://my-bucket/saintara-backups/

# Sync all backups
aws s3 sync ./backups/ s3://my-bucket/saintara-backups/
```

---

## ⏰ Automated Backups

### Setup Automated Daily Backups

Run the setup script to configure cron:

```bash
./scripts/backup/setup-cron.sh
```

This will:
1. Make backup script executable
2. Create log directory
3. Add cron job for daily backups at 2 AM
4. Store logs in `./logs/backup/`

### Custom Backup Schedule

Edit the cron job manually:

```bash
# Open crontab editor
crontab -e

# Examples:

# Daily at 2 AM
0 2 * * * /path/to/scripts/backup/backup-database.sh >> /path/to/logs/backup.log 2>&1

# Every 6 hours
0 */6 * * * /path/to/scripts/backup/backup-database.sh >> /path/to/logs/backup.log 2>&1

# Every Sunday at 3 AM
0 3 * * 0 /path/to/scripts/backup/backup-database.sh >> /path/to/logs/backup.log 2>&1

# Weekdays at 1 AM
0 1 * * 1-5 /path/to/scripts/backup/backup-database.sh >> /path/to/logs/backup.log 2>&1
```

### View Backup Logs

```bash
# Today's backup log
tail -f ./logs/backup/backup-$(date +%Y%m%d).log

# List all logs
ls -lh ./logs/backup/

# View specific log
cat ./logs/backup/backup-20250115.log
```

### Verify Cron is Running

```bash
# Ubuntu/Debian
sudo systemctl status cron

# CentOS/RHEL
sudo systemctl status crond

# View cron logs
sudo tail -f /var/log/syslog | grep CRON    # Ubuntu/Debian
sudo tail -f /var/log/cron                   # CentOS/RHEL
```

---

## 🔄 Restore Database

### Full Restore

⚠️ **WARNING**: This will OVERWRITE your current database!

```bash
./scripts/backup/restore-database.sh ./backups/backup_20250115_120000.sql.gz
```

The script will:
1. Verify backup integrity
2. Create a pre-restore backup (safety net)
3. Ask for confirmation
4. Restore the database
5. Verify the restore
6. Rollback if restore fails

### Example Restore Session

```bash
$ ./scripts/backup/restore-database.sh ./backups/backup_20250115_120000.sql.gz

⚠️  WARNING: This will OVERWRITE the current database!
Database: saintara
Backup file: ./backups/backup_20250115_120000.sql.gz

Are you sure you want to continue? (yes/no): yes
🔍 Verifying backup integrity...
✅ Backup integrity verified
📦 Creating pre-restore backup...
✅ Pre-restore backup created: ./backups/pre_restore_20250115_123456.sql.gz
🔄 Starting database restore...
✅ Database restore completed successfully!
🔍 Verifying restore...
Tables restored: 20
✅ Restore verification successful
✅ Database restore completed successfully!
```

### Restore Specific Tables

To restore only specific tables, use `pg_restore` directly:

```bash
# Extract backup
gunzip -c ./backups/backup_20250115_120000.sql.gz > /tmp/backup.sql

# Restore specific tables
psql -h localhost -U postgres -d saintara -c "DROP TABLE IF EXISTS users CASCADE;"
psql -h localhost -U postgres -d saintara < /tmp/backup.sql -t users

# Clean up
rm /tmp/backup.sql
```

---

## ✅ Backup Verification

### Why Verify Backups?

Regular verification ensures:
- Backups are not corrupted
- Backups can be restored when needed
- Early detection of backup issues

### Verify Single Backup

```bash
./scripts/backup/verify-backup.sh ./backups/backup_20250115_120000.sql.gz
```

Output:
```
🔍 Verifying: backup_20250115_120000.sql.gz
   Size: 2 MB
✅ Integrity check passed
   Metadata:
   "backup_date": "2025-01-15T12:00:00Z",
   "database_name": "saintara",
```

### Verify All Backups

```bash
./scripts/backup/verify-backup.sh all
```

Output:
```
🔍 Verifying all backups in ./backups...

🔍 Verifying: backup_20250115_120000.sql.gz
   Size: 2 MB
✅ Integrity check passed

🔍 Verifying: backup_20250114_120000.sql.gz
   Size: 2 MB
✅ Integrity check passed

================================
Verification Summary
================================
Total backups: 15
Passed: 15
Failed: 0
✅ All backups are valid
```

### Automated Verification

Add verification to your cron job:

```bash
crontab -e

# Backup daily at 2 AM, verify at 3 AM
0 2 * * * /path/to/scripts/backup/backup-database.sh >> /path/to/logs/backup.log 2>&1
0 3 * * * /path/to/scripts/backup/verify-backup.sh all >> /path/to/logs/verify.log 2>&1
```

---

## 🚨 Disaster Recovery

### Disaster Recovery Plan

**Recovery Time Objective (RTO)**: < 1 hour
**Recovery Point Objective (RPO)**: < 24 hours (daily backups)

### Disaster Scenarios & Solutions

#### 1. Accidental Data Deletion

**Scenario**: User accidentally deleted important data

**Solution**:
```bash
# List recent backups
./scripts/backup/list-backups.sh

# Restore from most recent backup
./scripts/backup/restore-database.sh ./backups/backup_latest.sql.gz
```

**Estimated Recovery Time**: 10-30 minutes

---

#### 2. Database Corruption

**Scenario**: Database is corrupted and cannot start

**Solution**:
```bash
# Stop application
docker-compose down

# Restore from last known good backup
./scripts/backup/restore-database.sh ./backups/backup_20250115_120000.sql.gz

# Restart application
docker-compose up -d

# Verify
docker-compose logs -f backend
```

**Estimated Recovery Time**: 30-60 minutes

---

#### 3. Complete Server Failure

**Scenario**: Server crashed and is unrecoverable

**Solution**:
```bash
# On new server:

# 1. Clone repository
git clone https://github.com/your-org/saintara.git
cd saintara

# 2. Configure environment
cp .env.example .env
nano .env  # Update with production values

# 3. Start database
docker-compose up -d postgres

# 4. Download backup from S3 (if using)
aws s3 cp s3://my-bucket/saintara-backups/backup_latest.sql.gz ./backups/

# 5. Restore database
./scripts/backup/restore-database.sh ./backups/backup_latest.sql.gz

# 6. Start application
docker-compose up -d
```

**Estimated Recovery Time**: 1-2 hours

---

#### 4. Ransomware Attack

**Scenario**: Database encrypted by ransomware

**Solution**:
```bash
# DO NOT PAY RANSOM!

# 1. Isolate infected system
# Disconnect from network immediately

# 2. Scan for malware
# Run antivirus and malware removal tools

# 3. Restore from clean backup
# Use backup from BEFORE infection (may be several days old)

# 4. Change all credentials
# Database passwords, API keys, JWT secrets, etc.

# 5. Review security logs
# Identify how ransomware entered

# 6. Patch vulnerabilities
# Update all software and dependencies
```

**Estimated Recovery Time**: 4-8 hours

---

### Disaster Recovery Drill

**Perform quarterly disaster recovery drills** to ensure team readiness:

```bash
# Quarterly DR Drill Checklist

# 1. Create test environment
docker-compose -f docker-compose.test.yml up -d

# 2. Restore latest backup to test environment
./scripts/backup/restore-database.sh ./backups/backup_latest.sql.gz

# 3. Verify data integrity
# Check critical tables, run queries, test application

# 4. Document time taken
# Record RTO (actual recovery time)

# 5. Identify improvements
# Update DR plan based on findings

# 6. Document results
# Save DR drill report
```

---

## ✨ Best Practices

### 1. Backup Frequency

| Environment | Frequency | Retention |
|-------------|-----------|-----------|
| **Production** | Daily | 30 days |
| **Staging** | Weekly | 14 days |
| **Development** | Weekly | 7 days |

### 2. Backup Storage

✅ **Local Storage**: Fast restore, protect against data deletion
✅ **Off-site Storage**: Protect against server failure (S3, Google Cloud Storage)
✅ **Multiple Locations**: Store backups in multiple geographic regions

**3-2-1 Rule**:
- **3** copies of data
- **2** different storage types
- **1** off-site copy

### 3. Encryption

Encrypt backups before uploading to cloud:

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 ./backups/backup_20250115_120000.sql.gz

# Upload encrypted backup
aws s3 cp ./backups/backup_20250115_120000.sql.gz.gpg s3://my-bucket/

# Decrypt backup
gpg --decrypt ./backups/backup_20250115_120000.sql.gz.gpg > backup.sql.gz
```

### 4. Test Restores

**Test restores monthly** to ensure backups are valid:

```bash
# Create test database
createdb saintara_test

# Restore to test database
gunzip -c ./backups/backup_20250115_120000.sql.gz | psql -d saintara_test

# Verify data
psql -d saintara_test -c "SELECT COUNT(*) FROM users;"

# Clean up
dropdb saintara_test
```

### 5. Monitor Backup Status

**Set up alerts** for backup failures:

```bash
# Add to backup script
if [ $? -ne 0 ]; then
  # Send email alert
  echo "Backup failed!" | mail -s "ALERT: Backup Failed" admin@saintara.com

  # Send Slack notification
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 Database backup failed!"}' \
    $SLACK_WEBHOOK_URL
fi
```

### 6. Document Recovery Procedures

Keep recovery procedures up-to-date:
- Document contact information for on-call personnel
- Document credentials and access details
- Document step-by-step recovery procedures
- Review and update quarterly

---

## 🔧 Troubleshooting

### Backup Failed: Permission Denied

**Problem**: Script cannot write to backup directory

**Solution**:
```bash
# Create directory and set permissions
mkdir -p ./backups
chmod 755 ./backups

# Or specify different directory
export BACKUP_DIR="/tmp/backups"
./scripts/backup/backup-database.sh
```

---

### Backup Failed: Authentication Failed

**Problem**: Cannot connect to database

**Solution**:
```bash
# Check environment variables
echo $DB_HOST
echo $DB_USER
echo $DATABASE_URL

# Test connection manually
psql -h localhost -U postgres -d saintara -c "SELECT 1;"

# Update .env file
nano .env
```

---

### Restore Failed: Database Does Not Exist

**Problem**: Target database doesn't exist

**Solution**:
```bash
# Create database first
createdb saintara

# Or via psql
psql -U postgres -c "CREATE DATABASE saintara;"

# Then restore
./scripts/backup/restore-database.sh ./backups/backup.sql.gz
```

---

### Backup Too Large

**Problem**: Backup file is very large

**Solution**:
```bash
# Use custom compression (higher ratio)
pg_dump -h localhost -U postgres -d saintara | gzip -9 > backup.sql.gz

# Or use xz compression (better ratio, slower)
pg_dump -h localhost -U postgres -d saintara | xz -9 > backup.sql.xz

# Exclude large tables
pg_dump -h localhost -U postgres -d saintara \
  --exclude-table=logs \
  --exclude-table=analytics \
  | gzip > backup.sql.gz
```

---

### Cron Job Not Running

**Problem**: Automated backups are not working

**Solution**:
```bash
# Check cron service
sudo systemctl status cron

# Check crontab
crontab -l

# Check logs
sudo tail -f /var/log/syslog | grep CRON

# Verify script is executable
ls -l ./scripts/backup/backup-database.sh

# Add logging to crontab
0 2 * * * /path/to/backup-database.sh >> /var/log/backup.log 2>&1
```

---

## 📚 Additional Resources

- [PostgreSQL Backup & Restore](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [pg_restore Documentation](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [Cron Tutorial](https://crontab.guru/)
- [AWS S3 CLI](https://docs.aws.amazon.com/cli/latest/reference/s3/)

---

## 📞 Support

If you need help with backups or disaster recovery:

1. Check logs: `./logs/backup/`
2. Verify backup integrity: `./scripts/backup/verify-backup.sh all`
3. Contact your database administrator
4. Review this documentation

---

**Last Updated**: 2025-01-15
**Maintainer**: DevOps Team
