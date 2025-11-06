#!/bin/bash

# Script to replace console.log with logger in all TypeScript files
# This helps identify files that need manual review for sensitive data

echo "Finding all console.log/error/warn instances in backend..."

# Find all .ts files with console statements
find /home/user/Saintara/backend/src -type f -name "*.ts" -exec grep -l "console\.\(log\|error\|warn\|info\|debug\)" {} \; | sort

echo ""
echo "Total files with console statements:"
find /home/user/Saintara/backend/src -type f -name "*.ts" -exec grep -l "console\.\(log\|error\|warn\|info\|debug\)" {} \; | wc -l
