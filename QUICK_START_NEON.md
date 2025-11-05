# 🚀 Quick Start: Neon Database Setup

Panduan cepat untuk setup project Saintara dengan Neon Database dalam 5 menit!

---

## ⚡ Prerequisites

- Node.js 18+ installed
- Git installed
- Text editor (VS Code recommended)

---

## 📝 Step-by-Step Setup

### 1️⃣ Clone & Install (2 menit)

```bash
# Clone repository
git clone <repository-url>
cd Saintara

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2️⃣ Setup Neon Database (2 menit)

#### A. Buat Neon Account & Database

1. Buka [https://console.neon.tech](https://console.neon.tech)
2. Sign up (gratis, tidak perlu credit card)
3. Klik **"New Project"**
4. Isi:
   - Name: `saintara`
   - Region: `AWS Asia Pacific (Singapore)` atau terdekat
   - PostgreSQL: `15` atau `16`
5. Klik **"Create Project"**

#### B. Copy Connection String

Setelah project dibuat, copy connection string yang muncul:

```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 3️⃣ Configure Backend (1 menit)

```bash
# Masih di folder backend
cd backend

# Copy .env.example ke .env
cp .env.example .env

# Edit .env (gunakan text editor favorit)
# Paste connection string dari Neon
```

Edit file `.env`:

```env
PORT=5000
NODE_ENV=development

# Paste connection string Anda di sini
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=your_super_secret_key_change_in_production_12345
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

### 4️⃣ Test & Initialize Database (30 detik)

```bash
# Test koneksi database
npm run db:test

# Jika berhasil, initialize database
npm run db:init
```

Output yang diharapkan:

```
✅ Database connected successfully
📚 Created tables:
   1. users
   2. character_types
   3. tests
   ... (dan lainnya)

🎉 Database initialization completed successfully!
```

### 5️⃣ Run Backend (10 detik)

```bash
# Start development server
npm run dev
```

Output:

```
📊 Configuring Neon Database connection...
✅ Database connected successfully
🚀 Server is running on port 5000
```

Test: Buka [http://localhost:5000/health](http://localhost:5000/health)

### 6️⃣ Setup & Run Frontend (30 detik)

Buka terminal baru:

```bash
cd frontend

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Run development server
npm run dev
```

Output:

```
✓ Ready in 2.3s
○ Local: http://localhost:3000
```

---

## 🎉 Done!

Aplikasi sudah berjalan:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔍 Verification Checklist

- ✅ Backend running tanpa error
- ✅ Frontend loading dengan baik
- ✅ Database tables sudah dibuat (15+ tables)
- ✅ Health endpoint returns 200 OK

---

## ❓ Troubleshooting

### Backend tidak connect ke database?

```bash
# Re-test koneksi
npm run db:test

# Cek .env file
cat .env | grep DATABASE_URL
```

### Port already in use?

```bash
# Backend (5000)
lsof -ti:5000 | xargs kill -9

# Frontend (3000)
lsof -ti:3000 | xargs kill -9
```

### Module not found errors?

```bash
# Re-install dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. ✅ Baca [NEON_DATABASE_SETUP.md](./NEON_DATABASE_SETUP.md) untuk detail lengkap
2. ✅ Explore API endpoints di [README.md](./README.md)
3. ✅ Test authentication & registration
4. ✅ Deploy ke production

---

## 🆘 Need Help?

- Database issues: Cek [NEON_DATABASE_SETUP.md](./NEON_DATABASE_SETUP.md)
- General setup: Cek [README.md](./README.md)
- Neon docs: [https://neon.tech/docs](https://neon.tech/docs)

---

**Total Setup Time**: ~5 menit ⚡

**Happy Coding! 🚀**
