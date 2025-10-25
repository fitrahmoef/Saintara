# Saintara - Easy PostgreSQL with Neon (5 Minutes Setup!)

**Neon** is the easiest way to run PostgreSQL in the cloud. No server management, just paste connection string and go!

## Why Neon?

✅ **Free Tier:** 3GB storage, 1 project, unlimited queries
✅ **Serverless:** No server to manage
✅ **Instant Setup:** Ready in seconds
✅ **Perfect for Vercel:** Built for serverless deployments
✅ **Auto-scaling:** Scales automatically
✅ **No Credit Card Required:** For free tier

## Step 1: Create Neon Database (2 minutes)

1. **Go to:** https://neon.tech
2. **Sign in** with GitHub (one click!)
3. **Create Project:**
   - Project name: `saintara`
   - PostgreSQL version: 16 (default)
   - Region: Choose closest to you (e.g., AWS Singapore)
   - Click **Create Project**
4. **Done!** Your database is ready instantly ✅

## Step 2: Get Connection String (30 seconds)

After project creation, you'll see the dashboard:

1. Look for **Connection Details** panel
2. Make sure **Pooled connection** is selected (important for Vercel!)
3. Copy the connection string - it looks like:
   ```
   postgresql://neondb_owner:xxxxx@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this!** You'll need it in the next steps

### Extract Connection Details (for Vercel):

From the connection string, extract:
```
postgresql://neondb_owner:AbCdEf123@ep-cool-bird-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
```

- `DB_HOST` = `ep-cool-bird-12345.us-east-2.aws.neon.tech`
- `DB_PORT` = `5432`
- `DB_NAME` = `neondb`
- `DB_USER` = `neondb_owner`
- `DB_PASSWORD` = `AbCdEf123`

## Step 3: Setup Database Schema (1 minute)

### Option A: Using psql (Easiest on Mac/Linux)

```bash
# Copy the connection string from Neon dashboard
psql "postgresql://neondb_owner:xxxxx@ep-xxxx.aws.neon.tech/neondb?sslmode=require" \
  -f backend/database/schema.sql

psql "postgresql://neondb_owner:xxxxx@ep-xxxx.aws.neon.tech/neondb?sslmode=require" \
  -f backend/database/seed.sql
```

### Option B: Using Neon SQL Editor (Works on Windows too!)

1. In Neon Dashboard, click **SQL Editor** in left sidebar
2. Copy content from `backend/database/schema.sql`
3. Paste and click **Run** → Wait for success
4. Copy content from `backend/database/seed.sql`
5. Paste and click **Run** → Done!

### Option C: Using our Setup Script (Copy-paste ready!)

1. In Neon Dashboard, click **SQL Editor**
2. Copy content from `backend/database/supabase-setup.sql` (works for Neon too!)
3. Paste and click **Run**
4. Done! ✅

## Step 4: Configure Your Backend (1 minute)

### For Local Development:

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# Neon PostgreSQL (copy from your Neon dashboard)
DB_HOST=ep-cool-bird-12345.us-east-2.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=your-neon-password-here

JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

### Test Connection:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server is running on port 5000
```

## Step 5: Deploy to Vercel (5 minutes)

### Deploy Backend:

1. **Go to:** https://vercel.com/new
2. **Import** your `Saintara` repository
3. **Configure:**
   - Root Directory: `backend`
   - Framework: Other

4. **Add Environment Variables** (click "+ Add more"):
   ```
   NODE_ENV=production
   DB_HOST=ep-cool-bird-12345.us-east-2.aws.neon.tech
   DB_PORT=5432
   DB_NAME=neondb
   DB_USER=neondb_owner
   DB_PASSWORD=your-neon-password
   JWT_SECRET=your-production-secret-min-32-chars
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Click Deploy** ✅

6. **Copy your backend URL** (e.g., `https://saintara-backend.vercel.app`)

### Deploy Frontend:

1. **Go to:** https://vercel.com/new
2. **Import** same repository again
3. **Configure:**
   - Root Directory: `frontend`
   - Framework: Next.js

4. **Add Environment Variable:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app/api
   ```

5. **Click Deploy** ✅

6. **Copy your frontend URL**

### Update Backend CORS:

1. Go to Vercel → Backend Project → Settings → Environment Variables
2. Edit `CORS_ORIGIN` → Change to your frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```
3. Go to Deployments → Click "..." on latest → **Redeploy**

## That's It! 🎉

Your app is now live with Neon PostgreSQL!

- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-api.vercel.app
- **Database:** Neon (managed automatically)

## Verify Everything Works

### 1. Test Backend Health:
```bash
curl https://your-backend-url.vercel.app/health
# Should return: {"status":"success"...}
```

### 2. Test Database:
```bash
curl https://your-backend-url.vercel.app/api/tests/questions
# Should return 10 questions
```

### 3. Test Login:
- Go to: https://your-frontend-url.vercel.app/login
- Email: `admin@saintara.com`
- Password: `admin123`
- Should login successfully! ✅

## Neon Dashboard Features

### View Your Data:
1. Go to Neon Dashboard → Tables
2. Browse your data visually
3. Run SQL queries in SQL Editor

### Monitor Usage:
1. Dashboard → Project Settings → Usage
2. See storage, compute time, data transfer
3. Free tier limits are generous!

### Database Branches (Cool Feature!):
- Neon lets you create database branches (like git!)
- Perfect for testing without affecting production
- Free tier includes 1 branch

## Common Issues & Quick Fixes

### Issue: "SSL required"
**Already handled!** Our database config includes SSL support automatically.

### Issue: "Connection timeout"
**Solution:** Make sure you're using the **pooled connection** string from Neon (not direct connection).

### Issue: "Too many connections"
**Solution:** Our config already includes connection pooling. Neon handles this automatically!

## Neon vs Others

| Feature | Neon | Supabase | Railway | Local |
|---------|------|----------|---------|-------|
| Setup Time | 2 min | 5 min | 3 min | 20 min |
| Free Tier | 3GB | 500MB | Trial only | Unlimited |
| Management | Zero | Low | Low | High |
| Vercel Ready | Perfect | Good | Good | No |
| Serverless | Yes | Yes | No | No |

## Pro Tips

### 1. Connection String Security:
- Never commit `.env` files
- Use Vercel environment variables
- Rotate passwords periodically

### 2. Monitoring:
- Check Neon dashboard for slow queries
- Monitor storage usage
- Set up alerts in Neon (Pro plan)

### 3. Backups:
- Neon auto-backs up daily (7 day retention)
- Pro plan: Point-in-time recovery
- Export important data regularly

### 4. Performance:
- Neon auto-scales compute
- Uses connection pooling automatically
- No manual optimization needed!

## Upgrade When Needed

### Free Tier Limits:
- **Storage:** 3GB
- **Compute:** 100 hours/month active time
- **Branches:** 1 development branch

### Pro Plan ($19/month):
- **Storage:** 200GB
- **Compute:** Unlimited
- **Branches:** Unlimited
- **Point-in-time recovery**
- **Better performance**

Most small projects stay on free tier for months!

## Database Management Commands

### View all tables:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Check row counts:
```sql
SELECT
  'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'character_types', COUNT(*) FROM character_types
UNION ALL
SELECT 'test_questions', COUNT(*) FROM test_questions;
```

### Change admin password:
```bash
# On your backend, generate hash:
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword', 10).then(h => console.log(h));"

# In Neon SQL Editor:
UPDATE users
SET password = '$2a$10$your-new-hash-here'
WHERE email = 'admin@saintara.com';
```

## Quick Reference

### Local Development:
```bash
cd backend && npm run dev    # Backend on :5000
cd frontend && npm run dev   # Frontend on :3000
```

### Deploy Updates:
```bash
git add .
git commit -m "Your changes"
git push
# Vercel auto-deploys!
```

### View Logs:
- Vercel Dashboard → Your Project → Runtime Logs
- Neon Dashboard → Monitoring → Query Stats

## Need Help?

- **Neon Docs:** https://neon.tech/docs
- **Neon Discord:** https://discord.gg/neon
- **Status Page:** https://neon.tech/status

## Migration from Other Databases

### From Supabase:
1. Export data from Supabase SQL Editor
2. Import to Neon SQL Editor
3. Update connection strings
4. Redeploy

### From Local PostgreSQL:
```bash
pg_dump your_local_db > backup.sql
psql "neon-connection-string" < backup.sql
```

---

## Summary: Why Neon is Perfect

✅ **Instant setup** - Database ready in 2 minutes
✅ **Zero management** - No servers, no config
✅ **Generous free tier** - Perfect for starting
✅ **Serverless-first** - Built for Vercel
✅ **Auto-scaling** - Handles traffic spikes
✅ **Developer-friendly** - SQL Editor, branches, monitoring

**Total setup time: 5-10 minutes from nothing to production!** 🚀

Start here: https://neon.tech
