# Fitur Pemilihan Jadwal untuk Scan QR Murid

## Overview
Implementasi fitur pemilihan jadwal sebelum melakukan scan QR murid di dashboard guru. Fitur ini memungkinkan guru untuk memilih jadwal yang tepat ketika memiliki multiple jadwal mengajar pada hari yang sama.

## Fitur yang Diimplementasikan

### 1. **Kondisi Multiple Jadwal**
- Ketika guru memiliki lebih dari satu jadwal mengajar pada hari yang sama, sistem menampilkan modal pemilihan jadwal
- Setiap pilihan jadwal menampilkan informasi lengkap: "Mata Pelajaran - Jam (Kelas)"
- Contoh: "IPA - 08:00-09:30 (8A)", "Matematika - 10:00-11:30 (8B)"

### 2. **Kondisi Jadwal Tunggal**
- Jika guru hanya memiliki satu jadwal pada hari tersebut, sistem langsung membuka QR scanner
- Otomatis menggunakan jadwal yang tersedia tanpa perlu pemilihan

### 3. **Kondisi Tidak Ada Jadwal**
- Jika tidak ada jadwal pada hari tersebut, sistem menampilkan pesan error yang informatif
- Contoh: "Anda tidak memiliki jadwal mengajar hari ini"

### 4. **Flow Baru**
```
Klik "Scan QR Murid" → Cek jadwal hari ini → 
├─ Tidak ada jadwal: Tampilkan error
├─ Satu jadwal: Langsung buka QR scanner  
└─ Multiple jadwal: Tampilkan modal pemilihan → Pilih jadwal → Buka QR scanner
```

## File yang Dimodifikasi

### 1. **Backend Changes**

#### `app/services/TeacherService.ts`
- **Method baru**: `getTodaySchedules(teacherUserId: string)`
- Mengambil jadwal guru untuk hari ini dengan informasi lengkap
- Return format: `{ hasSchedules: boolean, schedules: array, message: string }`

#### `app/controllers/AttendanceController.ts`
- **Method baru**: `getTodaySchedules(request, response)`
- **Update**: `scanStudentQR()` untuk menerima parameter tambahan `schedule_id` dan `class_id`

#### `app/services/AttendanceService.ts`
- **Method baru**: `validateSpecificTeacherSchedule()` untuk validasi jadwal spesifik
- **Update**: `scanStudentQR()` untuk mendukung validasi dengan schedule ID

#### `routes/web.ts`
- **Route baru**: `GET /api/attendance/today-schedules` untuk mengambil jadwal hari ini

### 2. **Frontend Changes**

#### `resources/js/Pages/dashboard/teacher.svelte`
- **State variables baru**:
  - `showScheduleSelector`: Modal pemilihan jadwal
  - `selectedSchedule`: Jadwal yang dipilih
  - `todaySchedules`: Daftar jadwal hari ini
  - `isLoadingSchedules`: Loading state

- **Functions baru**:
  - `checkTodaySchedules()`: Mengambil jadwal hari ini dari API
  - `selectSchedule(schedule)`: Memilih jadwal dari modal
  - `closeScheduleSelector()`: Menutup modal pemilihan

- **UI Components baru**:
  - Modal pemilihan jadwal dengan design yang user-friendly
  - Loading states untuk tombol scan QR
  - Error display untuk kondisi tidak ada jadwal

## API Endpoints

### `GET /api/attendance/today-schedules`
**Description**: Mengambil jadwal guru untuk hari ini

**Response Success**:
```json
{
  "hasSchedules": true,
  "schedules": [
    {
      "schedule_id": "uuid",
      "subject_id": "uuid", 
      "subject_name": "IPA",
      "subject_code": "IPA8A",
      "day": "Senin",
      "start_time": "08:00",
      "end_time": "09:30",
      "class_id": "uuid",
      "class_name": "8A",
      "display_text": "IPA - 08:00-09:30 (8A)"
    }
  ],
  "message": "Ditemukan 1 jadwal mengajar hari ini"
}
```

**Response No Schedules**:
```json
{
  "hasSchedules": false,
  "schedules": [],
  "message": "Anda tidak memiliki jadwal mengajar hari ini (Sabtu)"
}
```

### `POST /api/attendance/scan-student` (Updated)
**Description**: Scan QR code murid dengan context jadwal

**Request Body**:
```json
{
  "qr_data": "NSID001_Ahmad Budi",
  "subject_id": "uuid",
  "schedule_id": "uuid", // Optional - untuk validasi spesifik
  "class_id": "uuid"     // Optional - untuk validasi spesifik
}
```

## Testing Results

### ✅ **Kondisi yang Berhasil Ditest**:
1. **No Schedules**: Hari Sabtu (tidak ada jadwal) - menampilkan pesan error yang tepat
2. **Single Schedule**: Hari Senin dengan 1 jadwal - langsung ke QR scanner
3. **Multiple Schedules**: Hari Senin dengan 2 jadwal - menampilkan modal pemilihan
4. **API Integration**: Endpoint `/api/attendance/today-schedules` berfungsi dengan baik
5. **Database Validation**: Method validasi jadwal spesifik bekerja dengan benar

### ✅ **UI/UX Features**:
- Loading states pada tombol scan QR
- Error display yang informatif
- Modal pemilihan jadwal yang responsive
- Informasi jadwal lengkap di QR scanner modal

## Keamanan dan Validasi

1. **Teacher Role Validation**: Hanya teacher yang bisa mengakses endpoint jadwal
2. **Schedule Validation**: Validasi bahwa guru memiliki akses ke jadwal yang dipilih
3. **Day Validation**: Validasi bahwa jadwal sesuai dengan hari ini
4. **Class Validation**: Validasi bahwa murid berada di kelas yang sesuai dengan jadwal

## Backward Compatibility

Implementasi ini tetap kompatibel dengan flow lama:
- Tombol scan QR dari card mata pelajaran tetap berfungsi (langsung dengan subject)
- API scan-student tetap menerima parameter lama (tanpa schedule_id)
- Tidak ada breaking changes pada fungsionalitas yang sudah ada

## Next Steps

Fitur ini siap untuk digunakan dan telah ditest untuk semua kondisi yang diminta. Integrasi dengan sistem absensi yang sudah ada berfungsi dengan baik tanpa merusak fungsionalitas existing.
