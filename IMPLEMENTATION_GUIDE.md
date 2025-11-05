# IMPLEMENTATION GUIDE - ADMIN INSTANSI DAN BULK UPLOAD

## 📋 Ringkasan Implementasi

Sistem admin instansi dengan fitur bulk upload customer telah **berhasil diimplementasikan** dengan lengkap. Dokumen ini menjelaskan apa yang sudah dibuat, cara menjalankannya, dan langkah testing.

---

## ✅ Apa yang Sudah Diimplementasikan

### 1. **Database Schema** ✓
- **File**: `backend/migrations/006_add_institution_hierarchy.sql`
- **Isi**:
  - Tabel `institutions` untuk data institusi/organisasi
  - Tabel `permissions` untuk sistem permission granular
  - Tabel `role_permissions` untuk mapping role ke permission
  - Tabel `user_permissions` untuk custom permission per user
  - Tabel `customer_tags` untuk segmentasi customer
  - Tabel `customer_tag_assignments` untuk assign tags ke customer
  - Tabel `bulk_import_logs` untuk tracking bulk import
  - View `institution_statistics` untuk analytics
  - View `admin_hierarchy` untuk visualisasi hierarki admin
  - Modifikasi tabel `users` dengan field `institution_id` dan `managed_by_admin_id`
  - Update roles menjadi: `superadmin`, `institution_admin`, `admin`, `agent`, `user`
  - Seed 37 default permissions

### 2. **Backend API** ✓

#### A. TypeScript Types
- **File**: `backend/src/types/institution.types.ts`
- **Isi**: Semua interface dan type untuk:
  - Institution
  - Permission & Role
  - Customer Tags
  - Bulk Import
  - Admin Hierarchy
  - Analytics

#### B. Permission Utilities
- **File**: `backend/src/utils/permission.utils.ts`
- **Functions**:
  - `checkUserPermission()` - Cek permission user
  - `getUserPermissions()` - Get semua permission user
  - `canAccessInstitution()` - Cek akses ke institusi
  - `canManageCustomer()` - Cek akses manage customer
  - `buildAuthContext()` - Build context dengan permissions

#### C. Auth Middleware (Updated)
- **File**: `backend/src/middleware/auth.middleware.ts`
- **New Middleware**:
  - `requirePermission()` - Middleware untuk cek permission
  - `requireInstitutionAccess()` - Middleware untuk cek akses institusi
  - `requireAdmin()` - Middleware untuk admin-level
  - `requireSuperAdmin()` - Middleware khusus superadmin
- **Updated**: JWT payload sekarang include `institution_id` dan `permissions`

#### D. Institution Controller
- **File**: `backend/src/controllers/institution.controller.ts`
- **Endpoints**:
  - `POST /api/institutions` - Create institution (superadmin only)
  - `GET /api/institutions` - List institutions dengan pagination
  - `GET /api/institutions/:id` - Detail institution
  - `PUT /api/institutions/:id` - Update institution
  - `DELETE /api/institutions/:id` - Soft delete institution
  - `GET /api/institutions/:id/statistics` - Statistics dari view
  - `GET /api/institutions/:id/analytics` - Analytics lengkap
  - `POST /api/institutions/:id/admins` - Assign admin ke institution
  - `GET /api/institutions/:id/admins` - List admins
  - `DELETE /api/institutions/:id/admins/:adminId` - Remove admin

#### E. Customer Controller
- **File**: `backend/src/controllers/customer.controller.ts`
- **Endpoints**:
  - `GET /api/customers` - List customers dengan filter (institution, tag, status, search)
  - `GET /api/customers/:id` - Detail customer
  - `POST /api/customers` - Create single customer
  - `PUT /api/customers/:id` - Update customer
  - `DELETE /api/customers/:id` - Soft delete customer
  - `GET /api/customers/bulk/template` - Download Excel template
  - `POST /api/customers/bulk/import` - Bulk import dari Excel/CSV
  - `GET /api/customers/bulk/history` - History bulk import

#### F. File Upload Configuration
- **File**: `backend/src/config/multer.config.ts`
- **Features**:
  - Accept `.xls`, `.xlsx`, `.csv`
  - Max file size 5MB
  - Unique filename generation
  - File validation

#### G. Routes
- **Files**:
  - `backend/src/routes/institution.routes.ts`
  - `backend/src/routes/customer.routes.ts`
- **Integration**: Routes sudah di-register di `server.ts`

#### H. Auth Controller (Updated)
- **File**: `backend/src/controllers/auth.controller.ts`
- **Changes**: Login response sekarang include:
  - `institution_id`
  - `permissions` array
  - JWT token dengan data lengkap

### 3. **NPM Packages Installed** ✓
```json
{
  "multer": "^1.4.5-lts.1",      // File upload
  "xlsx": "^0.18.5",              // Excel parser
  "csv-parser": "^3.0.0",         // CSV parser
  "@types/multer": "latest",      // TypeScript types
  "exceljs": "^4.4.0"             // Excel generation
}
```

---

## 🚀 Cara Menjalankan Migration

### Option 1: Via psql (Recommended)
```bash
cd /home/user/Saintara/backend

# Jika menggunakan local PostgreSQL
psql -U postgres -d saintara -f migrations/006_add_institution_hierarchy.sql

# Jika menggunakan Neon
psql "postgresql://[user]:[password]@[host]/[database]?sslmode=require" -f migrations/006_add_institution_hierarchy.sql
```

### Option 2: Via Node.js Script
Create file `backend/scripts/run-migration.ts`:
```typescript
import pool from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../migrations/006_add_institution_hierarchy.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
```

Run dengan:
```bash
npx ts-node backend/scripts/run-migration.ts
```

### Option 3: Manual via Database Client
1. Copy isi file `backend/migrations/006_add_institution_hierarchy.sql`
2. Buka database client (pgAdmin, DBeaver, atau Neon Console)
3. Paste dan execute SQL

---

## 📝 Testing Workflow

### 1. Setup: Create Institution (Superadmin)
```bash
# Login as superadmin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saintara.com",
    "password": "admin123"
  }'

# Save token
TOKEN="<token-dari-response>"

# Create institution
curl -X POST http://localhost:5000/api/institutions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PT Contoh Indonesia",
    "code": "PTCI",
    "contact_email": "admin@contoh.co.id",
    "contact_phone": "021-12345678",
    "max_users": 500,
    "subscription_type": "premium"
  }'

# Save institution_id
INSTITUTION_ID="<id-dari-response>"
```

### 2. Assign Institution Admin
```bash
# Create user terlebih dahulu atau gunakan existing user
# Lalu assign sebagai institution admin

curl -X POST http://localhost:5000/api/institutions/$INSTITUTION_ID/admins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "role": "institution_admin"
  }'
```

### 3. Login as Institution Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-institusi@example.com",
    "password": "password123"
  }'

# Save new token
ADMIN_TOKEN="<token-dari-response>"
```

### 4. Download Template
```bash
curl -X GET http://localhost:5000/api/customers/bulk/template \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  --output customer_template.xlsx
```

### 5. Fill Template
Open `customer_template.xlsx` dan isi dengan data:
```
email               | name        | password    | phone       | gender | blood_type | country   | city
---------------------|-------------|-------------|-------------|--------|------------|-----------|--------
john@example.com    | John Doe    | password123 | 08123456789 | male   | O          | Indonesia | Jakarta
jane@example.com    | Jane Smith  | password123 | 08198765432 | female | A          | Indonesia | Bandung
```

### 6. Bulk Import Customers
```bash
curl -X POST http://localhost:5000/api/customers/bulk/import \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@customer_template.xlsx"
```

Response:
```json
{
  "status": "success",
  "data": {
    "total_rows": 2,
    "successful_rows": 2,
    "failed_rows": 0,
    "errors": [],
    "log_id": 1
  },
  "message": "Import completed: 2 successful, 0 failed"
}
```

### 7. View Imported Customers
```bash
curl -X GET "http://localhost:5000/api/customers?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 8. View Import History
```bash
curl -X GET "http://localhost:5000/api/customers/bulk/history" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 9. Get Institution Analytics
```bash
curl -X GET "http://localhost:5000/api/institutions/$INSTITUTION_ID/analytics" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🎨 Frontend Implementation (TODO)

Frontend UI belum diimplementasikan. Berikut endpoint yang perlu diintegrasikan:

### Pages yang Perlu Dibuat:

#### 1. **Superadmin Dashboard** (`/admin/institutions`)
- List semua institusi
- Create/Edit/Delete institusi
- View statistics per institusi

#### 2. **Superadmin - Assign Admin** (`/admin/institutions/:id/admins`)
- List users
- Assign user sebagai institution_admin
- Remove admin

#### 3. **Institution Admin Dashboard** (`/institution-admin/dashboard`)
- Analytics institusi sendiri
- Customer count, test completion, revenue
- Charts: customer growth, test distribution

#### 4. **Customer Management** (`/institution-admin/customers`)
- Table customers dengan filter:
  - Search by name/email
  - Filter by tag
  - Filter by status (active/inactive)
- Actions:
  - Create single customer
  - Edit customer
  - Delete customer (soft delete)
  - Bulk import

#### 5. **Bulk Import Page** (`/institution-admin/customers/import`)
- Download template button
- File upload area (drag & drop)
- Import history table
- Error display untuk failed rows

### Component Examples:

#### CustomerImportModal.tsx
```typescript
import { useState } from 'react';

export default function CustomerImportModal() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleDownloadTemplate = async () => {
    const response = await fetch('/api/customers/bulk/template', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_template.xlsx';
    a.click();
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/customers/bulk/import', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const result = await response.json();

    if (result.status === 'success') {
      alert(`Import berhasil: ${result.data.successful_rows} customers`);
      // Refresh customer list
    } else {
      alert('Import gagal');
    }

    setImporting(false);
  };

  return (
    <div className="modal">
      <h2>Import Customers</h2>

      <button onClick={handleDownloadTemplate}>
        Download Template
      </button>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleImport} disabled={!file || importing}>
        {importing ? 'Importing...' : 'Import'}
      </button>
    </div>
  );
}
```

---

## 🔐 Permission System

### Default Permissions Seeded:

#### Customer Management
- `customer.create` - Create customers
- `customer.read` - View customers
- `customer.update` - Edit customers
- `customer.delete` - Delete customers
- `customer.import` - Bulk import
- `customer.export` - Export data

#### Transaction Management
- `transaction.read`
- `transaction.create`
- `transaction.update`
- `transaction.approve`
- `transaction.refund`

#### Test Management
- `test.assign`
- `test.read`
- `test.results.read`
- `test.delete`

#### Reports
- `report.institution`
- `report.financial`
- `report.export`

#### Institution Management (Superadmin only)
- `institution.create`
- `institution.read`
- `institution.update`
- `institution.delete`
- `institution.assign_admin`

### Permission Scopes:
- `own` - Hanya data sendiri
- `institution` - Data satu institusi
- `all` - Semua data (superadmin)

---

## 📊 Database Views

### institution_statistics
```sql
SELECT * FROM institution_statistics;
```
Returns: institution metrics (customers, tests, revenue)

### admin_hierarchy
```sql
SELECT * FROM admin_hierarchy;
```
Returns: admin structure dengan managed customers count

---

## 🐛 Troubleshooting

### Error: "Permission denied: customer.import"
**Cause**: User tidak punya permission
**Solution**: Assign permission atau pastikan user adalah institution_admin

### Error: "Institution has reached maximum user limit"
**Cause**: Import melebihi max_users
**Solution**: Update `max_users` di institution settings

### Error: "Invalid file type"
**Cause**: File bukan Excel/CSV
**Solution**: Upload file `.xlsx`, `.xls`, atau `.csv`

### Error: "Email already exists"
**Cause**: Email sudah terdaftar di database
**Solution**: Cek dan hapus duplicate dari Excel

---

## 📈 Monitoring & Analytics

### Check Import Logs
```sql
SELECT * FROM bulk_import_logs
WHERE institution_id = 1
ORDER BY imported_at DESC;
```

### Check User Distribution
```sql
SELECT
  i.name,
  COUNT(u.id) as total_users,
  COUNT(u.id) FILTER (WHERE u.is_active = true) as active_users
FROM institutions i
LEFT JOIN users u ON u.institution_id = i.id AND u.role = 'user'
GROUP BY i.id, i.name;
```

### Check Permission Usage
```sql
SELECT
  p.code,
  p.name,
  COUNT(rp.id) as assigned_roles,
  COUNT(up.id) as assigned_users
FROM permissions p
LEFT JOIN role_permissions rp ON rp.permission_id = p.id
LEFT JOIN user_permissions up ON up.permission_id = p.id
GROUP BY p.id, p.code, p.name
ORDER BY p.code;
```

---

## ✅ Checklist Deployment

- [ ] Run migration: `006_add_institution_hierarchy.sql`
- [ ] Verify tables created: `institutions`, `permissions`, etc.
- [ ] Create first superadmin user (update role to 'superadmin')
- [ ] Test institution creation via API
- [ ] Test admin assignment
- [ ] Test customer bulk import
- [ ] Test permission system
- [ ] Create uploads directory: `mkdir backend/uploads`
- [ ] Set proper permissions on uploads: `chmod 755 backend/uploads`
- [ ] Update .env if needed
- [ ] Build frontend UI
- [ ] Test complete workflow
- [ ] Deploy to production

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check error logs di console
2. Check `bulk_import_logs` table untuk error details
3. Verify permissions dengan query di section Monitoring
4. Check file upload di `backend/uploads/` directory

---

## 🎉 Kesimpulan

Sistem admin instansi dengan bulk upload **sudah selesai 100% di backend**. Yang tersisa hanya:
1. Run database migration
2. Build frontend UI untuk consume API
3. Testing end-to-end workflow

Semua API sudah ready, tinggal integrasikan dengan UI! 🚀
