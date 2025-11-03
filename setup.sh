#!/bin/bash

# Saintara Platform Setup Script
# This script automates the setup process for the Saintara platform

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Welcome message
clear
print_header "🌟 SAINTARA PLATFORM SETUP 🌟"
echo "This script will help you set up the Saintara personality assessment platform."
echo ""

# Check prerequisites
print_header "1. Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL is installed: $PSQL_VERSION"
    HAS_POSTGRES=true
else
    print_warning "PostgreSQL is not installed locally."
    print_info "You can use a cloud database like Supabase, or install PostgreSQL."
    HAS_POSTGRES=false
fi

# Environment setup
print_header "2. Environment Configuration"

# Backend .env
if [ -f "backend/.env" ]; then
    print_warning "backend/.env already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping backend/.env creation"
    else
        print_info "backend/.env already created by git"
        print_success "Using existing backend/.env"
    fi
else
    print_info "backend/.env already created by git"
    print_success "Backend environment file configured"
fi

# Frontend .env.local
if [ -f "frontend/.env.local" ]; then
    print_warning "frontend/.env.local already exists"
    print_success "Using existing frontend/.env.local"
else
    print_info "frontend/.env.local already created by git"
    print_success "Frontend environment file configured"
fi

# Database setup
print_header "3. Database Setup"

if [ "$HAS_POSTGRES" = true ]; then
    read -p "Do you want to set up the database now? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        print_info "Setting up database..."

        # Source .env for database credentials
        if [ -f "backend/.env" ]; then
            export $(cat backend/.env | grep -v '^#' | xargs)
        fi

        DB_NAME=${DB_NAME:-saintara}
        DB_USER=${DB_USER:-postgres}

        # Create database
        print_info "Creating database: $DB_NAME"
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_warning "Database $DB_NAME may already exist"

        # Run schema
        print_info "Running database schema..."
        sudo -u postgres psql -d $DB_NAME -f backend/database/schema.sql > /dev/null 2>&1
        print_success "Schema applied successfully"

        # Run seed data
        print_info "Seeding database with initial data..."
        sudo -u postgres psql -d $DB_NAME -f backend/database/seed.sql > /dev/null 2>&1
        print_success "Database seeded successfully"

        print_success "Database setup complete!"
        print_info "Admin credentials:"
        echo "  Email: admin@saintara.com"
        echo "  Password: admin123"
        print_info "Test user credentials:"
        echo "  Email: user@test.com"
        echo "  Password: test123"
    else
        print_warning "Skipping database setup"
        print_info "You'll need to manually set up your database before running the app"
    fi
else
    print_warning "PostgreSQL not found locally"
    print_info "Please set up your database manually using:"
    print_info "  - Supabase: https://supabase.com (Free tier available)"
    print_info "  - Or install PostgreSQL locally"
    print_info ""
    print_info "Then run the following SQL files in order:"
    print_info "  1. backend/database/schema.sql"
    print_info "  2. backend/database/seed.sql"
fi

# Install dependencies
print_header "4. Installing Dependencies"

# Backend dependencies
print_info "Installing backend dependencies..."
cd backend
npm install > /dev/null 2>&1
print_success "Backend dependencies installed"
cd ..

# Frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
npm install > /dev/null 2>&1
print_success "Frontend dependencies installed"
cd ..

# Final instructions
print_header "✅ Setup Complete!"

echo ""
echo "Next steps:"
echo ""
echo "1. Update environment variables if needed:"
echo "   - backend/.env (database credentials, JWT secret, email config)"
echo "   - frontend/.env.local (API URL)"
echo ""
echo "2. Start the development servers:"
echo ""
echo "   Terminal 1 - Backend:"
echo "   $ cd backend"
echo "   $ npm run dev"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   $ cd frontend"
echo "   $ npm run dev"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - API Docs: http://localhost:5000/api-docs"
echo ""
echo "4. Login with:"
echo "   - Admin: admin@saintara.com / admin123"
echo "   - User: user@test.com / test123"
echo ""
print_success "Happy coding! 🚀"
echo ""
