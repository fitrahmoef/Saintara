#!/bin/bash

# Automated script to replace console.log with logger
# Ensures all files import logger and use it consistently

BACKEND_DIR="/home/user/Saintara/backend/src"

# Function to add logger import if not present
add_logger_import() {
    local file="$1"

    # Check if logger is already imported
    if ! grep -q "import.*logger.*from.*config/logger" "$file" && \
       ! grep -q "import.*logger.*from.*utils/logger" "$file" && \
       ! grep -q "import.*logger.*from.*'\.\./config/logger'" "$file" && \
       ! grep -q "import.*logger.*from.*'\.\./utils/logger'" "$file" && \
       ! grep -q "import.*logger.*from.*'\.\.\/\.\.\/config/logger'" "$file"; then

        # Count how many ../ we need based on file depth
        local depth=$(echo "$file" | grep -o "/" | wc -l)
        local backend_depth=$(echo "$BACKEND_DIR" | grep -o "/" | wc -l)
        local relative_depth=$((depth - backend_depth - 1))

        local logger_path="../config/logger"
        if [ $relative_depth -eq 2 ]; then
            logger_path="../../config/logger"
        elif [ $relative_depth -eq 3 ]; then
            logger_path="../../../config/logger"
        fi

        # Add import after the last import statement
        sed -i "/^import /a import logger from '$logger_path'" "$file"
        echo "Added logger import to $file"
    fi
}

# Function to replace console statements
replace_console() {
    local file="$1"

    # Replace console.error with logger.error
    sed -i 's/console\.error(/logger.error(/g' "$file"

    # Replace console.warn with logger.warn
    sed -i 's/console\.warn(/logger.warn(/g' "$file"

    # Replace console.info with logger.info
    sed -i 's/console\.info(/logger.info(/g' "$file"

    # Replace console.debug with logger.debug
    sed -i 's/console\.debug(/logger.debug(/g' "$file"

    # Replace console.log with logger.info (most common case)
    sed -i 's/console\.log(/logger.info(/g' "$file"

    echo "Replaced console statements in $file"
}

# Process all TypeScript files
find "$BACKEND_DIR" -type f -name "*.ts" -not -path "*/node_modules/*" | while read -r file; do
    if grep -q "console\.\(log\|error\|warn\|info\|debug\)" "$file"; then
        echo "Processing: $file"
        add_logger_import "$file"
        replace_console "$file"
    fi
done

echo "Console statement replacement complete!"
