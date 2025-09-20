<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   
   export let user;
   export let classes = [];
   export let journals = [];
   export let exams = [];
   
   let currentSection = 'overview';
   let showQRCode = false;
   let qrCodeData = null;
   let selectedClass = null;
   let showSubjectSelection = false;
   let availableSubjects = [];
   let selectedSubject = null;
   let pendingClassId = null;
   
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
   
   async function generateQRCode(classId, subjectId = null) {
      if (!subjectId) {
         // First, get available subjects for this class
         await showSubjectSelectionModal(classId);
         return;
      }

      try {
         const response = await fetch('/api/attendance/generate-qr', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               class_id: classId,
               subject_id: subjectId,
               duration_minutes: 30
            })
         });

         if (response.ok) {
            const data = await response.json();
            qrCodeData = data;
            showQRCode = true;
            selectedClass = classes.find(c => c.id === classId);
            selectedSubject = availableSubjects.find(s => s.id === subjectId);
            closeSubjectSelection();
         } else {
            const errorData = await response.json();
            alert(errorData.error || 'Gagal membuat QR code absensi');
         }
      } catch (error) {
         console.error('Error generating QR code:', error);
         alert('Terjadi kesalahan saat membuat QR code');
      }
   }

   async function showSubjectSelectionModal(classId) {
      try {
         pendingClassId = classId;
         const response = await fetch(`/api/attendance/subjects/${classId}`);

         if (response.ok) {
            const data = await response.json();
            availableSubjects = data.subjects;

            if (availableSubjects.length === 0) {
               alert('Tidak ada mata pelajaran yang tersedia untuk absensi saat ini. Pastikan Anda memiliki jadwal mengajar hari ini.');
               return;
            }

            showSubjectSelection = true;
         } else {
            const errorData = await response.json();
            alert(errorData.error || 'Gagal mengambil data mata pelajaran');
         }
      } catch (error) {
         console.error('Error getting subjects:', error);
         alert('Terjadi kesalahan saat mengambil data mata pelajaran');
      }
   }

   function closeSubjectSelection() {
      showSubjectSelection = false;
      availableSubjects = [];
      selectedSubject = null;
      pendingClassId = null;
   }

   function selectSubjectAndGenerate(subjectId) {
      if (pendingClassId) {
         generateQRCode(pendingClassId, subjectId);
      }
   }
   
   function closeQRCode() {
      showQRCode = false;
      qrCodeData = null;
      selectedClass = null;
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
   .stagger-4 { animation-delay: 0.4s; }

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
                  <img src={user.profile_image || '/images/default-avatar.png'} alt="Profile" class="h-10 w-10 rounded-full border-2 border-white/30">
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
               class:bg-gradient-to-r={currentSection === 'classes'}
               class:from-blue-600={currentSection === 'classes'}
               class:to-indigo-600={currentSection === 'classes'}
               class:text-white={currentSection === 'classes'}
               class:shadow-lg={currentSection === 'classes'}
               class:text-gray-600={currentSection !== 'classes'}
               class:hover:bg-blue-50={currentSection !== 'classes'}
               on:click={() => navigateToSection('classes')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <span>Kelas</span>
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
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
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
                           <h3 class="text-white/80 text-sm font-medium mb-1">Kelas Diampu</h3>
                           <p class="text-3xl font-bold text-white">{classes.length}</p>
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

               <div class="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-4">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">ID Guru</h3>
                           <p class="text-3xl font-bold text-white">{user.teacher_id || '-'}</p>
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
                        class="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        on:click={() => navigateToSection('attendance')}
                     >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="relative flex flex-col items-center justify-center space-y-3">
                           <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"/>
                           </svg>
                           <span class="text-sm font-medium">Buat QR Absensi</span>
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
                        on:click={() => navigateToSection('classes')}
                     >
                        <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="relative flex flex-col items-center justify-center space-y-3">
                           <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                           </svg>
                           <span class="text-sm font-medium">Kelola Kelas</span>
                        </div>
                     </button>
                  </div>
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

               <!-- Classes Card -->
               <div class="group bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 hover:shadow-3xl transition-all duration-500 fade-in-up stagger-3">
                  <div class="px-8 py-8">
                     <div class="flex items-center space-x-3 mb-6">
                        <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                           </svg>
                        </div>
                        <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Kelas Diampu</h3>
                     </div>
                     <div class="space-y-4">
                        {#each classes.slice(0, 5) as cls}
                           <div class="group/item bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 p-4 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-md">
                              <div class="flex items-center justify-between mb-2">
                                 <div class="flex-1">
                                    <p class="text-sm font-semibold text-gray-900 mb-1">{cls.name}</p>
                                    <p class="text-xs text-gray-600 flex items-center">
                                       <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                                       </svg>
                                       {cls.grade_level} - {cls.academic_year}
                                    </p>
                                 </div>
                                 <button class="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200">
                                    Kelola
                                 </button>
                              </div>
                              <!-- Mata Pelajaran yang Diampu -->
                              {#if cls.subjects && cls.subjects.length > 0}
                                 <div class="mt-2 space-y-1">
                                    {#each cls.subjects.slice(0, 2) as subject}
                                       <div class="flex items-center justify-between text-xs bg-white/50 rounded-lg px-2 py-1">
                                          <span class="font-medium text-gray-700">{subject.name}</span>
                                          <span class="text-gray-500">{subject.day} {subject.start_time}-{subject.end_time}</span>
                                       </div>
                                    {/each}
                                    {#if cls.subjects.length > 2}
                                       <div class="text-xs text-gray-500 text-center">+{cls.subjects.length - 2} mata pelajaran lainnya</div>
                                    {/if}
                                 </div>
                              {:else}
                                 <div class="mt-2 text-xs text-gray-500 italic">Belum ada mata pelajaran yang ditugaskan</div>
                              {/if}
                           </div>
                        {:else}
                           <p class="text-sm text-gray-500 text-center py-4">Belum ada kelas yang ditugaskan</p>
                        {/each}
                     </div>
                     <div class="mt-6">
                        <button class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 px-6 rounded-2xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300" on:click={() => navigateToSection('classes')}>
                           <span class="flex items-center justify-center space-x-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                              </svg>
                              <span>Lihat Semua Kelas</span>
                           </span>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'attendance'}
         <!-- Attendance Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="group bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 hover:shadow-3xl transition-all duration-500 fade-in-up">
               <div class="px-8 py-8">
                  <div class="flex items-center space-x-3 mb-8">
                     <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                     </div>
                     <h3 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Manajemen Absensi</h3>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {#each classes as cls}
                        <div class="group relative bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                           <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                           <div class="relative">
                              <div class="flex items-center justify-between mb-4">
                                 <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                    </svg>
                                 </div>
                                 <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-sm">
                                    {cls.grade_level}
                                 </span>
                              </div>
                              <h4 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{cls.name}</h4>
                              <p class="text-sm text-gray-600 mb-6">{cls.academic_year}</p>
                              <button 
                                 class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
                                 on:click={() => generateQRCode(cls.id)}
                              >
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"/>
                                 </svg>
                                 <span>Generate QR Code</span>
                              </button>
                           </div>
                        </div>
                     {:else}
                        <div class="col-span-full text-center py-16">
                           <div class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                              </svg>
                           </div>
                           <p class="text-lg font-medium text-gray-500 mb-2">Belum Ada Kelas</p>
                           <p class="text-sm text-gray-400">Anda belum mengampu kelas manapun</p>
                        </div>
                     {/each}
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

      {#if currentSection === 'classes'}
         <!-- Classes Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
               <div class="px-8 py-8 sm:p-10">
                  <div class="flex items-center space-x-3 mb-8">
                     <div class="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                     </div>
                     <h3 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Kelas yang Diampu</h3>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {#each classes as cls}
                        <div class="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group">
                           <div class="flex items-center justify-between mb-4">
                              <h4 class="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{cls.name}</h4>
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md">
                                 {cls.grade_level}
                              </span>
                           </div>
                           <p class="text-gray-600 mb-6 leading-relaxed">{cls.description || 'Tidak ada deskripsi'}</p>
                           <div class="space-y-3 mb-6">
                              <div class="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                 <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 13a2 2 0 002 2h6a2 2 0 002-2L16 7"></path>
                                    </svg>
                                    <span class="text-gray-600 font-medium">Tahun Akademik</span>
                                 </div>
                                 <span class="text-gray-900 font-bold">{cls.academic_year}</span>
                              </div>
                              <div class="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                                 <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                    <span class="text-gray-600 font-medium">Maks. Siswa</span>
                                 </div>
                                 <span class="text-gray-900 font-bold">{cls.max_students}</span>
                              </div>
                           </div>

                           <!-- Mata Pelajaran yang Diampu -->
                           {#if cls.subjects && cls.subjects.length > 0}
                              <div class="mb-6">
                                 <h5 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                    </svg>
                                    Mata Pelajaran
                                 </h5>
                                 <div class="space-y-2">
                                    {#each cls.subjects as subject}
                                       <div class="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-3">
                                          <div class="flex justify-between items-start">
                                             <div>
                                                <p class="font-medium text-gray-900">{subject.name}</p>
                                                <p class="text-xs text-gray-600">{subject.code}</p>
                                             </div>
                                             <div class="text-right">
                                                <p class="text-sm font-medium text-purple-600">{subject.day}</p>
                                                <p class="text-xs text-gray-500">{subject.start_time} - {subject.end_time}</p>
                                             </div>
                                          </div>
                                          {#if subject.notes}
                                             <p class="text-xs text-gray-500 mt-2 italic">{subject.notes}</p>
                                          {/if}
                                       </div>
                                    {/each}
                                 </div>
                              </div>
                           {:else}
                              <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                 <p class="text-sm text-yellow-700 text-center">Belum ada mata pelajaran yang ditugaskan untuk kelas ini</p>
                              </div>
                           {/if}
                           <div class="flex space-x-3">
                              <button class="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                                 </svg>
                                 <span>Kelola Siswa</span>
                              </button>
                              <button class="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                 </svg>
                                 <span>Jadwal</span>
                              </button>
                           </div>
                        </div>
                     {:else}
                        <div class="col-span-full text-center py-16">
                           <div class="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                              </svg>
                           </div>
                           <p class="text-lg text-gray-500 font-medium">Anda belum mengampu kelas manapun</p>
                           <p class="text-sm text-gray-400 mt-2">Hubungi administrator untuk mendapatkan akses kelas</p>
                        </div>
                     {/each}
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>

<!-- QR Code Modal -->
{#if showQRCode && qrCodeData}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
         <div class="mt-3 text-center">
            <h3 class="text-lg leading-6 font-medium text-gray-900">QR Code Absensi</h3>
            <div class="mt-2 space-y-1">
               <p class="text-sm text-gray-700 font-medium">Kelas: {selectedClass?.name}</p>
               {#if selectedSubject}
                  <p class="text-sm text-blue-600 font-medium">{selectedSubject.name} ({selectedSubject.code})</p>
                  <p class="text-xs text-gray-500">{selectedSubject.day} • {selectedSubject.start_time} - {selectedSubject.end_time}</p>
               {/if}
            </div>
            <div class="mt-4 flex justify-center">
               <img src={qrCodeData.qrCodeDataURL} alt="QR Code" class="w-64 h-64">
            </div>
            <p class="text-sm text-gray-500 mt-2">
               Berlaku hingga: {formatDateTime(qrCodeData.session.expires_at)}
            </p>
            <div class="items-center px-4 py-3">
               <button 
                  class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700"
                  on:click={closeQRCode}
               >
                  Tutup
               </button>
            </div>
         </div>
      </div>
   </div>
{/if}

<!-- Subject Selection Modal -->
{#if showSubjectSelection}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
         <div class="mt-3">
            <div class="flex items-center justify-between mb-4">
               <h3 class="text-lg font-medium text-gray-900">Pilih Mata Pelajaran</h3>
               <button
                  class="text-gray-400 hover:text-gray-600"
                  on:click={closeSubjectSelection}
               >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
               </button>
            </div>

            <p class="text-sm text-gray-600 mb-4">
               Pilih mata pelajaran yang sedang Anda ajarkan untuk membuat QR code absensi:
            </p>

            <div class="space-y-3 max-h-60 overflow-y-auto">
               {#each availableSubjects as subject}
                  <button
                     class="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                     on:click={() => selectSubjectAndGenerate(subject.id)}
                  >
                     <div class="flex justify-between items-start">
                        <div>
                           <p class="font-medium text-gray-900">{subject.name}</p>
                           <p class="text-sm text-gray-600">{subject.code}</p>
                        </div>
                        <div class="text-right">
                           <p class="text-sm font-medium text-blue-600">{subject.day}</p>
                           <p class="text-xs text-gray-500">{subject.start_time} - {subject.end_time}</p>
                        </div>
                     </div>
                  </button>
               {/each}
            </div>

            <div class="mt-4 pt-4 border-t border-gray-200">
               <button
                  class="w-full px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors duration-200"
                  on:click={closeSubjectSelection}
               >
                  Batal
               </button>
            </div>
         </div>
      </div>
   </div>
{/if}