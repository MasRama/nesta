<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   import DarkModeToggle from '../../Components/DarkModeToggle.svelte';
   
   export let user;
   export let stats = {};
   
   let currentSection = 'overview';
   let isLoading = false;
   
   // Additional state for admin functions
   let users = [];
   let classes = [];
   let systemLogs = [];
   let students = [];

   function navigateToSection(section) {
      currentSection = section;
      if (section === 'students') {
         loadStudents();
      }
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
   
   async function loadUsers() {
      isLoading = true;
      try {
         // TODO: Implement user management API
         console.log('Loading users...');
      } catch (error) {
         console.error('Error loading users:', error);
      } finally {
         isLoading = false;
      }
   }

   async function loadStudents() {
      isLoading = true;
      try {
         // Navigate to students management page
         router.visit('/admin/students');
      } catch (error) {
         console.error('Error loading students:', error);
      } finally {
         isLoading = false;
      }
   }
   
   async function loadClasses() {
      isLoading = true;
      try {
         // TODO: Implement class management API
         console.log('Loading classes...');
      } catch (error) {
         console.error('Error loading classes:', error);
      } finally {
         isLoading = false;
      }
   }
   
   async function loadSystemLogs() {
      isLoading = true;
      try {
         // TODO: Implement system logs API
         console.log('Loading system logs...');
      } catch (error) {
         console.error('Error loading system logs:', error);
      } finally {
         isLoading = false;
      }
   }
   
   function createNewUser() {
      router.visit('/admin/users/create');
   }
   
   function createNewClass() {
      router.visit('/admin/classes/create');
   }
   
   function runSeeder() {
      if (confirm('Apakah Anda yakin ingin menjalankan seeder? Ini akan menghapus semua data existing.')) {
         // TODO: Implement seeder endpoint
         alert('Seeder akan dijalankan (belum diimplementasi)');
      }
   }
</script>



<svelte:head>
   <title>Dashboard Admin - NETSA</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
   <!-- Modern Material Design Header -->
   <header class="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 shadow-xl relative overflow-hidden header-enhanced">
      <!-- Background Pattern -->
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
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
               </div>
               <div>
                  <h1 class="text-2xl font-bold text-white">Dashboard Administrator</h1>
                  <p class="text-red-100 text-sm">Portal Manajemen NETSA</p>
               </div>
            </div>
            <div class="flex items-center space-x-6">
               <div class="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <span class="text-white font-medium">Selamat datang, {user.name}</span>
                  <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm font-medium">
                     👑
                  </div>
               </div>
               <div class="flex items-center space-x-3">
                  <div class="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30">
                     <DarkModeToggle />
                  </div>
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
   <nav class="bg-white/90 backdrop-blur-md border-b border-red-200/30 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex space-x-2 py-4">
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'overview'}
               class:from-red-600={currentSection === 'overview'}
               class:to-rose-600={currentSection === 'overview'}
               class:text-white={currentSection === 'overview'}
               class:shadow-lg={currentSection === 'overview'}
               class:bg-gray-100={currentSection !== 'overview'}
               class:text-gray-700={currentSection !== 'overview'}
               class:hover:bg-gray-200={currentSection !== 'overview'}
               on:click={() => navigateToSection('overview')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <span>Ringkasan</span>
               </div>
            </button>
            <button
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'students'}
               class:from-teal-600={currentSection === 'students'}
               class:to-cyan-600={currentSection === 'students'}
               class:text-white={currentSection === 'students'}
               class:shadow-lg={currentSection === 'students'}
               class:bg-gray-100={currentSection !== 'students'}
               class:text-gray-700={currentSection !== 'students'}
               class:hover:bg-gray-200={currentSection !== 'students'}
               on:click={() => navigateToSection('students')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  </svg>
                  <span>Manajemen Siswa</span>
               </div>
            </button>
         </div>
      </div>
   </nav>

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      {#if currentSection === 'overview'}
         <!-- Overview Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="mb-8 fade-in-up">
               <h2 class="text-3xl font-bold text-gray-900 mb-2">Ringkasan Sistem</h2>
               <p class="text-gray-600">Dashboard overview untuk monitoring sistem NETSA</p>
            </div>
               
            <!-- Enhanced Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               <div class="stats-card-enhanced bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-xl fade-in-up stagger-1">
                  <div class="p-6">
                     <div class="flex items-center justify-between">
                        <div>
                           <p class="text-blue-100 text-sm font-medium">Total Siswa</p>
                           <p class="text-3xl font-bold mt-2">{stats.total_students?.count || 0}</p>
                           <div class="flex items-center mt-2 text-blue-100 text-xs">
                              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                 <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                              </svg>
                              Siswa aktif
                           </div>
                        </div>
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                           <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                           </svg>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="stats-card-enhanced bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl shadow-xl fade-in-up stagger-2">
                  <div class="p-6">
                     <div class="flex items-center justify-between">
                        <div>
                           <p class="text-green-100 text-sm font-medium">Total Guru</p>
                           <p class="text-3xl font-bold mt-2">{stats.total_teachers?.count || 0}</p>
                           <div class="flex items-center mt-2 text-green-100 text-xs">
                              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                 <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                              </svg>
                              Tenaga pengajar
                           </div>
                        </div>
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                           <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                           </svg>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="stats-card-enhanced bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl shadow-xl fade-in-up stagger-3">
                  <div class="p-6">
                     <div class="flex items-center justify-between">
                        <div>
                           <p class="text-purple-100 text-sm font-medium">Total Orang Tua</p>
                           <p class="text-3xl font-bold mt-2">{stats.total_parents?.count || 0}</p>
                           <div class="flex items-center mt-2 text-purple-100 text-xs">
                              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                 <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                              </svg>
                              Wali murid
                           </div>
                        </div>
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                           <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                           </svg>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="stats-card-enhanced bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl shadow-xl fade-in-up stagger-4">
                  <div class="p-6">
                     <div class="flex items-center justify-between">
                        <div>
                           <p class="text-orange-100 text-sm font-medium">Total Kelas</p>
                           <p class="text-3xl font-bold mt-2">{stats.total_classes?.count || 0}</p>
                           <div class="flex items-center mt-2 text-orange-100 text-xs">
                              <div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                              Kelas aktif
                           </div>
                        </div>
                        <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                           <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                           </svg>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Enhanced Quick Actions -->
            <div class="content-card-enhanced bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl mb-8 border border-white/20 fade-in-up">
               <div class="px-8 py-8">
                  <div class="flex items-center mb-6">
                     <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                     </div>
                     <div>
                        <h3 class="text-2xl font-bold text-gray-900">Aksi Cepat</h3>
                        <p class="text-gray-600 text-sm">Shortcut untuk fungsi-fungsi utama sistem</p>
                     </div>
                  </div>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                     <button 
                        on:click={createNewUser}
                        class="btn-pulse group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3"
                     >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span>Tambah User</span>
                     </button>
                     <button 
                        on:click={createNewClass}
                        class="btn-pulse group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3"
                     >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                        <span>Buat Kelas</span>
                     </button>
                     <button 
                        on:click={() => navigateToSection('reports')}
                        class="btn-pulse group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3"
                     >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Lihat Laporan</span>
                     </button>
                     <button 
                        on:click={runSeeder}
                        class="btn-pulse group bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3"
                     >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        <span>Run Seeder</span>
                     </button>
                  </div>
               </div>
            </div>

            <!-- Enhanced System Overview -->
            <div class="content-card-enhanced bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl border border-white/20 fade-in-up">
               <div class="px-8 py-8">
                  <div class="flex items-center mb-6">
                     <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                        </svg>
                     </div>
                     <div>
                        <h3 class="text-2xl font-bold text-gray-900">Informasi Sistem</h3>
                        <p class="text-gray-600 text-sm">Detail teknis dan spesifikasi platform NETSA</p>
                     </div>
                  </div>
                  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                     <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200/50">
                        <div class="flex items-center mb-3">
                           <div class="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                              </svg>
                           </div>
                           <dt class="text-sm font-semibold text-blue-900">Versi Sistem</dt>
                        </div>
                        <dd class="text-lg font-bold text-blue-800">NETSA v1.0.0</dd>
                     </div>
                     <div class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200/50">
                        <div class="flex items-center mb-3">
                           <div class="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
                              </svg>
                           </div>
                           <dt class="text-sm font-semibold text-green-900">Database</dt>
                        </div>
                        <dd class="text-lg font-bold text-green-800">SQLite3 + Knex</dd>
                     </div>
                     <div class="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 border border-purple-200/50">
                        <div class="flex items-center mb-3">
                           <div class="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center mr-3">
                              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                              </svg>
                           </div>
                           <dt class="text-sm font-semibold text-purple-900">Frontend</dt>
                        </div>
                        <dd class="text-lg font-bold text-purple-800">Svelte 5 + Inertia.js</dd>
                     </div>
                     <div class="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl p-6 border border-orange-200/50">
                        <div class="flex items-center mb-3">
                           <div class="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
                              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
                              </svg>
                           </div>
                           <dt class="text-sm font-semibold text-orange-900">Backend</dt>
                        </div>
                        <dd class="text-lg font-bold text-orange-800">HyperExpress + TypeScript</dd>
                     </div>
                  </div>
               </div>
            </div>
         </div>

      {:else if currentSection === 'students'}
         <!-- Students Management Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <div class="flex justify-between items-center mb-4">
                     <h3 class="text-lg leading-6 font-medium text-gray-900">Manajemen Siswa</h3>
                     <button 
                        on:click={() => router.visit('/admin/students')}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                     >
                        Kelola Data Siswa
                     </button>
                  </div>
                  <div class="text-center py-8">
                     <p class="text-gray-500">Klik tombol di atas untuk mengelola data siswa secara lengkap.</p>
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>

<style>
	/* Global Transitions */
	* {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Enhanced Header Animations */
	.header-enhanced {
		transition: all 0.4s ease;
		position: relative;
		overflow: hidden;
	}

	.header-enhanced::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transition: left 0.8s ease;
	}

	.header-enhanced:hover::before {
		left: 100%;
	}

	/* Navigation Button Enhancements */
	.nav-btn-enhanced {
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.nav-btn-enhanced::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		transition: all 0.4s ease;
		transform: translate(-50%, -50%);
		z-index: 0;
	}

	.nav-btn-enhanced:hover::before {
		width: 300px;
		height: 300px;
	}

	.nav-btn-enhanced:hover {
		transform: translateY(-2px) scale(1.05);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	}

	.nav-btn-enhanced > * {
		position: relative;
		z-index: 1;
	}

	/* Stats Card Enhancements */
	.stats-card-enhanced {
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.stats-card-enhanced::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
		transition: transform 0.6s ease;
		transform: scale(0);
		z-index: 0;
	}

	.stats-card-enhanced:hover::before {
		transform: scale(1);
	}

	.stats-card-enhanced:hover {
		transform: translateY(-10px) rotate(2deg) scale(1.02);
	}

	.stats-card-enhanced:nth-child(even):hover {
		transform: translateY(-10px) rotate(-2deg) scale(1.02);
	}

	.stats-card-enhanced > * {
		position: relative;
		z-index: 1;
	}

	/* Content Card Enhancements */
	.content-card-enhanced {
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.content-card-enhanced::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
		transform: translateX(-100%);
		transition: transform 0.6s ease;
	}

	.content-card-enhanced:hover::after {
		transform: translateX(100%);
	}

	.content-card-enhanced:hover {
		transform: translateY(-8px) scale(1.03);
	}

	/* Button Pulse Effect */
	.btn-pulse {
		position: relative;
		overflow: hidden;
	}

	.btn-pulse::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		transition: all 0.4s ease;
		transform: translate(-50%, -50%);
	}

	.btn-pulse:hover::before {
		width: 300px;
		height: 300px;
	}

	/* Fade In Animation */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.fade-in-up {
		animation: fadeInUp 0.6s ease-out;
	}

	/* Stagger Animation */
	.stagger-1 { animation-delay: 0.1s; }
	.stagger-2 { animation-delay: 0.2s; }
	.stagger-3 { animation-delay: 0.3s; }
	.stagger-4 { animation-delay: 0.4s; }

	/* Custom styles for admin dashboard */
	.admin-gradient {
		background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
	}
</style>