# Neon Database Setup Guide

Panduan lengkap untuk setup Neon Database untuk project Saintara.

## 📋 Daftar Isi

1. [Tentang Neon Database](#tentang-neon-database)
2. [Cara Setup Neon Database](#cara-setup-neon-database)
3. [Konfigurasi Backend](#konfigurasi-backend)
4. [Testing Koneksi](#testing-koneksi)
5. [Inisialisasi Database](#inisialisasi-database)
6. [Troubleshooting](#troubleshooting)

---

## 🌟 Tentang Neon Database

**Neon** adalah serverless PostgreSQL database yang:
- ✅ Gratis untuk development (Free tier tersedia)
- ✅ Auto-scaling dan serverless
- ✅ Instant database creation
- ✅ Built-in branching (seperti Git untuk database)
- ✅ Kompatibel 100% dengan PostgreSQL
- ✅ Support untuk production deployment

### Keuntungan Menggunakan Neon:

1. **Gratis untuk Start**: Free tier dengan 10 GB storage
2. **Mudah Setup**: Tidak perlu install PostgreSQL lokal
3. **Production Ready**: Langsung bisa deploy ke production
4. **Auto Backup**: Built-in backup otomatis
5. **Fast Connection**: Optimized untuk serverless functions

---

## 🚀 Cara Setup Neon Database

### Step 1: Buat Account Neon

1. Kunjungi [https://console.neon.tech](https://console.neon.tech)
2. Sign up menggunakan GitHub, Google, atau email
3. Gratis dan tidak perlu credit card untuk free tier

### Step 2: Buat Project Baru

1. Setelah login, klik **"New Project"**
2. Isi detail project:
   - **Project Name**: `saintara` (atau nama lain)
   - **Region**: Pilih region terdekat (misal: AWS Asia Pacific Singapore)
   - **PostgreSQL Version**: 15 atau 16 (recommended)
3. Klik **"Create Project"**

### Step 3: Dapatkan Connection String

Setelah project dibuat, Anda akan melihat connection string:

```
postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/saintara?sslmode=require
```

**PENTING**: Simpan connection string ini dengan aman!

### Step 4: Setup Database (Optional)

Di Neon Console, Anda bisa:
- Create multiple databases
- Setup branches (untuk testing)
- Monitor query performance
- View logs dan metrics

---

## ⚙️ Konfigurasi Backend

### Step 1: Install Dependencies

Dependencies sudah terinstall, tapi jika perlu:

```bash
cd backend
npm install
```

Package yang digunakan:
- `@neondatabase/serverless` - Neon client
- `pg` - PostgreSQL driver

### Step 2: Setup Environment Variables

1. Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

2. Edit file `.env` dan tambahkan connection string dari Neon:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration - Neon
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/saintara?sslmode=require

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**⚠️ CATATAN PENTING:**
- Ganti `DATABASE_URL` dengan connection string Anda yang sebenarnya
- Jangan commit file `.env` ke Git (sudah ada di `.gitignore`)
- Untuk production, gunakan environment variables yang secure

### Step 3: Struktur Database Configuration

Backend sudah dikonfigurasi untuk support **dual mode**:

1. **Mode Neon** (jika `DATABASE_URL` ada):
   - Menggunakan connection string
   - SSL enabled otomatis
   - Optimized untuk serverless

2. **Mode Traditional** (jika `DATABASE_URL` tidak ada):
   - Menggunakan `DB_HOST`, `DB_PORT`, `DB_NAME`, dll
   - Untuk local PostgreSQL development

File konfigurasi ada di: `backend/src/config/database.ts`

---

## 🧪 Testing Koneksi

### Cara 1: Menggunakan Script Test

Kami sudah menyediakan script untuk test koneksi:

```bash
cd backend
npm run db:test
```

Output yang diharapkan:

```
🔍 Testing database connection...

📊 Connection Type: Neon Database (Serverless PostgreSQL)
🌐 Host: ep-xxx-xxx.region.aws.neon.tech
🗄️  Database: saintara

✅ Database connection test successful: 2024-01-15T10:30:00.000Z

📌 PostgreSQL Version:
PostgreSQL 15.3 on x86_64-pc-linux-gnu

💾 Database Size: 8192 bytes
📋 Number of Tables: 0

✅ Database connection test completed successfully!
🎉 Your database is ready to use!
```

### Cara 2: Manual Test dengan psql

Jika Anda punya `psql` installed:

```bash
psql "postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/saintara?sslmode=require"
```

---

## 🗄️ Inisialisasi Database

Setelah koneksi berhasil, setup schema dan tables:

### Cara 1: Menggunakan Script Init (Recommended)

```bash
cd backend
npm run db:init
```

Script ini akan:
1. ✅ Membaca file `database/schema.sql`
2. ✅ Membuat semua tables yang dibutuhkan
3. ✅ Menjalankan seed data (jika ada)
4. ✅ Verifikasi tables yang sudah dibuat

### Cara 2: Manual menggunakan psql

```bash
# Run schema
psql "$DATABASE_URL" -f database/schema.sql

# Run seed data
psql "$DATABASE_URL" -f database/seed.sql
```

### Tables yang Akan Dibuat

Setelah init, database Anda akan memiliki tables:

1. **users** - User accounts dan profiles
2. **character_types** - 9 tipe karakter personality
3. **tests** - Test records
4. **test_questions** - Question bank
5. **test_answers** - User answers
6. **test_results** - Test results dan analysis
7. **transactions** - Payment transactions
8. **vouchers** - Discount vouchers
9. **agents** - Agent/affiliate system
10. **agent_commissions** - Commission tracking
11. **events** - Seminar/event management
12. **event_registrations** - Event participants
13. **approvals** - Approval workflow
14. **articles** - Content management

---

## ▶️ Menjalankan Backend

Setelah database setup, jalankan backend:

```bash
cd backend
npm run dev
```

Output yang diharapkan:

```
📊 Configuring Neon Database connection...
✅ Database connected successfully
🚀 Server is running on port 5000
```

Buka browser: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔧 Troubleshooting

### Problem 1: Connection Refused / Timeout

**Penyebab:**
- Connection string salah
- Network/firewall blocking
- Neon database suspended (free tier inactive 7 hari)

**Solusi:**
```bash
# 1. Cek connection string di .env
cat backend/.env | grep DATABASE_URL

# 2. Test koneksi
npm run db:test

# 3. Cek status Neon di console
# Visit: https://console.neon.tech
```

### Problem 2: SSL Connection Error

**Error:**
```
Error: self signed certificate in certificate chain
```

**Solusi:**

Pastikan connection string ada `?sslmode=require`:
```
DATABASE_URL=postgresql://...?sslmode=require
```

### Problem 3: Authentication Failed

**Error:**
```
Error: password authentication failed
```

**Solusi:**
1. Cek username dan password di connection string
2. Reset password di Neon Console
3. Generate connection string baru

### Problem 4: Database Not Found

**Error:**
```
Error: database "saintara" does not exist
```

**Solusi:**
```bash
# Buat database baru di Neon Console, atau
# Ubah nama database di connection string sesuai yang ada di Neon
```

### Problem 5: Too Many Connections

**Error:**
```
Error: too many clients already
```

**Solusi:**
- Neon free tier limit: 100 concurrent connections
- Pastikan connection pool configured dengan baik
- Check `backend/src/config/database.ts` - `max: 20` sudah set

---

## 🌐 Environment Variables Reference

### Required (Neon Mode)

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
PORT=5000
JWT_SECRET=your_secret
CORS_ORIGIN=http://localhost:3000
```

### Optional

```env
NODE_ENV=development
JWT_EXPIRES_IN=7d
```

---

## 📚 Useful Commands

```bash
# Test database connection
npm run db:test

# Initialize database schema
npm run db:init

# Run backend development server
npm run dev

# Build backend for production
npm run build

# Start production server
npm start
```

---

## 🔐 Security Best Practices

1. **Jangan commit `.env` file**
   ```bash
   # Already in .gitignore
   backend/.env
   ```

2. **Use environment variables untuk production**
   - Vercel: Settings → Environment Variables
   - Railway: Variables tab
   - Heroku: Config Vars

3. **Rotate JWT secrets regularly**

4. **Use different databases untuk dev/staging/production**
   - Neon support branching for this!

---

## 📖 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Driver](https://node-postgres.com/)

---

## 💡 Tips & Tricks

### 1. Database Branching (Pro Feature)

Neon support Git-like branching:
```bash
# Create branch untuk testing
neonctl branches create --name staging

# Get connection string untuk branch
neonctl connection-string staging
```

### 2. Monitor Performance

Di Neon Console, lihat:
- Query performance
- Connection count
- Storage usage
- Slow queries

### 3. Backup & Restore

Backup otomatis di Neon, tapi bisa manual:

```bash
# Backup
pg_dump "$DATABASE_URL" > backup.sql

# Restore
psql "$DATABASE_URL" < backup.sql
```

---

## 🎯 Next Steps

Setelah database setup:

1. ✅ Setup frontend connection
2. ✅ Test authentication endpoints
3. ✅ Deploy ke production
4. ✅ Setup monitoring & logging

---

## 🤝 Support

Jika ada masalah:

1. Check error message carefully
2. Run `npm run db:test` untuk diagnose
3. Check Neon Console untuk status
4. Lihat logs di backend console

---

**Happy Coding! 🚀**

Built with ❤️ for Saintara Team
