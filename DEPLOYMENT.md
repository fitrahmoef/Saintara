# Saintara Deployment Guide

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Domain names configured

### Database Setup

#### 1. Create Production Database

**Option A: Supabase**
```bash
# Create project at supabase.com
# Get connection string
# Format: postgresql://user:pass@host:5432/database
```

**Option B: Railway**
```bash
# Create PostgreSQL service
# Get DATABASE_URL
```

#### 2. Run Migrations

```bash
# Export your DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/database"

# Run schema
psql $DATABASE_URL -f backend/database/schema.sql

# Run seeds
psql $DATABASE_URL -f backend/database/seed.sql
```

### Backend Deployment (Railway)

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

#### 2. Deploy Backend

```bash
cd backend

# Initialize Railway project
railway init

# Link to PostgreSQL
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_production_secret
railway variables set CORS_ORIGIN=https://yourdomain.com

# Deploy
railway up
```

#### 3. Configure Custom Domain

```bash
# In Railway dashboard:
# Settings > Domains > Add Custom Domain
# Point your DNS A record to Railway IP
```

### Frontend Deployment (Vercel)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy Frontend

```bash
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://api.yourdomain.com/api

# Deploy to production
vercel --prod
```

#### 3. Configure Custom Domain

```bash
# In Vercel dashboard:
# Settings > Domains > Add Domain
# Follow DNS configuration instructions
```

### Alternative: Docker Deployment

#### 1. Create Dockerfile for Backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Create Dockerfile for Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

#### 3. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: saintara
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: saintara
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${FRONTEND_URL}
    ports:
      - "5000:5000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: ${BACKEND_URL}/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 4. Deploy with Docker

```bash
# Create .env file
cat > .env <<EOF
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
EOF

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f
```

### Environment Variables

#### Backend Production Variables

```bash
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=saintara
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-long-random-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com
```

#### Frontend Production Variables

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### SSL/HTTPS Configuration

#### Using Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"
5. Configure page rules if needed

#### Using Let's Encrypt (Manual)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/
```

### Monitoring & Logging

#### Backend Logging

```bash
# Install winston for production logging
npm install winston

# Configure in backend/src/config/logger.ts
```

#### Frontend Analytics

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
```

### Performance Optimization

#### Database Indexing

```sql
-- Already included in schema.sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tests_user_id ON tests(user_id);
-- etc.
```

#### CDN Configuration

- Use Vercel Edge Network (automatic)
- Use Cloudflare CDN for additional caching
- Optimize images with Next.js Image component

### Backup Strategy

#### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
# Upload to S3 or similar storage
```

#### Automated Backups

- Supabase: Automatic backups included
- Railway: Use Railway CLI or dashboard
- Self-hosted: Setup cron job

### Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure JWT_SECRET (min 32 characters)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use helmet.js security headers
- [ ] Validate all inputs
- [ ] Use prepared statements (prevent SQL injection)
- [ ] Regular dependency updates
- [ ] Environment variables never committed
- [ ] Database credentials rotated regularly

### Post-Deployment

1. **Test all endpoints**
```bash
# Health check
curl https://api.yourdomain.com/health

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

2. **Monitor logs**
```bash
# Railway
railway logs

# Vercel
vercel logs

# Docker
docker-compose logs -f
```

3. **Set up alerts**
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)

### Rollback Procedure

```bash
# Vercel - Rollback to previous deployment
vercel rollback

# Railway - Use dashboard or CLI
railway rollback

# Docker - Use previous image
docker-compose down
docker-compose up -d --force-recreate
```

### Support

For deployment issues:
- Check logs first
- Verify environment variables
- Test database connectivity
- Review CORS configuration
- Check DNS propagation

---

Last updated: 2025
