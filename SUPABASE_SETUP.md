# Saintara - Supabase Database Setup

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in with GitHub
3. Click "New Project"
4. Fill in details:
   - **Name:** `saintara`
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to your users (e.g., Singapore)
5. Click "Create new project"
6. Wait ~2 minutes for project to be ready

## Step 2: Run Database Schema

### Option A: Using SQL Editor (Easiest)

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire content from `backend/database/schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned"

### Option B: Using CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

## Step 3: Seed Initial Data

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `backend/database/seed.sql`
4. Paste it into the SQL Editor
5. Click **Run**
6. You should see "Success. No rows returned"

## Step 4: Verify Data

### Check Tables Created:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see all tables:
   - users
   - character_types
   - tests
   - test_questions
   - test_results
   - transactions
   - vouchers
   - agents
   - agent_sales
   - events
   - event_registrations
   - approvals

### Check Seed Data:

1. Click on **character_types** table
2. You should see 9 character types (Pemikir Introvert, etc.)
3. Click on **test_questions** table
4. You should see 10 questions
5. Click on **users** table
6. You should see 1 admin user

## Step 5: Get Connection Details

### For Vercel Deployment:

1. In Supabase Dashboard, go to **Project Settings** (gear icon)
2. Click **Database** in the left menu
3. Scroll to **Connection String** section
4. Choose **Connection Pooling** tab (IMPORTANT: Use pooling for Vercel!)
5. Copy the connection string, it looks like:
   ```
   postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
   ```

### Extract Connection Details:

From the connection string above, extract:
- **DB_HOST:** `aws-0-region.pooler.supabase.com`
- **DB_PORT:** `6543` (note: pooler uses 6543, not 5432)
- **DB_NAME:** `postgres`
- **DB_USER:** `postgres.xxxxx` (everything before the colon)
- **DB_PASSWORD:** The password you set when creating the project

## Step 6: Configure Environment Variables

### For Local Development:

Edit `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Database - Connection Pooling
DB_HOST=aws-0-region.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.xxxxxxxxxxxxx
DB_PASSWORD=your-database-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### For Vercel Deployment:

When deploying backend to Vercel, add these environment variables:

```env
NODE_ENV=production
PORT=5000

# Supabase Database - Connection Pooling (IMPORTANT!)
DB_HOST=aws-0-region.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.xxxxxxxxxxxxx
DB_PASSWORD=your-database-password

# JWT Configuration
JWT_SECRET=generate-a-strong-random-secret-key-32-chars-min
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

## Step 7: Test Connection

### Test Locally:

```bash
cd backend

# Make sure .env is configured with Supabase credentials
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:5000/health
# Should return: {"status":"success"...}
```

### Test Database Queries:

```bash
# Test getting questions
curl http://localhost:5000/api/tests/questions
# Should return 10 questions

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@saintara.com","password":"admin123"}'
# Should return user data and token
```

## Common Issues & Solutions

### Issue: "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string"

**Cause:** Database password is incorrect or not set

**Solution:**
1. Go to Supabase Dashboard → Settings → Database
2. Reset database password
3. Update password in `.env` file
4. Restart server

### Issue: "connection timeout"

**Cause:** Using direct connection instead of connection pooling

**Solution:**
1. Use the **Connection Pooling** string (port 6543), NOT the direct connection (port 5432)
2. In Supabase Dashboard → Settings → Database → Connection String → **Connection Pooling** tab

### Issue: "SSL connection required"

**Solution:** Add SSL config to `backend/src/config/database.ts`:
```typescript
ssl: {
  rejectUnauthorized: false
}
```

### Issue: "too many connections"

**Cause:** Exceeding Supabase free tier connection limit

**Solution:**
- Use connection pooling (port 6543)
- Configure connection pool size in database config
- Upgrade to Pro plan if needed

## Supabase Dashboard Quick Links

After setup, bookmark these:

- **SQL Editor:** Run queries and migrations
- **Table Editor:** View and edit data
- **Database:** Connection settings and statistics
- **Logs:** Monitor database queries
- **Database Webhooks:** Set up triggers (optional)

## Database Management

### View Admin User:
1. Table Editor → users
2. Find: admin@saintara.com

### Change Admin Password:
1. SQL Editor → New Query
2. Run:
```sql
-- Generate new hash on your backend first:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword', 10).then(h => console.log(h));"

UPDATE users
SET password = '$2a$10$your-new-hashed-password-here'
WHERE email = 'admin@saintara.com';
```

### Add More Test Questions:
1. SQL Editor → New Query
2. Run:
```sql
INSERT INTO test_questions (question_text, category, question_order)
VALUES
  ('Your question here', 'Category', 11),
  ('Another question', 'Category', 12);
```

### View All Character Types:
```sql
SELECT id, name, code, description FROM character_types;
```

### Check User Count:
```sql
SELECT COUNT(*) FROM users;
```

## Monitoring & Maintenance

### Free Tier Limits:
- **Database Size:** 500 MB
- **Bandwidth:** 2 GB
- **API Requests:** 500,000/month
- **Authentication:** 50,000 active users

### Monitor Usage:
1. Supabase Dashboard → Settings → Usage
2. Check database size, API requests, bandwidth

### Backup Database:
1. Supabase Dashboard → Database → Backups
2. Free tier: Daily backups (7 day retention)
3. Pro tier: Point-in-time recovery

### Database Performance:
1. Go to Reports → Database Performance
2. Monitor slow queries
3. Add indexes if needed

## Next Steps

1. ✅ Database created and configured
2. ✅ Schema and seed data loaded
3. ✅ Connection tested locally
4. → Deploy backend to Vercel with Supabase credentials
5. → Deploy frontend to Vercel
6. → Update CORS settings
7. → Test production deployment

## Security Best Practices

- ✅ Use connection pooling (port 6543) for Vercel
- ✅ Never commit .env file with real credentials
- ✅ Use Row Level Security (RLS) policies (optional, for advanced users)
- ✅ Enable SSL connections
- ✅ Change default admin password
- ✅ Rotate JWT secret regularly
- ✅ Monitor database logs for suspicious activity

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **Connection Issues:** https://supabase.com/docs/guides/database/connecting-to-postgres

## Connection String Examples

### Connection Pooling (Use for Vercel):
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres
```

### Direct Connection (Use for local dev):
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Session Mode (Alternative):
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres?pgbouncer=true
```

**For Vercel/Production:** Always use **Connection Pooling** mode!

Ready to deploy! 🚀
