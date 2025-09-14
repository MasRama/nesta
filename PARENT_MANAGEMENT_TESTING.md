# Testing Guide - Fitur Manajemen Wali Murid

## Overview
Dokumen ini berisi panduan testing untuk fitur manajemen wali murid yang baru diimplementasikan di sistem NETSA.

## Fitur yang Diimplementasikan

### 1. Database Layer
- ✅ Tabel `parents` untuk data wali murid
- ✅ Tabel `parent_students` untuk relasi wali murid dengan siswa
- ✅ Migrasi database berhasil dijalankan

### 2. Backend Layer
- ✅ `ParentService` - Business logic untuk CRUD operations
- ✅ `ParentController` - HTTP request handling
- ✅ Routes untuk semua CRUD operations dan API endpoints

### 3. Frontend Layer
- ✅ `index.svelte` - List parents dengan pagination dan search
- ✅ `create.svelte` - Form create dengan fitur search NIPD siswa
- ✅ `show.svelte` - Detail view wali murid dan daftar anak
- ✅ `edit.svelte` - Form edit dengan manajemen anak

### 4. Navigation
- ✅ Tab "Manajemen Wali Murid" di AdminNavigation
- ✅ Section di admin dashboard

## Testing Checklist

### A. Database Testing
- [ ] Verifikasi tabel `parents` terbuat dengan struktur yang benar
- [ ] Verifikasi tabel `parent_students` terbuat dengan foreign key constraints
- [ ] Test insert data sample ke kedua tabel
- [ ] Test relasi antara parents, students, dan parent_students

### B. Backend API Testing

#### 1. Parent CRUD Operations
- [ ] **GET /admin/parents** - List parents dengan pagination
- [ ] **GET /admin/parents/create** - Show create form
- [ ] **POST /admin/parents** - Create new parent
- [ ] **GET /admin/parents/:id** - Show parent detail
- [ ] **GET /admin/parents/:id/edit** - Show edit form
- [ ] **PUT /admin/parents/:id** - Update parent
- [ ] **DELETE /admin/parents/:id** - Delete parent

#### 2. Student Management API
- [ ] **GET /api/students/search-nipd** - Search student by NIPD
- [ ] **POST /admin/parents/:id/students** - Add student to parent
- [ ] **DELETE /admin/parents/:id/students/:studentId** - Remove student from parent

#### 3. Validation Testing
- [ ] Test required fields validation (nama, email, password)
- [ ] Test email format validation
- [ ] Test email uniqueness validation
- [ ] Test password minimum length validation
- [ ] Test NIPD validation untuk student search

### C. Frontend Testing

#### 1. Navigation Testing
- [ ] Tab "Manajemen Wali Murid" muncul di AdminNavigation
- [ ] Klik tab navigasi ke `/admin/parents`
- [ ] Section wali murid muncul di admin dashboard
- [ ] Button "Kelola Data Wali Murid" berfungsi

#### 2. Index Page Testing
- [ ] List parents ditampilkan dengan pagination
- [ ] Search functionality berfungsi
- [ ] Button "Tambah Wali Murid" navigasi ke create page
- [ ] Action buttons (Lihat, Edit, Hapus) berfungsi
- [ ] Pagination berfungsi dengan benar

#### 3. Create Page Testing
- [ ] Form validation berfungsi
- [ ] Search NIPD siswa berfungsi
- [ ] Preview siswa yang ditemukan ditampilkan
- [ ] Tambah multiple siswa berfungsi
- [ ] Dropdown hubungan (ayah, ibu, wali, lainnya) berfungsi
- [ ] Checkbox "Kontak utama" berfungsi
- [ ] Submit form berhasil create parent dan relasi

#### 4. Show Page Testing
- [ ] Detail wali murid ditampilkan lengkap
- [ ] Daftar anak ditampilkan dengan informasi lengkap
- [ ] Statistik (jumlah anak, kontak utama) akurat
- [ ] Button Edit dan Hapus berfungsi

#### 5. Edit Page Testing
- [ ] Form pre-filled dengan data existing
- [ ] Update informasi dasar berfungsi
- [ ] Password optional (kosong = tidak diubah)
- [ ] Tambah anak baru berfungsi
- [ ] Hapus anak existing berfungsi
- [ ] Real-time update daftar anak

### D. Error Handling Testing
- [ ] Error handling untuk email duplicate
- [ ] Error handling untuk NIPD tidak ditemukan
- [ ] Error handling untuk siswa sudah ditambahkan
- [ ] Error handling untuk network errors
- [ ] User-friendly error messages dalam bahasa Indonesia

### E. Security Testing
- [ ] Password di-hash dengan benar
- [ ] Input sanitization untuk mencegah XSS
- [ ] Authorization check untuk admin-only routes
- [ ] CSRF protection untuk form submissions

### F. Performance Testing
- [ ] Pagination performance dengan large dataset
- [ ] Search performance
- [ ] Loading states untuk async operations
- [ ] Responsive design di mobile devices

## Test Data Preparation

### Sample Parent Data
```json
{
  "nama": "Budi Santoso",
  "email": "budi.santoso@email.com",
  "password": "password123",
  "phone": "081234567890",
  "notes": "Wali murid aktif di kegiatan sekolah"
}
```

### Sample Student Relations
- NIPD: 2024001 (Anak pertama - Hubungan: Ayah - Kontak utama: Ya)
- NIPD: 2024002 (Anak kedua - Hubungan: Ayah - Kontak utama: Tidak)

## Expected Results

### Success Scenarios
1. **Create Parent**: Parent berhasil dibuat dengan password ter-hash
2. **Add Students**: Relasi parent-student terbuat di tabel `parent_students`
3. **Search NIPD**: Siswa ditemukan dan preview ditampilkan
4. **Update Parent**: Data parent terupdate, password optional
5. **Delete Parent**: Soft delete (is_active = false)

### Error Scenarios
1. **Duplicate Email**: Error message "Email sudah digunakan"
2. **Invalid NIPD**: Error message "Siswa tidak ditemukan"
3. **Validation Errors**: Field-specific error messages
4. **Network Errors**: Generic error handling

## Manual Testing Steps

### 1. Setup Testing Environment
```bash
# Jalankan migrasi
npm run migrate

# Seed data siswa untuk testing
npm run seed

# Start development server
npm run dev
```

### 2. Access Testing
1. Login sebagai admin
2. Navigate ke dashboard admin
3. Klik tab "Manajemen Wali Murid"
4. Verify halaman index terbuka

### 3. CRUD Testing Flow
1. **Create**: Tambah wali murid baru dengan 2 anak
2. **Read**: Lihat detail wali murid yang baru dibuat
3. **Update**: Edit informasi dan tambah/hapus anak
4. **Delete**: Hapus wali murid (confirm dialog)

### 4. Edge Cases Testing
1. Search dengan NIPD yang tidak ada
2. Tambah siswa yang sudah ada di parent lain
3. Create parent dengan email yang sudah ada
4. Form submission dengan field kosong

## Troubleshooting

### Common Issues
1. **Migration Error**: Pastikan database connection benar
2. **Route Not Found**: Pastikan routes sudah di-import dengan benar
3. **Component Not Loading**: Check console untuk JavaScript errors
4. **API Errors**: Check network tab dan server logs

### Debug Commands
```bash
# Check database tables
sqlite3 database.db ".tables"

# Check migration status
npx knex migrate:status

# Check server logs
tail -f logs/server.log
```

## Completion Criteria
- [ ] Semua test cases passed
- [ ] No console errors
- [ ] Responsive design works
- [ ] Error handling works properly
- [ ] Performance acceptable
- [ ] Security measures in place

## Notes
- Testing harus dilakukan di environment development terlebih dahulu
- Pastikan backup database sebelum testing destructive operations
- Document any bugs atau issues yang ditemukan
- Verify compatibility dengan existing features
