# Saintara - Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Cloud PostgreSQL database (Neon, Supabase, or Railway)

## Step 1: Set Up Cloud Database

### Option A: Neon (Recommended - Free tier available)

1. Go to https://neon.tech
2. Sign up/Login with GitHub
3. Create a new project: `saintara-db`
4. Get your connection string from the dashboard
5. Run the schema and seed:
   ```bash
   # Install psql client if needed
   # Replace CONNECTION_STRING with your Neon connection string
   psql "CONNECTION_STRING" -f backend/database/schema.sql
   psql "CONNECTION_STRING" -f backend/database/seed.sql
   ```

### Option B: Supabase (Free tier available)

1. Go to https://supabase.com
2. Create new project: `saintara`
3. Go to Project Settings > Database
4. Copy the connection string (Connection pooling mode)
5. Go to SQL Editor and run:
   - Copy/paste contents of `backend/database/schema.sql` → Run
   - Copy/paste contents of `backend/database/seed.sql` → Run

### Option C: Railway (Paid after trial)

1. Go to https://railway.app
2. New Project > Provision PostgreSQL
3. Get connection URL from Variables tab
4. Connect and run SQL files

## Step 2: Deploy Backend to Vercel

### 2.1 Push to GitHub
```bash
cd Saintara
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2.2 Import to Vercel

1. Go to https://vercel.com/new
2. Import your `Saintara` repository
3. **IMPORTANT:** Configure as follows:
   - **Root Directory:** `backend`
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 2.3 Set Environment Variables

Click "Environment Variables" and add:

```
NODE_ENV=production
PORT=5000

# Database (from Neon/Supabase)
DB_HOST=your-db-host.neon.tech
DB_PORT=5432
DB_NAME=saintara
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# CORS (will update after frontend deployment)
CORS_ORIGIN=http://localhost:3000
```

### 2.4 Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://saintara-backend.vercel.app`)

### 2.5 Test Backend

```bash
curl https://your-backend-url.vercel.app/health
# Should return: {"status":"success",...}
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Import to Vercel

1. Go to https://vercel.com/new
2. Import the SAME `Saintara` repository again
3. **IMPORTANT:** Configure as follows:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
   - **Build Command:** Leave default
   - **Output Directory:** Leave default
   - **Install Command:** `npm install`

### 3.2 Set Environment Variables

Click "Environment Variables" and add:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app/api
```

Replace `your-backend-url` with your actual backend URL from Step 2.4

### 3.3 Deploy

1. Click "Deploy"
2. Wait for deployment
3. Copy your frontend URL (e.g., `https://saintara.vercel.app`)

## Step 4: Update Backend CORS

1. Go to Vercel Dashboard → Your Backend Project
2. Go to Settings → Environment Variables
3. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```
4. Go to Deployments tab
5. Click "..." on latest deployment → Redeploy

## Step 5: Verify Deployment

1. **Frontend:** Visit `https://your-frontend-url.vercel.app`
   - Should see Saintara landing page

2. **Login Test:**
   - Go to `/login`
   - Email: `admin@saintara.com`
   - Password: `admin123`
   - Should successfully login and redirect

3. **API Test:**
   ```bash
   curl https://your-backend-url.vercel.app/api/tests/questions
   # Should return 10 questions
   ```

## Custom Domain (Optional)

### For Frontend:
1. Go to Vercel Dashboard → Frontend Project → Settings → Domains
2. Add your domain (e.g., `saintara.com`)
3. Update DNS records as instructed

### For Backend:
1. Go to Vercel Dashboard → Backend Project → Settings → Domains
2. Add subdomain (e.g., `api.saintara.com`)
3. Update DNS records
4. Update frontend env: `NEXT_PUBLIC_API_URL=https://api.saintara.com/api`
5. Update backend CORS: `CORS_ORIGIN=https://saintara.com`

## Environment Variables Summary

### Backend (.env)
```env
NODE_ENV=production
PORT=5000

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=saintara
DB_USER=your-user
DB_PASSWORD=your-password

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app/api
```

## Troubleshooting

### Issue: "Database connection failed"
- Check database credentials in Vercel backend environment variables
- Ensure database is accessible from external connections
- Verify connection string format

### Issue: "CORS error" on frontend
- Ensure `CORS_ORIGIN` in backend matches frontend URL exactly
- Redeploy backend after changing CORS_ORIGIN
- Check browser console for exact CORS error

### Issue: "Cannot read properties of undefined"
- Clear frontend build cache
- Redeploy frontend
- Ensure Next.js version is 14.2.33 in package.json

### Issue: API calls return 404
- Verify `NEXT_PUBLIC_API_URL` includes `/api` suffix
- Check backend deployment logs in Vercel
- Test backend health endpoint directly

### Issue: "Module not found" during build
- Ensure all dependencies are in package.json
- Check Vercel build logs
- Try local build: `npm run build`

## Monitoring

### View Logs:
1. Vercel Dashboard → Your Project
2. Click on deployment
3. View Runtime Logs or Build Logs

### Database Monitoring:
- Neon: Dashboard → Monitoring
- Supabase: Dashboard → Database → Logs

## Costs

### Free Tier Limits:
- **Vercel:** 100GB bandwidth/month, unlimited deployments
- **Neon:** 3GB storage, 1 project
- **Supabase:** 500MB database, 2GB bandwidth

### Scaling:
- Vercel Pro: $20/month (more bandwidth, better performance)
- Neon Scale: $19/month (more storage, better performance)
- Supabase Pro: $25/month (more database resources)

## Security Checklist

- [ ] Change admin password from default `admin123`
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable SSL/HTTPS (automatic with Vercel)
- [ ] Set secure CORS_ORIGIN (no wildcards)
- [ ] Keep database credentials secure
- [ ] Enable database SSL connections
- [ ] Set up database connection pooling

## Next Steps

1. Change admin password
2. Set up monitoring/alerts
3. Configure custom domain
4. Set up automated backups for database
5. Add more test questions
6. Customize character types

## Support

- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- Supabase Docs: https://supabase.com/docs

## Production URLs

After deployment, update these in your documentation:

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-api.vercel.app`
- Database: `your-db.neon.tech` or `your-project.supabase.co`
