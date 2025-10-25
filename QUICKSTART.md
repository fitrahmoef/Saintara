# Quick Start Guide - Database Setup

## Option A: Cloud Database (Supabase - FREE)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project
4. Wait for database to be ready (2-3 minutes)

### Step 2: Get Connection String
1. Go to Project Settings > Database
2. Copy the connection string (URI format)
3. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### Step 3: Configure Backend
1. Create `.env` file in `/backend` directory:

```bash
cd /home/user/Saintara/backend
cp .env.example .env
```

2. Edit `.env` with Supabase credentials:
```env
PORT=5000
NODE_ENV=development

# Supabase Database
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password

# JWT
JWT_SECRET=your_random_secret_key_min_32_characters_long
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Step 4: Run Database Migrations
Using Supabase SQL Editor (in dashboard):
1. Open SQL Editor in Supabase dashboard
2. Copy content from `backend/database/schema.sql`
3. Paste and run in SQL Editor
4. Copy content from `backend/database/seed.sql`
5. Paste and run in SQL Editor

### Step 5: Start Backend
```bash
cd /home/user/Saintara/backend
npm run dev
```

---

## Option B: Local PostgreSQL

### For Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE saintara;"

# Create user (optional)
sudo -u postgres psql -c "CREATE USER saintara_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE saintara TO saintara_user;"
```

### Configure Backend
```bash
cd /home/user/Saintara/backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=saintara
DB_USER=postgres
DB_PASSWORD=your_local_password

JWT_SECRET=your_random_secret_key_min_32_characters_long
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

### Run Migrations
```bash
# Run schema
sudo -u postgres psql -d saintara -f /home/user/Saintara/backend/database/schema.sql

# Run seeds
sudo -u postgres psql -d saintara -f /home/user/Saintara/backend/database/seed.sql
```

### Start Backend
```bash
cd /home/user/Saintara/backend
npm run dev
```

---

## Verify Backend is Running

Once started, test with:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is healthy",
  "timestamp": "2025-10-25T..."
}
```
