# Setup Autentikasi Saintara - Panduan Lengkap

Panduan ini akan membantu Anda mengatur sistem login dan registrasi untuk platform Saintara.

## 🎯 Fitur yang Sudah Tersedia

### Backend (Express.js + PostgreSQL)
✅ **Sistem Autentikasi Lengkap:**
- ✅ Registrasi user dengan validasi email dan password
- ✅ Login dengan email dan password
- ✅ Password hashing menggunakan bcryptjs (12 rounds)
- ✅ JWT authentication dengan access & refresh tokens
- ✅ HttpOnly cookies untuk keamanan maksimal
- ✅ CSRF protection
- ✅ Account lockout setelah 5 failed login attempts
- ✅ Email verification (opsional)
- ✅ Password reset via email
- ✅ Rate limiting untuk mencegah brute force
- ✅ Session management
- ✅ Role-based access control (user, admin, superadmin, dll)

### Frontend (Next.js + React)
✅ **UI/UX Lengkap:**
- ✅ Halaman Login (`/login`)
- ✅ Halaman Register (`/register`)
- ✅ Halaman Forgot Password (`/forgot-password`)
- ✅ AuthContext untuk state management
- ✅ Protected routes dengan middleware
- ✅ Form validation menggunakan React Hook Form + Zod
- ✅ Input sanitization untuk XSS protection
- ✅ Responsive design dengan Tailwind CSS

## 📋 Prasyarat

Sebelum memulai, pastikan Anda sudah menginstall:

1. **Node.js** (v18 atau lebih baru)
   ```bash
   node --version  # Harus v18+
   ```

2. **PostgreSQL** (v14 atau lebih baru)
   ```bash
   # macOS (dengan Homebrew)
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql

   # Windows
   # Download dari: https://www.postgresql.org/download/windows/
   ```

3. **Git**
   ```bash
   git --version
   ```

## 🚀 Langkah-Langkah Setup

### 1. Setup Database PostgreSQL

#### Opsi A: Database Lokal (Untuk Development)

```bash
# 1. Masuk ke PostgreSQL
psql -U postgres

# 2. Buat database baru
CREATE DATABASE saintara;

# 3. Buat user (opsional, bisa pakai postgres user)
CREATE USER saintara_user WITH PASSWORD 'saintara123';

# 4. Berikan akses ke database
GRANT ALL PRIVILEGES ON DATABASE saintara TO saintara_user;

# 5. Keluar dari psql
\q
```

#### Opsi B: Neon Database (Untuk Production/Cloud)

1. Buka [Neon Console](https://console.neon.tech)
2. Buat project baru bernama "Saintara"
3. Copy connection string yang diberikan
4. Paste ke `.env` file (lihat langkah 2)

### 2. Konfigurasi Environment Variables

File `.env` sudah dibuat di `backend/.env` dan `frontend/.env.local`.

#### Backend (`backend/.env`)

**Untuk database lokal**, edit file dan pastikan konfigurasi ini:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saintara
DB_USER=postgres
DB_PASSWORD=postgres  # Ganti dengan password PostgreSQL Anda
```

**Untuk Neon Database**, uncomment dan isi:
```env
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/saintara?sslmode=require
```

**Penting:** Ganti JWT_SECRET dengan string random yang kuat:
```env
JWT_SECRET=your_very_long_random_secret_key_min_32_characters
```

#### Frontend (`frontend/.env.local`)

Sudah dikonfigurasi dengan default:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Setup Database Schema

Jalankan script SQL untuk membuat tabel-tabel yang diperlukan:

```bash
cd backend

# Jalankan schema dasar
psql -U postgres -d saintara -f database/schema.sql

# Jalankan migrations
psql -U postgres -d saintara -f database/migrations/add_password_reset_tokens.sql
psql -U postgres -d saintara -f database/migrations/002_add_email_verification.sql
psql -U postgres -d saintara -f database/migrations/add_biodata_fields.sql
psql -U postgres -d saintara -f migrations/006_add_institution_hierarchy.sql
psql -U postgres -d saintara -f migrations/011_add_refresh_tokens_and_csrf.sql
```

**Atau gunakan script otomatis:**
```bash
cd backend
npm run db:init
```

### 5. Test Database Connection

```bash
cd backend
npm run db:test
```

Jika berhasil, Anda akan melihat:
```
✅ Database connected successfully!
```

### 6. Jalankan Backend Server

```bash
cd backend
npm run dev
```

Server akan berjalan di `http://localhost:5000`

Test API health:
```bash
curl http://localhost:5000/api/health
```

### 7. Jalankan Frontend

Buka terminal baru:

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## 🧪 Testing Authentication

### Test 1: Registrasi User Baru

1. Buka browser ke `http://localhost:3000/register`
2. Isi form registrasi:
   - Nama: John Doe
   - Email: john@example.com
   - Password: Test123!@#Strong
   - Konfirmasi Password: Test123!@#Strong
3. Centang "Setuju dengan Syarat & Ketentuan"
4. Klik "Daftar Sekarang"
5. Anda akan di-redirect ke `/dashboard`

### Test 2: Login dengan User yang Sudah Ada

1. Logout (jika sudah login)
2. Buka `http://localhost:3000/login`
3. Masukkan email dan password
4. Klik "Masuk"
5. Anda akan di-redirect ke dashboard

### Test 3: Test API Langsung (Opsional)

**Registrasi via API:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!@#",
    "name": "Test User"
  }'
```

**Login via API:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!@#"
  }'
```

## 📊 Struktur Database

### Tabel `users`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| email | VARCHAR(255) | Email (unique) |
| password | VARCHAR(255) | Hashed password |
| name | VARCHAR(255) | Full name |
| role | VARCHAR(50) | user/admin/superadmin |
| email_verified | BOOLEAN | Email verification status |
| login_attempts | INTEGER | Failed login counter |
| locked_until | TIMESTAMP | Account lockout timestamp |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

### Tabel `refresh_tokens`

Menyimpan refresh tokens untuk session management.

### Tabel `password_reset_tokens`

Menyimpan tokens untuk password reset.

### Tabel `email_verification_tokens`

Menyimpan tokens untuk email verification.

## 🔒 Fitur Keamanan

1. **Password Requirements:**
   - Minimum 12 karakter
   - Harus mengandung huruf kecil
   - Harus mengandung huruf besar
   - Harus mengandung angka
   - Harus mengandung special character (@$!%*?&#)

2. **Account Lockout:**
   - Maksimal 5 failed login attempts
   - Lockout selama 15 menit

3. **Token Security:**
   - Access token: 15 menit (httpOnly cookie)
   - Refresh token: 7 hari (httpOnly cookie)
   - CSRF token untuk form protection

4. **XSS & SQL Injection Protection:**
   - Input sanitization
   - Parameterized queries
   - DOMPurify untuk HTML sanitization

## 🐛 Troubleshooting

### Error: "Database connection failed"

**Solusi:**
1. Pastikan PostgreSQL running:
   ```bash
   # macOS
   brew services list

   # Linux
   sudo systemctl status postgresql
   ```

2. Test koneksi manual:
   ```bash
   psql -U postgres -d saintara
   ```

3. Periksa kredensial di `.env`

### Error: "Port 5000 already in use"

**Solusi:**
```bash
# Cari process yang menggunakan port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Atau ubah PORT di .env
PORT=5001
```

### Error: "CORS policy blocked"

**Solusi:**
Pastikan `CORS_ORIGIN` di backend `.env` sesuai dengan frontend URL:
```env
CORS_ORIGIN=http://localhost:3000
```

### Error: "Invalid token" setelah login

**Solusi:**
1. Clear browser cookies
2. Restart backend server
3. Pastikan JWT_SECRET konsisten di `.env`

## 📝 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/profile` | Get user profile (protected) |
| PUT | `/api/auth/profile` | Update user profile (protected) |
| PUT | `/api/auth/change-password` | Change password (protected) |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/verify-email` | Verify email with token |
| POST | `/api/auth/resend-verification` | Resend verification email |

## 🎓 Next Steps

Setelah sistem autentikasi berjalan, Anda bisa:

1. **Kustomisasi Role & Permissions:**
   - Edit `backend/src/middleware/auth.middleware.ts`
   - Tambah role baru di database migrations

2. **Setup Email Service:**
   - Konfigurasi SMTP di `.env`
   - Test email verification & password reset

3. **Deploy ke Production:**
   - Setup Neon Database
   - Deploy backend ke Railway/Render
   - Deploy frontend ke Vercel
   - Update environment variables

4. **Tambah Social Login:**
   - Google OAuth
   - Facebook Login
   - Apple Sign In

## 💡 Tips

1. **Development:**
   - Set `REQUIRE_EMAIL_VERIFICATION=false` untuk testing
   - Set `LOG_LEVEL=debug` untuk debugging

2. **Production:**
   - Gunakan strong JWT_SECRET (32+ characters)
   - Enable email verification
   - Setup Redis untuk caching
   - Enable Sentry untuk error tracking

## 📞 Support

Jika mengalami masalah, periksa:
1. Logs di terminal backend
2. Browser console untuk frontend errors
3. PostgreSQL logs: `tail -f /usr/local/var/log/postgresql@14.log`

---

**Dibuat dengan ❤️ untuk Saintara Platform**
