# Neon Database Setup Guide

This guide will help you migrate your Saintara backend from local PostgreSQL to Neon serverless PostgreSQL.

## 📋 Prerequisites

- A Neon account (free tier available at https://neon.tech)

## 🚀 Step 1: Create Neon Database

1. **Sign up/Login to Neon:**
   - Go to https://neon.tech
   - Sign up or login to your account

2. **Create a New Project:**
   - Click "New Project"
   - Choose a name: `saintara-db`
   - Select a region closest to your users
   - PostgreSQL version: 15+ recommended
   - Click "Create Project"

3. **Get Connection String:**
   - After project creation, copy the connection string
   - It will look like:
     ```
     postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

## 🔧 Step 2: Configure Backend Environment

1. **Update your `.env` file:**

   ```bash
   cd backend
   ```

2. **Add Neon connection string to `.env`:**

   ```env
   # Neon Database (use this for production/cloud)
   DATABASE_URL=postgresql://your-username:your-password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require

   # Keep these for local development (optional)
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=saintara
   DB_USER=postgres
   DB_PASSWORD=your_local_password

   # Other settings
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

   **Note:** The backend will automatically use `DATABASE_URL` if present, otherwise it falls back to individual DB parameters.

3. **Example `.env` file:**

   ```env
   # Neon Database Connection
   DATABASE_URL=postgresql://saintara_user:abc123xyz@ep-cool-cloud-123456.us-east-2.aws.neon.tech/saintara?sslmode=require

   PORT=5000
   NODE_ENV=production
   JWT_SECRET=super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

## 📦 Step 3: Run Database Migrations

### Option A: Using psql (Recommended)

1. **Install psql locally** (if not already installed):
   - **macOS:** `brew install postgresql`
   - **Ubuntu/Debian:** `sudo apt-get install postgresql-client`
   - **Windows:** Download from https://www.postgresql.org/download/windows/

2. **Connect to Neon and run migrations:**

   ```bash
   # Replace with your actual Neon connection string
   export DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

   # Run main schema
   psql $DATABASE_URL -f database/schema.sql

   # Run seed data
   psql $DATABASE_URL -f database/seed.sql

   # Run additional migrations
   psql $DATABASE_URL -f database/migrations/add_articles_table.sql
   psql $DATABASE_URL -f database/migrations/add_password_reset_tokens.sql
   ```

### Option B: Using Node.js Script

Create a migration runner script:

```bash
# From backend directory
node scripts/run-migrations.js
```

(See script below)

### Option C: Using Neon Console (SQL Editor)

1. Go to your Neon project dashboard
2. Click "SQL Editor"
3. Copy and paste the contents of each file:
   - `database/schema.sql`
   - `database/seed.sql`
   - `database/migrations/add_articles_table.sql`
   - `database/migrations/add_password_reset_tokens.sql`
4. Execute each script in order

## 🧪 Step 4: Test Connection

1. **Test the connection:**

   ```bash
   cd backend
   npm run dev
   ```

2. **You should see:**
   ```
   ✅ Database connected successfully
   🚀 Server is running on port 5000
   📝 Environment: development
   ```

3. **Test the health endpoint:**

   ```bash
   curl http://localhost:5000/health
   ```

   Expected response:
   ```json
   {
     "status": "success",
     "message": "Server is healthy",
     "timestamp": "2025-01-02T12:00:00.000Z"
   }
   ```

## 🔍 Step 5: Verify Database Tables

You can verify your tables are created using Neon Console:

1. Go to Neon Dashboard → Your Project → Tables
2. You should see these tables:
   - users
   - character_types
   - tests
   - test_questions
   - test_answers
   - test_results
   - transactions
   - vouchers
   - agents
   - agent_sales
   - events
   - event_registrations
   - approvals
   - articles
   - password_reset_tokens

## 🌐 Environment-Specific Configuration

### Development (Local PostgreSQL)
```env
# Don't set DATABASE_URL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saintara
DB_USER=postgres
DB_PASSWORD=your_password
```

### Production/Staging (Neon)
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

## 📊 Neon Features You Can Use

1. **Branching:** Create database branches for testing
2. **Auto-suspend:** Database auto-suspends when inactive (saves costs)
3. **Connection Pooling:** Built-in connection pooling
4. **Backups:** Automatic point-in-time recovery
5. **Monitoring:** Built-in query performance monitoring

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for Neon database
3. **Rotate JWT_SECRET** in production
4. **Use environment variables** in deployment platforms:
   - Vercel: Add in Project Settings → Environment Variables
   - Heroku: Use `heroku config:set DATABASE_URL=...`
   - Railway: Add in Variables section
   - Render: Add in Environment section

## 🚨 Troubleshooting

### Connection Timeout
- Check if your connection string is correct
- Ensure SSL is enabled (`?sslmode=require`)
- Verify your Neon project is active (not suspended)

### SSL Certificate Error
- Make sure `ssl: { rejectUnauthorized: false }` is in database config
- Verify connection string has `?sslmode=require`

### Tables Not Found
- Run migrations in the correct order
- Check Neon SQL Editor for error messages
- Verify you're connected to the correct database

### Migration Errors
- Ensure you ran `schema.sql` before `seed.sql`
- Check if tables already exist (drop them first if re-running)
- Look for syntax errors in migration files

## 📝 Next Steps

After setting up Neon:

1. ✅ Update frontend `NEXT_PUBLIC_API_URL` to point to your deployed backend
2. ✅ Deploy backend to a hosting platform (Vercel, Railway, Render, etc.)
3. ✅ Deploy frontend to Vercel/Netlify
4. ✅ Test all features end-to-end
5. ✅ Set up monitoring and logging

---

## 💡 Pro Tips

- **Free Tier Limits:** Neon free tier includes 0.5GB storage and shared compute
- **Connection String Security:** Use separate databases for dev/staging/prod
- **Backups:** Neon automatically backs up your data, but export important data periodically
- **Performance:** Use Neon's connection pooling for better performance under load

---

Need help? Check out:
- Neon Docs: https://neon.tech/docs
- Neon Discord: https://discord.gg/neon
