# Implementasi Form Biodata Lengkap

## ✅ Fitur yang Telah Diimplementasikan

### 1. Database Schema
Kolom baru ditambahkan ke tabel `users`:
- ✓ `nickname` - Nama panggilan (VARCHAR 100)
- ✓ `gender` - Jenis kelamin: Laki-laki/Perempuan (VARCHAR 20)
- ✓ `blood_type` - Golongan darah: A, B, AB, O (dengan +/-) (VARCHAR 5)
- ✓ `country` - Negara (VARCHAR 100)
- ✓ `city` - Kota (VARCHAR 100)

### 2. Backend API
**Endpoint yang diupdate:**
- `GET /api/auth/profile` - Return semua biodata fields
- `PUT /api/auth/profile` - Update biodata dengan validasi

**Validasi:**
- Gender: hanya menerima "Laki-laki" atau "Perempuan"
- Blood Type: validasi 12 tipe golongan darah (A, A+, A-, B, B+, B-, AB, AB+, AB-, O, O+, O-)

### 3. Frontend Form
**Form fields yang tersedia:**
- ✓ Nama Lengkap (text input)
- ✓ Nama Panggilan (text input)
- ✓ Email (read-only, auto-filled)
- ✓ Nomor Telepon (text input)
- ✓ Jenis Kelamin (dropdown: Laki-laki/Perempuan)
- ✓ Golongan Darah (dropdown: 12 opsi)
- ✓ Negara (text input)
- ✓ Kota (text input)
- ✓ Member Since (read-only, auto-filled)

**Fitur:**
- Auto-fill: Data otomatis terisi dari database
- Edit mode: Klik "Edit Profile" untuk enable editing
- Validation: Client-side dan server-side validation
- Responsive: Grid layout untuk desktop dan mobile

---

## 🚀 Cara Setup dan Testing

### Langkah 1: Apply Database Migration

**Jika menggunakan database lokal:**
```bash
# Masuk ke PostgreSQL
psql -U postgres -d saintara

# Jalankan migration
\i backend/database/migrations/add_biodata_fields.sql

# Verify columns
\d users
```

**Jika menggunakan Supabase:**
```bash
# Copy isi file migration dan jalankan di Supabase SQL Editor
cat backend/database/migrations/add_biodata_fields.sql
```

### Langkah 2: Setup Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env dengan database credentials Anda
```

**Frontend (.env.local):**
```bash
cd frontend
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL jika perlu
```

### Langkah 3: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Langkah 4: Run Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server berjalan di http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend berjalan di http://localhost:3000
```

---

## 🧪 Testing Manual

### 1. Test Registrasi & Login
```bash
# Registrasi user baru
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Test Get Profile (dengan biodata)
```bash
# Ganti YOUR_TOKEN dengan token dari login
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Update Biodata
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "nickname": "Johnny",
    "phone": "+628123456789",
    "gender": "Laki-laki",
    "blood_type": "O+",
    "country": "Indonesia",
    "city": "Jakarta"
  }'
```

### 4. Test via Browser
1. Buka http://localhost:3000
2. Login atau registrasi
3. Klik menu "Profile"
4. Klik tombol "Edit Profile"
5. Isi semua biodata fields
6. Klik "Save Changes"
7. Refresh halaman untuk verify auto-fill

---

## 📋 Checklist Testing Lengkap

### Database
- [ ] Migration berhasil dijalankan
- [ ] Kolom baru ada di tabel users
- [ ] Constraints (gender, blood_type) berfungsi
- [ ] Indexes dibuat untuk country, city, gender

### Backend API
- [ ] GET /api/auth/profile return biodata fields
- [ ] PUT /api/auth/profile bisa update biodata
- [ ] Validasi gender berfungsi (hanya Laki-laki/Perempuan)
- [ ] Validasi blood_type berfungsi (12 tipe valid)
- [ ] Error handling untuk invalid data

### Frontend
- [ ] Form biodata tampil dengan benar
- [ ] Auto-fill data dari database
- [ ] Dropdown gender berfungsi
- [ ] Dropdown golongan darah berfungsi (12 opsi)
- [ ] Edit mode enable/disable fields
- [ ] Save changes update database
- [ ] Cancel button reset form
- [ ] Responsive di mobile dan desktop

### Integration
- [ ] Data persist setelah save
- [ ] Data muncul setelah refresh page
- [ ] TypeScript types updated
- [ ] No console errors

---

## 🎯 Test Data Sample

Gunakan data berikut untuk testing:

```json
{
  "name": "Fitrah Muhammad",
  "nickname": "Fitrah",
  "phone": "+628123456789",
  "email": "fitrah@example.com",
  "gender": "Laki-laki",
  "blood_type": "O+",
  "country": "Indonesia",
  "city": "Jakarta"
}
```

---

## 🔍 Troubleshooting

### Error: Column does not exist
**Solution:** Jalankan migration database
```bash
psql -U postgres -d saintara -f backend/database/migrations/add_biodata_fields.sql
```

### Error: Invalid gender
**Solution:** Pastikan value adalah "Laki-laki" atau "Perempuan" (case-sensitive)

### Error: TypeScript type error
**Solution:** Restart TypeScript server
```bash
# Di VSCode: Ctrl+Shift+P > TypeScript: Restart TS Server
```

### Form tidak save
**Solution:** Check browser console dan network tab untuk error message

---

## 📁 File yang Dimodifikasi

### Backend
1. `backend/database/schema.sql` - Added biodata columns
2. `backend/database/migrations/add_biodata_fields.sql` - New migration file
3. `backend/src/controllers/auth.controller.ts` - Updated getProfile & updateProfile

### Frontend
1. `frontend/contexts/AuthContext.tsx` - Updated User interface & added setUser
2. `frontend/app/dashboard/profile/page.tsx` - Complete biodata form

---

## ✨ Fitur Auto-fill

Data otomatis terisi karena:
1. **useEffect** hook load data dari `user` object saat component mount
2. **AuthContext** menyimpan user data di state dan localStorage
3. **getProfile** API dipanggil saat login untuk fetch latest data
4. **Form state** di-sync dengan user context

---

## 🎨 UI/UX Features

- **Grid Layout**: Gender & Blood Type side-by-side
- **Grid Layout**: Country & City side-by-side
- **Placeholders**: Helpful examples di setiap field
- **Disabled State**: Read-only fields (email, member since)
- **Loading State**: Button shows "Saving..." saat update
- **Edit Mode**: Toggle edit/view mode
- **Responsive**: Mobile-friendly dengan Tailwind CSS

---

## 📝 Notes

- Semua field biodata bersifat **optional** kecuali name dan email
- Gender dan blood_type punya database constraints
- Data di-validate di backend sebelum disimpan
- Frontend auto-fill dari localStorage dan API
- Indexes ditambahkan untuk performa search by country/city/gender

---

**Status:** ✅ Ready for Testing
**Last Updated:** 2025-11-03
