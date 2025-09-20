# Perbaikan Sistem Login Guru

## 🚨 Masalah yang Ditemukan

Guru yang ditambahkan melalui panel admin tidak bisa login ke dashboard guru mereka karena:

1. **Sistem Database Terpisah**: Data guru disimpan di tabel `teachers`, tapi sistem login hanya mencari di tabel `users`
2. **Tidak Ada Sinkronisasi**: Tidak ada proses untuk membuat user account saat guru ditambahkan
3. **Password Hashing Berbeda**: TeacherService dan Authenticate service menggunakan metode hashing yang berbeda
4. **Relasi Tidak Digunakan**: Field `user_id` di tabel teachers tidak dimanfaatkan

## 🔧 Solusi yang Diimplementasikan

### 1. Modifikasi TeacherService.createTeacher()

**File**: `app/services/TeacherService.ts`

**Perubahan**:
- Menambahkan pembuatan user account secara otomatis saat guru dibuat
- Menggunakan transaction untuk memastikan atomicity
- Menghash password dengan kedua metode (untuk kompatibilitas)
- Menghubungkan teacher dan user melalui foreign key

**Fitur Baru**:
```typescript
// Membuat user account dengan role 'teacher'
const userData = {
    id: userId,
    name: data.nama,
    email: data.email,
    password: hashedPasswordForUser, // Menggunakan Authenticate.hash()
    role: 'teacher',
    teacher_id: teacherId,
    // ...
};

// Menghubungkan teacher dengan user
const teacherData = {
    // ...
    user_id: userId, // Link ke user account
    // ...
};
```

### 2. Modifikasi SchoolAuthController.processLogin()

**File**: `app/controllers/SchoolAuthController.ts`

**Perubahan**:
- Menambahkan fallback untuk mencari di tabel teachers
- Membuat user account otomatis untuk guru lama yang belum punya
- Mendukung password hashing guru yang lama

**Alur Login Baru**:
1. Cari di tabel `users` (prioritas utama)
2. Jika tidak ditemukan, cari di tabel `teachers`
3. Jika ditemukan di teachers, buat/link user account
4. Proses login normal dengan role-based redirect

### 3. Script Migrasi untuk Guru Existing

**File**: `scripts/migrate-existing-teachers.ts`

**Fungsi**:
- Membuat user account untuk semua guru yang sudah ada
- Menghubungkan teacher dan user records
- Memberikan password default "guru123" (harus diganti)
- Rollback capability jika diperlukan

**Cara Menjalankan**:
```bash
node scripts/run-teacher-migration.js
```

## 📋 Langkah-Langkah Testing

### 1. Test Guru Baru (Setelah Perbaikan)

1. Login sebagai admin
2. Tambahkan guru baru melalui panel admin
3. Logout dari admin
4. Coba login dengan kredensial guru yang baru ditambahkan
5. Verifikasi redirect ke dashboard teacher

### 2. Test Guru Existing (Sebelum Perbaikan)

1. Jalankan script migrasi:
   ```bash
   node scripts/run-teacher-migration.js
   ```
2. Coba login dengan email guru existing
3. Gunakan password default "guru123" atau password asli mereka
4. Verifikasi redirect ke dashboard teacher
5. Minta guru untuk mengganti password

### 3. Test Skenario Edge Cases

1. **Email Duplikat**: Coba tambah guru dengan email yang sudah ada
2. **Login Bersamaan**: Test login admin dan guru bersamaan
3. **Password Salah**: Verifikasi error message yang tepat
4. **Guru Non-Aktif**: Pastikan guru yang di-disable tidak bisa login

## 🔒 Keamanan

### Password Hashing
- **Guru Baru**: Menggunakan Authenticate.hash() (PBKDF2 dengan random salt)
- **Guru Lama**: Tetap mendukung hash lama untuk kompatibilitas
- **Migrasi**: Password default "guru123" harus diganti pada login pertama

### Validasi
- Email uniqueness di kedua tabel
- Role validation untuk teacher
- Active status checking

## 🚀 Deployment

### Pre-Deployment
1. Backup database
2. Test di environment staging
3. Verifikasi semua guru bisa login

### Deployment Steps
1. Deploy kode baru
2. Jalankan script migrasi:
   ```bash
   node scripts/run-teacher-migration.js
   ```
3. Test login beberapa guru
4. Monitor error logs

### Post-Deployment
1. Kirim notifikasi ke semua guru tentang perubahan
2. Instruksikan guru untuk mengganti password jika menggunakan default
3. Monitor login success rate

## 📊 Monitoring

### Metrics to Track
- Login success rate untuk teachers
- Number of teachers with default passwords
- Error rate pada teacher login

### Logs to Monitor
- Teacher login attempts
- User account creation for teachers
- Migration script execution

## 🔄 Rollback Plan

Jika terjadi masalah:

1. **Rollback Code**: Deploy versi sebelumnya
2. **Rollback Database**: 
   ```bash
   node scripts/run-teacher-migration.js rollback
   ```
3. **Verify**: Test login dengan sistem lama

## 📞 Support

### Common Issues

1. **"Email tidak terdaftar"**: Jalankan script migrasi
2. **"Password salah"**: Coba password default "guru123"
3. **Redirect loop**: Clear browser cookies
4. **Database error**: Check connection dan permissions

### Contact
- Developer: [Your Name]
- Documentation: docs/teacher-login-fix.md
- Migration Script: scripts/migrate-existing-teachers.ts
