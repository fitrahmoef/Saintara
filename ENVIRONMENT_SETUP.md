# Environment Setup Guide

## 🚨 IMPORTANT: Environment Files Required

The `.env` files are **NOT** included in the git repository for security reasons. You must create them manually or use the automated setup script.

---

## 🎯 Quick Setup (Recommended)

Run the automated setup script:

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Check prerequisites
- Create environment files (if needed)
- Set up database
- Install dependencies
- Provide next steps

---

## 📝 Manual Environment File Creation

### Backend Environment File

Create `backend/.env`:

```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` with your values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saintara
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_MIN_32_CHARS_LONG
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Email Configuration (Optional for basic testing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=Saintara <noreply@saintara.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Frontend Environment File

Create `frontend/.env.local`:

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

Or create manually:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🔐 Security Notes

### JWT Secret
Generate a strong JWT secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Or manually create a 32+ character random string
```

### Email Configuration
For development, you can leave email fields empty. The password reset feature will log tokens to console instead.

For production, use:
- Gmail with App Password
- SendGrid
- Mailgun
- AWS SES
- Or any SMTP provider

---

## 🗄️ Database Setup

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql -c "CREATE DATABASE saintara;"

# Run migrations
sudo -u postgres psql -d saintara -f backend/database/schema.sql
sudo -u postgres psql -d saintara -f backend/database/seed.sql
```

### Option 2: Supabase (Cloud - Free Tier)

1. Sign up at https://supabase.com
2. Create a new project
3. Get connection details from Settings → Database
4. Update `backend/.env`:
   ```env
   DB_HOST=db.xxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=YOUR_SUPABASE_PASSWORD
   ```
5. Run SQL in Supabase SQL Editor:
   - Copy & paste `backend/database/schema.sql`
   - Copy & paste `backend/database/seed.sql`

---

## ✅ Verification

### 1. Check Backend Environment

```bash
cd backend
node -e "require('dotenv').config(); console.log('✓ DB_HOST:', process.env.DB_HOST); console.log('✓ JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing')"
```

### 2. Check Frontend Environment

```bash
cd frontend
cat .env.local
```

### 3. Test Database Connection

```bash
cd backend
npm run dev
```

Look for:
```
✓ Database connected
✓ Server running on port 5000
```

### 4. Test Frontend

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'dotenv'"

```bash
cd backend
npm install
```

### Error: "Connection refused (database)"

- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database exists: `sudo -u postgres psql -c "\l"`
- Check credentials in `backend/.env`

### Error: "JWT_SECRET is required"

- Make sure `JWT_SECRET` is set in `backend/.env`
- Must be at least 32 characters long

### Error: "CORS error" in browser console

- Check `CORS_ORIGIN` in `backend/.env` matches frontend URL
- Default should be: `http://localhost:3000`

### Frontend shows "Network Error"

- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Verify backend is running on the correct port
- Default should be: `http://localhost:5000/api`

---

## 📚 Next Steps

After creating environment files:

1. **Install Dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Run Database Migrations:**
   ```bash
   # See Database Setup section above
   ```

3. **Start Development:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

4. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

5. **Login:**
   - Admin: admin@saintara.com / admin123
   - User: user@test.com / test123

---

## 🔗 Related Documentation

- **Complete Setup:** `SETUP_FIXES.md`
- **Quick Start:** `QUICKSTART.md`
- **Deployment:** `DEPLOYMENT.md`
- **Features:** `IMPROVEMENTS.md`

---

**Note:** Never commit `.env` or `.env.local` files to git. They contain sensitive credentials and are listed in `.gitignore`.
