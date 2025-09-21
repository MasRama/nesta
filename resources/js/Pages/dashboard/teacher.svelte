<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   import { Html5QrcodeScanner } from 'html5-qrcode';
   
   export let user;
   export let teacherSubjects = [];
   export let weeklySchedule = [];
   export let currentSchedule = { hasActiveSchedule: false, message: '', schedule: null };
   export let journals = [];
   export let exams = [];
   
   let currentSection = 'overview';
   let showQRScanner = false;
   let showScheduleSelector = false;
   let scanResult = null;
   let isScanning = false;
   let selectedSubject = null;
   let selectedSchedule = null;
   let todaySchedules = [];
   let isLoadingSchedules = false;
   let scanError = null;
   let qrScanner = null;
   
   function navigateToSection(section) {
      currentSection = section;
   }
   
   function logout() {
      router.post('/logout');
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
   
   function formatDateTime(dateString) {
      return new Date(dateString).toLocaleString('id-ID');
   }
   
   async function openQRScanner(subject = null) {
      // If subject is provided (from subject card), use it directly
      if (subject) {
         selectedSubject = subject;
         showQRScanner = true;
         scanError = null;
         scanResult = null;

         // Initialize QR scanner after modal is shown
         setTimeout(() => {
            initQRScanner();
         }, 100);
         return;
      }

      // If no subject provided (from Ringkasan tab), always show schedule selector
      await checkTodaySchedulesForSelector();
   }

   async function loadTodaySchedules() {
      isLoadingSchedules = true;
      scanError = null;

      try {
         const response = await fetch('/api/attendance/today-schedules', {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
            }
         });

         const data = await response.json();

         if (response.ok) {
            if (!data.hasSchedules) {
               todaySchedules = [];
            } else {
               todaySchedules = data.schedules;
            }
         } else {
            scanError = data.error || 'Gagal mengambil jadwal hari ini';
            todaySchedules = [];
         }
      } catch (error) {
         console.error('Error fetching today schedules:', error);
         scanError = 'Terjadi kesalahan saat mengambil jadwal';
         todaySchedules = [];
      } finally {
         isLoadingSchedules = false;
      }
   }

   async function checkTodaySchedulesForSelector() {
      isLoadingSchedules = true;
      scanError = null;

      try {
         const response = await fetch('/api/attendance/today-schedules', {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
            }
         });

         const data = await response.json();

         if (response.ok) {
            if (!data.hasSchedules) {
               // No schedules today - still show modal with empty state
               todaySchedules = [];
            } else {
               todaySchedules = data.schedules;
            }

            // Always show schedule selector for Ringkasan tab (even for no schedules)
            showScheduleSelector = true;
         } else {
            scanError = data.error || 'Gagal mengambil jadwal hari ini';
            // Still show modal even on API error
            todaySchedules = [];
            showScheduleSelector = true;
         }
      } catch (error) {
         console.error('Error fetching today schedules:', error);
         scanError = 'Terjadi kesalahan saat mengambil jadwal';
         // Still show modal even on network error
         todaySchedules = [];
         showScheduleSelector = true;
      } finally {
         isLoadingSchedules = false;
      }
   }



   function selectSchedule(schedule) {
      selectedSubject = {
         id: schedule.subject_id,
         nama: schedule.subject_name,
         kode: schedule.subject_code,
         deskripsi: schedule.subject_description
      };
      selectedSchedule = schedule;

      showScheduleSelector = false;
      showQRScanner = true;
      scanError = null;
      scanResult = null;

      // Initialize QR scanner after modal is shown
      setTimeout(() => {
         initQRScanner();
      }, 100);
   }

   function closeScheduleSelector() {
      showScheduleSelector = false;
      todaySchedules = [];
      selectedSchedule = null;
      scanError = null; // Reset error state when closing modal
   }

   function closeQRScanner() {
      // Stop scanner if running
      if (qrScanner) {
         qrScanner.clear().catch(error => {
            console.error("Failed to clear QR scanner:", error);
         });
         qrScanner = null;
      }

      showQRScanner = false;
      isScanning = false;
      scanError = null;
      scanResult = null;
      selectedSchedule = null;
      // Note: Don't reset selectedSubject here as it might be used from subject card
   }

   function initQRScanner() {
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) return;

      qrScanner = new Html5QrcodeScanner(
         "qr-reader",
         {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
         },
         false
      );

      qrScanner.render(
         (decodedText, decodedResult) => {
            // QR code successfully scanned
            processScannedQR(decodedText);

            // Stop scanning after successful scan
            qrScanner.clear().catch(error => {
               console.error("Failed to clear QR scanner:", error);
            });
         },
         (error) => {
            // QR code scan error - this is normal, just ignore
            // console.warn(`QR scan error: ${error}`);
         }
      );
   }

   async function processScannedQR(qrData) {
      isScanning = true;
      scanError = null;

      if (!selectedSubject) {
         scanError = 'Pilih mata pelajaran terlebih dahulu';
         isScanning = false;
         return;
      }

      try {
         const requestBody = {
            qr_data: qrData,
            subject_id: selectedSubject.id
         };

         // Add schedule information if available
         if (selectedSchedule) {
            requestBody.schedule_id = selectedSchedule.schedule_id;
            requestBody.class_id = selectedSchedule.class_id;
         }

         const response = await fetch('/api/attendance/scan-student', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
         });

         const data = await response.json();

         if (response.ok) {
            scanResult = {
               success: true,
               message: data.message,
               student: data.student,
               attendance: data.attendance
            };
         } else {
            scanError = data.error || 'Gagal memproses QR code murid';
         }
      } catch (error) {
         console.error('Error processing scanned QR:', error);
         scanError = 'Terjadi kesalahan saat memproses QR code';
      } finally {
         isScanning = false;
      }
   }


   
   function createNewJournal() {
      router.visit('/journal/create');
   }
   
   function editJournal(journalId) {
      router.visit(`/journal/${journalId}/edit`);
   }
   
   function createExam() {
      router.visit('/exam/create');
   }
   
   function viewExamResults(examId) {
      router.visit(`/exam/${examId}/results`);
   }
</script>

<svelte:head>
   <title>Dashboard Guru - NETSA</title>
</svelte:head>

<style>
   /* Enhanced Material Design Animations */
   .stats-card-enhanced {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateZ(0);
   }
   
   .stats-card-enhanced:hover {
      transform: translateY(-8px) scale(1.02) translateZ(0);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
   }

   /* Fade in animations with stagger effect */
   .fade-in-up {
      opacity: 0;
      transform: translateY(30px);
      animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
   }

   .stagger-1 { animation-delay: 0.1s; }
   .stagger-2 { animation-delay: 0.2s; }
   .stagger-3 { animation-delay: 0.3s; }

   @keyframes fadeInUp {
      to {
         opacity: 1;
         transform: translateY(0);
      }
   }

   /* Smooth hover transitions for buttons */
   .nav-btn-enhanced {
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   }

   .nav-btn-enhanced::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
   }

   .nav-btn-enhanced:hover::before {
      left: 100%;
   }

   /* Enhanced header animation */
   .header-enhanced {
      position: relative;
      overflow: hidden;
   }

   .header-enhanced::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.03), transparent);
      animation: headerShine 8s linear infinite;
   }

   @keyframes headerShine {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
   }

   /* Enhanced backdrop blur */
   .backdrop-blur-enhanced {
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
   }
</style>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <!-- Modern Material Design Header -->
   <header class="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-xl relative overflow-hidden header-enhanced backdrop-blur-enhanced">
      <div class="absolute inset-0 opacity-10">
         <div class="absolute top-0 left-0 w-full h-full">
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
               <g fill="none" fill-rule="evenodd">
                  <g fill="#ffffff" fill-opacity="0.1">
                     <circle cx="30" cy="30" r="2"/>
                  </g>
               </g>
            </svg>
         </div>
      </div>
      
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex justify-between items-center h-20">
            <div class="flex items-center space-x-4">
               <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
               </div>
               <div>
                  <h1 class="text-2xl font-bold text-white">Dashboard Guru</h1>
                  <p class="text-blue-100 text-sm">Portal Akademik NETSA</p>
               </div>
            </div>
            <div class="flex items-center space-x-6">
               <div class="flex items-center space-x-3">
                  <span class="text-white font-medium">Selamat datang, {user.name}</span>
                  <button
                     on:click={logout}
                     class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
                  >
                     Keluar
                  </button>
               </div>
            </div>
         </div>
      </div>
   </header>

   <!-- Modern Material Design Navigation -->
   <nav class="bg-white/90 backdrop-blur-md border-b border-blue-200/30 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex space-x-2 py-4">
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'overview'}
               class:from-blue-600={currentSection === 'overview'}
               class:to-indigo-600={currentSection === 'overview'}
               class:text-white={currentSection === 'overview'}
               class:shadow-lg={currentSection === 'overview'}
               class:text-gray-600={currentSection !== 'overview'}
               class:hover:bg-blue-50={currentSection !== 'overview'}
               on:click={() => navigateToSection('overview')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/>
                  </svg>
                  <span>Ringkasan</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'attendance'}
               class:from-blue-600={currentSection === 'attendance'}
               class:to-indigo-600={currentSection === 'attendance'}
               class:text-white={currentSection === 'attendance'}
               class:shadow-lg={currentSection === 'attendance'}
               class:text-gray-600={currentSection !== 'attendance'}
               class:hover:bg-blue-50={currentSection !== 'attendance'}
               on:click={() => navigateToSection('attendance')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Absensi</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'journal'}
               class:from-blue-600={currentSection === 'journal'}
               class:to-indigo-600={currentSection === 'journal'}
               class:text-white={currentSection === 'journal'}
               class:shadow-lg={currentSection === 'journal'}
               class:text-gray-600={currentSection !== 'journal'}
               class:hover:bg-blue-50={currentSection !== 'journal'}
               on:click={() => navigateToSection('journal')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                  </svg>
                  <span>Jurnal</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'exams'}
               class:from-blue-600={currentSection === 'exams'}
               class:to-indigo-600={currentSection === 'exams'}
               class:text-white={currentSection === 'exams'}
               class:shadow-lg={currentSection === 'exams'}
               class:text-gray-600={currentSection !== 'exams'}
               class:hover:bg-blue-50={currentSection !== 'exams'}
               on:click={() => navigateToSection('exams')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                  <span>Ujian</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'schedule'}
               class:from-blue-600={currentSection === 'schedule'}
               class:to-indigo-600={currentSection === 'schedule'}
               class:text-white={currentSection === 'schedule'}
               class:shadow-lg={currentSection === 'schedule'}
               class:text-gray-600={currentSection !== 'schedule'}
               class:hover:bg-blue-50={currentSection !== 'schedule'}
               on:click={() => navigateToSection('schedule')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <span>Jadwal</span>
               </div>
            </button>
         </div>
      </div>
   </nav>

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {#if currentSection === 'overview'}
         <!-- Overview Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-12">
               <!-- Modern Material Design Stats Cards -->
               <div class="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-1">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">Total Jadwal Mingguan</h3>
                           <p class="text-3xl font-bold text-white">{weeklySchedule.reduce((total, day) => total + day.schedules.length, 0)}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-2">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">Jurnal</h3>
                           <p class="text-3xl font-bold text-white">{journals.length}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="group bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-3">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">Jadwal Hari Ini</h3>
                           <p class="text-3xl font-bold text-white">{weeklySchedule.find(day => {
                              const today = new Date();
                              const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                              return day.day === dayNames[today.getDay()];
                           })?.schedules.length || 0}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="group bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-4">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">Ujian Aktif</h3>
                           <p class="text-3xl font-bold text-white">{exams.filter(e => e.status === 'active').length}</p>
                        </div>
                     </div>
                  </div>
               </div>


            </div>

            <!-- Modern Quick Actions -->
            <div class="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl mb-12 border border-white/20 fade-in-up">
               <div class="px-8 py-8">
                  <div class="flex items-center space-x-3 mb-8">
                     <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                     </div>
                     <h3 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Aksi Cepat</h3>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <button
                        class="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        on:click={openQRScanner}
                        disabled={isLoadingSchedules}
                     >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="relative flex flex-col items-center justify-center space-y-3">
                           {#if isLoadingSchedules}
                              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                              <span class="text-sm font-medium">Memuat...</span>
                           {:else}
                              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              <span class="text-sm font-medium">Scan QR Murid</span>
                           {/if}
                        </div>
                     </button>
                     <button 
                        class="group relative bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-6 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        on:click={createNewJournal}
                     >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="relative flex flex-col items-center justify-center space-y-3">
                           <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                           </svg>
                           <span class="text-sm font-medium">Tulis Jurnal</span>
                        </div>
                     </button>
                     <button
                        class="group relative bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-6 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        on:click={createExam}
                     >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="relative flex flex-col items-center justify-center space-y-3">
                           <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                           </svg>
                           <span class="text-sm font-medium">Buat Ujian</span>
                        </div>
                     </button>
                     <button
                        class="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        on:click={() => navigateToSection('schedule')}
                     >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="relative flex flex-col items-center justify-center space-y-3">
                           <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                           </svg>
                           <span class="text-sm font-medium">Lihat Jadwal</span>
                        </div>
                     </button>
                  </div>

                  <!-- Error Display for Scan QR -->
                  {#if scanError && !showQRScanner && !showScheduleSelector}
                     <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <div class="flex items-center">
                           <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                           </svg>
                           <p class="text-sm text-red-600">{scanError}</p>
                        </div>
                     </div>
                  {/if}
               </div>
            </div>

            <!-- Modern Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <!-- Recent Journals Card -->
               <div class="group bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 hover:shadow-3xl transition-all duration-500 fade-in-up stagger-1">
                  <div class="px-8 py-8">
                     <div class="flex items-center space-x-3 mb-6">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                           </svg>
                        </div>
                        <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Jurnal Terbaru</h3>
                     </div>
                     <div class="space-y-4">
                        {#each journals.slice(0, 5) as journal}
                           <div class="group/item bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 p-4 rounded-2xl border border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md">
                              <div class="flex items-center justify-between">
                                 <div class="flex-1">
                                    <p class="text-sm font-semibold text-gray-900 mb-1">{journal.title}</p>
                                    <p class="text-xs text-gray-600 flex items-center">
                                       <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                       </svg>
                                       {formatDate(journal.journal_date)}
                                    </p>
                                 </div>
                                 <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm {journal.status === 'published' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'}">
                                    {journal.status}
                                 </span>
                              </div>
                           </div>
                        {:else}
                           <p class="text-sm text-gray-500 text-center py-4">Belum ada jurnal</p>
                        {/each}
                     </div>
                     <div class="mt-6">
                        <button class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300" on:click={() => navigateToSection('journal')}>
                           <span class="flex items-center justify-center space-x-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                              </svg>
                              <span>Lihat Semua Jurnal</span>
                           </span>
                        </button>
                     </div>
                  </div>
               </div>

               <!-- Upcoming Exams Card -->
               <div class="group bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 hover:shadow-3xl transition-all duration-500 fade-in-up stagger-2">
                  <div class="px-8 py-8">
                     <div class="flex items-center space-x-3 mb-6">
                        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                           </svg>
                        </div>
                        <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Ujian Mendatang</h3>
                     </div>
                     <div class="space-y-4">
                        {#each exams.filter(e => e.status === 'active').slice(0, 5) as exam}
                           <div class="group/item bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 p-4 rounded-2xl border border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-md">
                              <div class="flex items-center justify-between">
                                 <div class="flex-1">
                                    <p class="text-sm font-semibold text-gray-900 mb-1">{exam.title}</p>
                                    <p class="text-xs text-gray-600 flex items-center">
                                       <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                       </svg>
                                       {formatDate(exam.start_time)}
                                    </p>
                                 </div>
                                 <button class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200" on:click={() => viewExamResults(exam.id)}>
                                    Lihat
                                 </button>
                              </div>
                           </div>
                        {:else}
                           <p class="text-sm text-gray-500 text-center py-4">Tidak ada ujian aktif</p>
                        {/each}
                     </div>
                     <div class="mt-6">
                        <button class="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-6 rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300" on:click={() => navigateToSection('exams')}>
                           <span class="flex items-center justify-center space-x-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                              </svg>
                              <span>Lihat Semua Ujian</span>
                           </span>
                        </button>
                     </div>
                  </div>
               </div>

               <!-- Schedule Card -->
               <div class="group bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 hover:shadow-3xl transition-all duration-500 fade-in-up stagger-3">
                  <div class="px-8 py-8">
                     <div class="flex items-center space-x-3 mb-6">
                        <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                           </svg>
                        </div>
                        <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Jadwal Saat Ini</h3>
                     </div>
                     <div class="space-y-4">
                        {#if currentSchedule.hasActiveSchedule}
                           <div class="group/item bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 p-4 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-md">
                              <div class="flex items-center justify-between mb-2">
                                 <div class="flex-1">
                                    <p class="text-sm font-semibold text-gray-900 mb-1">{currentSchedule.schedule.subject_name}</p>
                                    <p class="text-xs text-gray-600 flex items-center">
                                       <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                       </svg>
                                       Kelas {currentSchedule.schedule.kelas} • {currentSchedule.schedule.start_time}-{currentSchedule.schedule.end_time}
                                    </p>
                                 </div>
                                 <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Sedang Berlangsung
                                 </span>
                              </div>
                              <p class="text-xs text-gray-500 leading-relaxed">{currentSchedule.schedule.current_day}, {currentSchedule.schedule.current_time}</p>
                           </div>
                        {:else}
                           <div class="text-center py-8">
                              <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                 <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                 </svg>
                              </div>
                              <p class="text-gray-500 text-sm">{currentSchedule.message}</p>
                           </div>
                        {/if}
                     </div>
                     <div class="mt-6">
                        {#if currentSchedule.hasActiveSchedule}
                           <button
                              class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              on:click={openQRScanner}
                              disabled={isLoadingSchedules}
                           >
                              <span class="flex items-center justify-center space-x-2">
                                 {#if isLoadingSchedules}
                                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Memuat...</span>
                                 {:else}
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 8h4.01M16 4h4.01"></path>
                                    </svg>
                                    <span>Scan QR Murid</span>
                                 {/if}
                              </span>
                           </button>
                        {:else}
                           <button class="w-full bg-gray-400 text-white py-3 px-6 rounded-2xl text-sm font-semibold cursor-not-allowed" disabled>
                              <span class="flex items-center justify-center space-x-2">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                 </svg>
                                 <span>Tidak Ada Jadwal Aktif</span>
                              </span>
                           </button>
                        {/if}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'attendance'}
         <!-- Attendance Section -->
         <div class="px-4 py-6 sm:px-0">
            <!-- Jadwal Hari Ini Section -->
            <div class="mb-8">
               <div class="bg-gradient-to-br from-white/90 to-blue-50/30 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div class="flex items-center justify-between mb-6">
                     <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                           <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                           </svg>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900">Jadwal Hari Ini</h4>
                     </div>
                     <button
                        class="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
                        on:click={loadTodaySchedules}
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 8h4.01M16 4h4.01"/>
                        </svg>
                        <span>Mulai Absensi</span>
                     </button>
                  </div>

                  {#if isLoadingSchedules}
                     <div class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        <span class="ml-3 text-gray-600">Memuat jadwal...</span>
                     </div>
                  {:else if todaySchedules.length > 0}
                     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {#each todaySchedules as schedule}
                           <div class="bg-white/70 rounded-xl p-4 border border-white/50 hover:bg-white/90 transition-all duration-200 hover:shadow-md">
                              <div class="flex items-center justify-between mb-3">
                                 <span class="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{schedule.subject_code}</span>
                                 <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{schedule.start_time} - {schedule.end_time}</span>
                              </div>
                              <h5 class="font-medium text-gray-900 mb-1">{schedule.subject_name}</h5>
                              <p class="text-sm text-gray-600 mb-3">Kelas {schedule.class_name}</p>
                              <button
                                 class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-2 px-3 rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
                                 on:click={() => selectSchedule(schedule)}
                              >
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 8h4.01M16 4h4.01"/>
                                 </svg>
                                 <span>Scan QR</span>
                              </button>
                           </div>
                        {/each}
                     </div>
                  {:else}
                     <div class="text-center py-8">
                        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                           <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                           </svg>
                        </div>
                        <p class="text-gray-500 text-sm">Tidak ada jadwal mengajar hari ini</p>
                        <p class="text-gray-400 text-xs mt-1">Klik "Mulai Absensi" untuk memuat jadwal terbaru</p>
                     </div>
                  {/if}
               </div>
            </div>

            <!-- Semua Mata Pelajaran Section -->
            <div class="group bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 hover:shadow-3xl transition-all duration-500 fade-in-up">
               <div class="px-8 py-8">
                  <div class="flex items-center space-x-3 mb-8">
                     <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                     </div>
                     <h3 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Semua Mata Pelajaran</h3>
                  </div>

                  <div class="max-w-6xl mx-auto">
                     {#if teacherSubjects.length > 0}
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {#each teacherSubjects as subject}
                              <div class="group relative bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                                 <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                 <div class="relative">
                                    <div class="flex items-center justify-between mb-4">
                                       <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                          </svg>
                                       </div>
                                       <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-sm">
                                          {subject.kode}
                                       </span>
                                    </div>
                                    <h4 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">{subject.nama}</h4>

                                    <!-- Jadwal Information -->
                                    <div class="mb-4 space-y-2">
                                       {#if subject.schedules && subject.schedules.length > 0}
                                          {#each subject.schedules as schedule}
                                             <div class="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                                <div class="text-sm text-gray-700">
                                                   <span class="font-medium text-gray-800">Jadwal:</span>
                                                   <span class="text-blue-600 font-medium">{schedule.day}, {schedule.start_time} - {schedule.end_time}</span>
                                                </div>
                                                {#if schedule.kelas}
                                                   <div class="text-xs text-gray-600 mt-1">
                                                      <span class="font-medium">Kelas:</span> {schedule.kelas}
                                                   </div>
                                                {/if}
                                             </div>
                                          {/each}
                                       {:else}
                                          <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                             <div class="text-sm text-gray-600">
                                                <span class="font-medium">Jadwal:</span> Belum ada jadwal terdaftar
                                             </div>
                                          </div>
                                       {/if}
                                    </div>

                                    <p class="text-sm text-gray-600 mb-6">{subject.deskripsi || 'Mata pelajaran yang Anda ampu'}</p>
                                    <button
                                       class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
                                       on:click={() => openQRScanner(subject)}
                                    >
                                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 8h4.01M16 4h4.01"/>
                                       </svg>
                                       <span>Scan QR Murid</span>
                                    </button>
                                 </div>
                              </div>
                           {/each}
                        </div>
                     {:else}
                        <div class="text-center py-16">
                           <div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                              </svg>
                           </div>
                           <h4 class="text-xl font-semibold text-gray-500 mb-2">Belum Ada Mata Pelajaran</h4>
                           <p class="text-gray-400 mb-6">Anda belum mengampu mata pelajaran manapun. Hubungi administrator untuk mendapatkan akses.</p>
                        </div>
                     {/if}
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'journal'}
         <!-- Journal Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="group bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 hover:shadow-3xl transition-all duration-500 fade-in-up">
               <div class="px-8 py-8">
                  <div class="flex items-center justify-between mb-8">
                     <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                           </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Jurnal Pembelajaran</h3>
                     </div>
                     <button 
                        class="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
                        on:click={createNewJournal}
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Jurnal Baru</span>
                     </button>
                  </div>
                  
                  <!-- Tabel Jurnal Pembelajaran -->
                  <div class="bg-gradient-to-br from-white/95 to-emerald-50/30 backdrop-blur-sm border border-white/30 rounded-2xl overflow-hidden shadow-lg">
                     {#if journals.length > 0}
                        <div class="overflow-x-auto">
                           <table class="w-full">
                              <thead>
                                 <tr class="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                                    <th class="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Hari/Tanggal</th>
                                    <th class="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Jam</th>
                                    <th class="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Kelas</th>
                                    <th class="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Mata Pelajaran</th>
                                    <th class="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Materi</th>
                                    <th class="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Kegiatan Belajar</th>
                                    <th class="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Aksi</th>
                                 </tr>
                              </thead>
                              <tbody class="divide-y divide-emerald-100">
                                 {#each journals as journal, index}
                                    <tr class="hover:bg-emerald-50/50 transition-colors duration-200 {index % 2 === 0 ? 'bg-white/80' : 'bg-emerald-50/20'}">
                                       <td class="px-6 py-4 whitespace-nowrap">
                                          <div class="flex items-center space-x-2">
                                             <div class="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center shadow-sm">
                                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                </svg>
                                             </div>
                                             <div>
                                                <div class="text-sm font-semibold text-gray-900">{formatDate(journal.journal_date)}</div>
                                                <div class="text-xs text-gray-500">{new Date(journal.journal_date).toLocaleDateString('id-ID', { weekday: 'long' })}</div>
                                             </div>
                                          </div>
                                       </td>
                                       <td class="px-6 py-4 whitespace-nowrap">
                                          <div class="text-sm font-medium text-gray-900">07:00 - 08:30</div>
                                          <div class="text-xs text-gray-500">Jam ke-1</div>
                                       </td>
                                       <td class="px-6 py-4 whitespace-nowrap">
                                          <div class="flex items-center space-x-2">
                                             <div class="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-md flex items-center justify-center">
                                                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                                </svg>
                                             </div>
                                             <span class="text-sm font-medium text-gray-900">{journal.class_name}</span>
                                          </div>
                                       </td>
                                       <td class="px-6 py-4 whitespace-nowrap">
                                          <div class="text-sm font-medium text-gray-900">{journal.subject || 'Matematika'}</div>
                                          <div class="text-xs text-gray-500">Wajib</div>
                                       </td>
                                       <td class="px-6 py-4">
                                          <div class="text-sm font-medium text-gray-900 max-w-xs">{journal.title}</div>
                                          <div class="text-xs text-gray-500 mt-1 line-clamp-2">{journal.content.substring(0, 80)}...</div>
                                       </td>
                                       <td class="px-6 py-4">
                                          <div class="text-sm text-gray-900 max-w-xs">
                                             <div class="mb-1">• Pembukaan dan apersepsi</div>
                                             <div class="mb-1">• Penyampaian materi</div>
                                             <div class="mb-1">• Diskusi dan tanya jawab</div>
                                             <div>• Evaluasi dan penutup</div>
                                          </div>
                                       </td>
                                       <td class="px-6 py-4 whitespace-nowrap">
                                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm {journal.status === 'published' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'}">
                                             {journal.status === 'published' ? '✓ Selesai' : '⏳ Draft'}
                                          </span>
                                       </td>
                                       <td class="px-6 py-4 whitespace-nowrap text-center">
                                          <div class="flex items-center justify-center space-x-2">
                                             <button 
                                                class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                                on:click={() => editJournal(journal.id)}
                                                title="Edit Jurnal"
                                                aria-label="Edit Jurnal"
                                             >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                </svg>
                                             </button>
                                             <button 
                                                class="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white p-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                                title="Lihat Detail"
                                                aria-label="Lihat Detail Jurnal"
                                             >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                </svg>
                                             </button>
                                          </div>
                                       </td>
                                    </tr>
                                 {/each}
                              </tbody>
                           </table>
                        </div>
                     {:else}
                        <div class="text-center py-16">
                           <div class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                              </svg>
                           </div>
                           <p class="text-lg font-medium text-gray-500 mb-2">Belum Ada Jurnal</p>
                           <p class="text-sm text-gray-400">Belum ada jurnal pembelajaran yang dibuat</p>
                        </div>
                     {/if}
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'exams'}
         <!-- Exams Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
               <div class="px-8 py-8 sm:p-10">
                  <div class="flex justify-between items-center mb-8">
                     <div class="flex items-center space-x-3">
                        <div class="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg">
                           <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                           </svg>
                        </div>
                        <h3 class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Manajemen Ujian</h3>
                     </div>
                     <button 
                        class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                        on:click={createExam}
                     >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <span>Buat Ujian</span>
                     </button>
                  </div>
                  
                  <div class="space-y-6">
                     {#each exams as exam}
                        <div class="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                           <div class="flex justify-between items-start">
                              <div class="flex-1">
                                 <h4 class="text-xl font-bold text-gray-900 mb-2">{exam.title}</h4>
                                 <p class="text-gray-600 mb-4">{exam.description || 'Tidak ada deskripsi'}</p>
                                 <div class="flex items-center space-x-6 text-sm">
                                    <div class="flex items-center space-x-2 text-purple-600">
                                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                       </svg>
                                       <span class="font-medium">{exam.duration_minutes} menit</span>
                                    </div>
                                    <div class="flex items-center space-x-2 text-blue-600">
                                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 13a2 2 0 002 2h6a2 2 0 002-2L16 7"></path>
                                       </svg>
                                       <span class="font-medium">{formatDate(exam.start_time)}</span>
                                    </div>
                                    <div class="flex items-center space-x-2 text-green-600">
                                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"></path>
                                       </svg>
                                       <span class="font-medium">{exam.randomize_questions ? 'Acak Soal' : 'Urut Soal'}</span>
                                    </div>
                                 </div>
                              </div>
                              <div class="ml-6 flex items-center space-x-3">
                                 <span class="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold shadow-md {exam.status === 'active' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' : exam.status === 'draft' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'}">
                                    {exam.status}
                                 </span>
                                 <button 
                                    class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                    on:click={() => viewExamResults(exam.id)}
                                 >
                                    Hasil
                                 </button>
                              </div>
                           </div>
                        </div>
                     {:else}
                        <p class="text-sm text-gray-500 text-center py-8">Belum ada ujian dibuat</p>
                     {/each}
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'schedule'}
         <!-- Schedule Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
               <div class="px-8 py-8 sm:p-10">
                  <div class="flex items-center space-x-3 mb-8">
                     <div class="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                     </div>
                     <h3 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Jadwal Mengajar</h3>
                  </div>
                  
                  <div class="max-w-6xl mx-auto">
                     {#if weeklySchedule.length > 0}
                        <div class="space-y-6">
                           {#each weeklySchedule as daySchedule}
                              <div class="bg-gradient-to-br from-white/90 to-blue-50/30 backdrop-blur-sm border border-blue-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                                 <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-xl font-bold text-gray-900 flex items-center">
                                       <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md mr-3">
                                          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 13a2 2 0 002 2h6a2 2 0 002-2L16 7"></path>
                                          </svg>
                                       </div>
                                       {daySchedule.day}
                                    </h4>
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                       {daySchedule.schedules.length} Jadwal
                                    </span>
                                 </div>

                                 {#if daySchedule.schedules.length > 0}
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                       {#each daySchedule.schedules as schedule}
                                          <div class="bg-white/70 rounded-xl p-4 border border-white/50 hover:bg-white/90 transition-all duration-200">
                                             <div class="flex items-center justify-between mb-2">
                                                <span class="text-sm font-semibold text-blue-600">{schedule.subject_code}</span>
                                                <span class="text-xs text-gray-500">{schedule.start_time} - {schedule.end_time}</span>
                                             </div>
                                             <h5 class="font-medium text-gray-900 mb-1">{schedule.subject_name}</h5>
                                             <p class="text-sm text-gray-600">Kelas {schedule.kelas}</p>
                                          </div>
                                       {/each}
                                    </div>
                                 {:else}
                                    <div class="text-center py-8">
                                       <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                       </svg>
                                       <p class="text-gray-500">Tidak ada jadwal</p>
                                    </div>
                                 {/if}
                              </div>
                           {/each}
                        </div>
                     {:else}
                        <div class="text-center py-16">
                           <div class="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 13a2 2 0 002 2h6a2 2 0 002-2L16 7"></path>
                              </svg>
                           </div>
                           <h4 class="text-2xl font-semibold text-gray-500 mb-4">Belum Ada Jadwal Mengajar</h4>
                           <p class="text-gray-400 mb-8">Anda belum memiliki jadwal mengajar. Hubungi administrator untuk mendapatkan jadwal.</p>
                        </div>
                     {/if}
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>

<!-- Schedule Selector Modal -->
{#if showScheduleSelector}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
         <div class="mt-3">
            <div class="flex items-center justify-between mb-4">
               <h3 class="text-lg leading-6 font-medium text-gray-900">Pilih Jadwal Mengajar</h3>
               <button
                  class="text-gray-400 hover:text-gray-600"
                  on:click={closeScheduleSelector}
                  aria-label="Tutup pemilihan jadwal"
               >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
               </button>
            </div>

            <div class="mb-4">
               {#if scanError}
                  <!-- Error State -->
                  <div class="text-center py-8">
                     <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                     </div>
                     <p class="text-red-600 text-sm font-medium mb-2">Terjadi Kesalahan</p>
                     <p class="text-gray-500 text-sm">{scanError}</p>
                  </div>
               {:else if todaySchedules.length > 0}
                  <!-- Schedule List -->
                  <p class="text-sm text-gray-600 mb-4">
                     Pilih jadwal mengajar yang sesuai untuk melakukan absensi:
                  </p>

                  <div class="space-y-3">
                     {#each todaySchedules as schedule}
                        <button
                           class="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           on:click={() => selectSchedule(schedule)}
                        >
                           <div class="flex items-center justify-between">
                              <div class="flex-1">
                                 <div class="font-medium text-gray-900 mb-1">
                                    {schedule.subject_name}
                                 </div>
                                 <div class="text-sm text-gray-600">
                                    <span class="inline-flex items-center">
                                       <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                       </svg>
                                       {schedule.start_time} - {schedule.end_time}
                                    </span>
                                    <span class="ml-3 inline-flex items-center">
                                       <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                       </svg>
                                       Kelas {schedule.class_name}
                                    </span>
                                 </div>
                                 <div class="text-xs text-gray-500 mt-1">
                                    Kode: {schedule.subject_code}
                                 </div>
                              </div>
                              <div class="ml-4">
                                 <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                 </svg>
                              </div>
                           </div>
                        </button>
                     {/each}
                  </div>
               {:else}
                  <!-- Empty State -->
                  <div class="text-center py-8">
                     <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                     </div>
                     <p class="text-gray-500 text-sm">Tidak ada jadwal mengajar hari ini</p>
                  </div>
               {/if}
            </div>

            <div class="flex justify-center">
               <button
                  class="px-6 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 transition-colors"
                  on:click={closeScheduleSelector}
               >
                  Batal
               </button>
            </div>
         </div>
      </div>
   </div>
{/if}

<!-- QR Scanner Modal -->
{#if showQRScanner}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
         <div class="mt-3">
            <div class="flex items-center justify-between mb-4">
               <h3 class="text-lg leading-6 font-medium text-gray-900">Scan QR Code Murid</h3>
               <button
                  class="text-gray-400 hover:text-gray-600"
                  on:click={closeQRScanner}
                  aria-label="Tutup scanner"
               >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
               </button>
            </div>

            <div class="text-center">
               {#if selectedSubject}
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                     <p class="text-sm font-medium text-blue-800">Mata Pelajaran: {selectedSubject.nama}</p>
                     <p class="text-xs text-blue-600">Kode: {selectedSubject.kode}</p>
                     {#if selectedSchedule}
                        <div class="mt-2 pt-2 border-t border-blue-200">
                           <p class="text-xs text-blue-700">
                              <span class="font-medium">Jadwal:</span>
                              {selectedSchedule.day}, {selectedSchedule.start_time} - {selectedSchedule.end_time}
                              <span class="ml-2">({selectedSchedule.class_name})</span>
                           </p>
                        </div>
                     {/if}
                  </div>
               {/if}
               <p class="text-sm text-gray-600 mb-4">
                  Arahkan kamera ke QR code murid dengan format: NSID_Nama Lengkap
               </p>

               <!-- QR Scanner -->
               <div id="qr-reader" class="mb-4"></div>

               {#if isScanning}
                  <div class="flex items-center justify-center mb-4">
                     <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                     <span class="ml-2 text-sm text-gray-600">Memproses...</span>
                  </div>
               {/if}

               {#if scanError}
                  <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                     <p class="text-sm text-red-600">{scanError}</p>
                  </div>
               {/if}

               {#if scanResult && scanResult.success}
                  <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                     <div class="flex items-center mb-2">
                        <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <p class="text-sm font-medium text-green-800">Absensi Berhasil!</p>
                     </div>
                     <p class="text-sm text-green-700">{scanResult.message}</p>
                     {#if scanResult.student}
                        <div class="mt-2 text-xs text-green-600">
                           <p>NSID: {scanResult.student.nipd}</p>
                           <p>Nama: {scanResult.student.nama}</p>
                           <p>Kelas: {scanResult.student.kelas}</p>
                        </div>
                     {/if}
                  </div>
               {/if}

               <div class="flex justify-center">
                  <button
                     class="px-6 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400"
                     on:click={closeQRScanner}
                  >
                     Tutup Scanner
                  </button>
               </div>
            </div>
         </div>
      </div>
   </div>
{/if}

