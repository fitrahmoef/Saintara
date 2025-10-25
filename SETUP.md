# Saintara - Setup Instructions

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker)

## Database Setup

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Set postgres user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Create database
sudo -u postgres psql -c "CREATE DATABASE saintara;"

# Run schema
cat backend/database/schema.sql | sudo -u postgres psql -d saintara

# Run seed data
cat backend/database/seed.sql | sudo -u postgres psql -d saintara
```

### Option 2: Docker PostgreSQL
```bash
docker run --name saintara-postgres \
  -e POSTGRES_DB=saintara \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16

# Wait for container to start
sleep 5

# Run schema
docker exec -i saintara-postgres psql -U postgres -d saintara < backend/database/schema.sql

# Run seed data
docker exec -i saintara-postgres psql -U postgres -d saintara < backend/database/seed.sql
```

## Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (if not exists)
cp .env.example .env

# Edit .env with your database credentials
# Default values:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=saintara
# DB_USER=postgres
# DB_PASSWORD=postgres

# Build TypeScript
npm run build

# Start development server
npm run dev
```

Backend will run on: http://localhost:5000

## Frontend Setup

```bash
cd frontend

# IMPORTANT: Clean installation to avoid version conflicts
rm -rf node_modules .next package-lock.json
npm cache clean --force

# Install dependencies with exact versions
npm install

# Start development server
npm run dev
```

Frontend will run on: http://localhost:3000

## Common Issues & Fixes

### Issue: Next.js version mismatch error
**Error:** `Cannot read properties of undefined (reading 'createClientModuleProxy')`

**Fix:**
```bash
cd frontend
rm -rf node_modules .next package-lock.json
npm cache clean --force
npm install
```

### Issue: Multiple lockfiles detected
**Fix:** Delete extra package-lock.json files in parent directories

### Issue: TypeScript errors
**Fix:**
```bash
cd backend
npm run build
# Fix any reported errors
```

### Issue: Database connection error
**Fix:** Verify PostgreSQL is running and credentials in backend/.env match your database

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d saintara -c "SELECT 1;"
```

## Default Credentials

### Admin User
- Email: `admin@saintara.com`
- Password: `admin123`

## Project Structure

```
Saintara/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth & validation
│   │   └── config/        # Database config
│   ├── database/
│   │   ├── schema.sql     # Database schema
│   │   └── seed.sql       # Initial data
│   └── .env              # Environment variables
│
└── frontend/
    ├── app/              # Next.js pages
    ├── components/       # React components
    ├── contexts/         # React contexts (Auth)
    └── lib/             # API client

```

## Testing the Setup

1. **Test Backend:**
   ```bash
   curl http://localhost:5000/health
   # Should return: {"status":"success",...}
   ```

2. **Test Database:**
   ```bash
   curl http://localhost:5000/api/tests/questions
   # Should return 10 test questions
   ```

3. **Test Frontend:**
   - Open http://localhost:3000
   - Should see Saintara landing page

4. **Test Login:**
   - Go to http://localhost:3000/login
   - Login with admin@saintara.com / admin123
   - Should redirect to admin dashboard

## Development

### Backend Development
```bash
cd backend
npm run dev  # Auto-reloads on file changes
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot reload enabled
```

## Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- GET `/api/auth/profile` - Get user profile

### Tests
- GET `/api/tests/questions` - Get test questions
- GET `/api/tests/my-tests` - Get user's tests
- POST `/api/tests` - Create new test
- POST `/api/tests/:id/submit` - Submit test answers

### Results
- GET `/api/results` - Get all user results
- GET `/api/results/latest` - Get latest result
- GET `/api/results/:id` - Get specific result

### Admin (requires admin role)
- GET `/api/admin/dashboard` - Dashboard statistics
- GET `/api/admin/users` - Get all users
- GET `/api/admin/users/:id` - Get user details

## Support

For issues, please check:
1. PostgreSQL is running
2. Node.js version is 18+
3. All dependencies are installed
4. Environment variables are set correctly
5. Ports 3000 and 5000 are not in use

## License

Private - Saintara Platform
