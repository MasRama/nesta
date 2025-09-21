# 📋 Dokumentasi Fitur Manajemen Absensi

## 🎯 Overview

Fitur Manajemen Absensi adalah sistem lengkap yang memungkinkan guru untuk mengelola kehadiran siswa secara manual, melihat statistik kehadiran, dan mengexport data absensi. Fitur ini terintegrasi dengan sistem scan QR code yang sudah ada.

## ✨ Fitur Utama

### 1. **Daftar Kehadiran Siswa per Mata Pelajaran**
- Tampilkan daftar siswa yang sudah hadir untuk mata pelajaran yang dipilih
- Tampilkan daftar siswa yang belum hadir/absen
- Filter berdasarkan tanggal (hari ini, minggu ini, bulan ini)
- Filter berdasarkan mata pelajaran yang diampu guru tersebut

### 2. **Manajemen Absensi Manual**
- Guru dapat menandai siswa sebagai hadir/tidak hadir secara manual
- Guru dapat menambahkan catatan untuk absensi tertentu
- Guru dapat mengubah status absensi (hadir, tidak hadir, terlambat, izin)

### 3. **Statistik Kehadiran**
- Statistik kehadiran per siswa
- Statistik kehadiran per mata pelajaran
- Statistik kehadiran per kelas
- Identifikasi siswa yang sering tidak hadir

### 4. **Export Data Absensi**
- Export data absensi ke format Excel
- Export data absensi ke format JSON
- Filter data export berdasarkan tanggal, mata pelajaran, dan kelas

## 🏗️ Arsitektur Sistem

### Backend Components

#### 1. **AttendanceController.ts** - API Endpoints Baru
```typescript
// Endpoint untuk mendapatkan sesi absensi guru
GET /api/attendance/teacher/sessions

// Endpoint untuk mendapatkan daftar siswa dalam kelas
GET /api/attendance/class/:class_id/students

// Endpoint untuk manajemen absensi manual
POST /api/attendance/manual

// Endpoint untuk update record absensi
PUT /api/attendance/record/:attendance_id

// Endpoint untuk statistik absensi guru
GET /api/attendance/teacher/stats

// Endpoint untuk export data absensi
GET /api/attendance/export
```

#### 2. **AttendanceService.ts** - Business Logic Baru
```typescript
// Mendapatkan sesi absensi guru dengan daftar siswa
getTeacherAttendanceSessions()

// Mendapatkan siswa dalam kelas untuk manajemen absensi
getClassStudentsForAttendance()

// Manajemen absensi manual
manualAttendance()

// Update record absensi
updateAttendanceRecord()

// Statistik absensi guru
getTeacherAttendanceStats()

// Export data absensi
exportAttendanceData()
```

### Frontend Components

#### 1. **AttendanceManagement.svelte** - Komponen Utama
- **Navigation Tabs**: Sesi Absensi, Statistik
- **Filters**: Tanggal, Mata Pelajaran, Kelas, Periode
- **Export Buttons**: JSON dan Excel
- **Real-time Updates**: Refresh otomatis setelah perubahan

#### 2. **Dashboard Integration**
- Tab baru "Kelola Absensi" di dashboard guru
- Terintegrasi dengan tab "Scan QR" yang sudah ada
- Konsisten dengan design system yang ada

## 📊 Database Schema

### Tabel yang Digunakan

#### 1. **attendance_sessions**
```sql
- id (UUID, Primary Key)
- class_id (UUID, Foreign Key → classes.id)
- teacher_id (UUID, Foreign Key → users.id)
- subject_id (UUID, Foreign Key → subjects.id)
- attendance_date (DATE)
- qr_token (VARCHAR)
- starts_at (DATETIME)
- expires_at (DATETIME)
- is_active (BOOLEAN)
- notes (TEXT)
- created_at (BIGINT)
- updated_at (BIGINT)
```

#### 2. **attendance_records**
```sql
- id (UUID, Primary Key)
- attendance_session_id (UUID, Foreign Key → attendance_sessions.id)
- student_id (UUID, Foreign Key → users.id)
- status (ENUM: 'present', 'absent', 'late', 'excused')
- scanned_at (DATETIME)
- notes (TEXT)
- created_at (BIGINT)
- updated_at (BIGINT)
```

## 🔧 API Documentation

### 1. GET /api/attendance/teacher/sessions
**Deskripsi**: Mendapatkan sesi absensi guru dengan daftar siswa

**Query Parameters**:
- `date` (optional): Filter berdasarkan tanggal (YYYY-MM-DD)
- `subject_id` (optional): Filter berdasarkan mata pelajaran
- `class_id` (optional): Filter berdasarkan kelas

**Response**:
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "subject_name": "Matematika",
      "class_name": "7A",
      "attendance_date": "2025-09-21",
      "total_present": 25,
      "total_absent": 5,
      "attendance_records": [...]
    }
  ]
}
```

### 2. GET /api/attendance/class/:class_id/students
**Deskripsi**: Mendapatkan daftar siswa dalam kelas untuk manajemen absensi

**Query Parameters**:
- `subject_id` (optional): Filter berdasarkan mata pelajaran
- `date` (optional): Filter berdasarkan tanggal

**Response**:
```json
{
  "students": [
    {
      "id": "student-uuid",
      "student_name": "Ahmad Rizki",
      "nipd": "2024070001",
      "attendance_status": "present",
      "attendance_notes": "Hadir tepat waktu"
    }
  ]
}
```

### 3. POST /api/attendance/manual
**Deskripsi**: Menandai absensi siswa secara manual

**Request Body**:
```json
{
  "student_id": "student-uuid",
  "session_id": "session-uuid",
  "status": "present|absent|late|excused",
  "notes": "Catatan opsional"
}
```

**Response**:
```json
{
  "message": "Absensi berhasil dicatat",
  "attendance": {
    "id": "attendance-uuid",
    "status": "present",
    "notes": "Catatan"
  }
}
```

### 4. GET /api/attendance/teacher/stats
**Deskripsi**: Mendapatkan statistik absensi guru

**Query Parameters**:
- `period`: today|week|month
- `subject_id` (optional): Filter berdasarkan mata pelajaran
- `class_id` (optional): Filter berdasarkan kelas

**Response**:
```json
{
  "stats": {
    "period": "today",
    "date_range": {
      "start": "2025-09-21",
      "end": "2025-09-21"
    },
    "overall": {
      "present": 120,
      "absent": 15,
      "late": 8,
      "excused": 3
    },
    "by_subject": {
      "Matematika": {
        "present": 25,
        "absent": 3
      }
    },
    "frequent_absences": [
      {
        "student_name": "John Doe",
        "student_number": "2024070002",
        "absent_count": 5
      }
    ]
  }
}
```

### 5. GET /api/attendance/export
**Deskripsi**: Export data absensi

**Query Parameters**:
- `class_id`: ID kelas
- `subject_id` (optional): ID mata pelajaran
- `start_date` (optional): Tanggal mulai
- `end_date` (optional): Tanggal akhir
- `format`: json|excel

**Response**:
- Format JSON: Data array
- Format Excel: File download

## 🎨 UI/UX Features

### 1. **Navigation Tabs**
- **Sesi Absensi**: Menampilkan daftar sesi absensi hari ini
- **Statistik**: Menampilkan statistik kehadiran dengan visualisasi

### 2. **Filter System**
- Filter tanggal dengan date picker
- Dropdown mata pelajaran (hanya yang diampu guru)
- Dropdown kelas (hanya yang diajar guru)
- Filter periode untuk statistik (hari ini, minggu ini, bulan ini)

### 3. **Interactive Elements**
- Tombol quick action untuk menandai kehadiran (✓, ✗, ⏰, 📝)
- Real-time update setelah perubahan status
- Loading states dan error handling
- Success/error notifications

### 4. **Export Features**
- Tombol export JSON dan Excel di header
- Download otomatis file dengan nama yang descriptive
- Progress indicator saat export

## 🧪 Testing

### Test Coverage
- ✅ API endpoints functionality
- ✅ Database integrity checks
- ✅ Foreign key constraints validation
- ✅ Manual attendance operations
- ✅ Statistics calculation
- ✅ Export functionality
- ✅ Performance validation

### Test Script
```bash
npx ts-node test-attendance-management.ts
```

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Database Migration
Tidak diperlukan migration baru karena menggunakan skema yang sudah ada.

## 📈 Performance Optimizations

1. **Database Queries**: Optimized joins dan indexing
2. **Frontend**: Lazy loading dan efficient re-renders
3. **Caching**: Session data caching untuk mengurangi database calls
4. **Pagination**: Untuk dataset besar (future enhancement)

## 🔒 Security

1. **Authorization**: Role-based access (hanya guru yang bisa akses)
2. **Validation**: Input validation di backend dan frontend
3. **CSRF Protection**: Menggunakan middleware yang ada
4. **Data Sanitization**: Semua input di-sanitize sebelum disimpan

## 🎯 Future Enhancements

1. **Notifikasi Real-time**: WebSocket untuk update real-time
2. **Mobile App**: Responsive design untuk mobile
3. **Advanced Analytics**: Dashboard analytics yang lebih detail
4. **Bulk Operations**: Import/export bulk data
5. **Integration**: Integrasi dengan sistem LMS lain
