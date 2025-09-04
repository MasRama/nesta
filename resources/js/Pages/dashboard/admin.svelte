<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   
   export let user;
   export let stats = {};
   
   let currentSection = 'overview';
   let isLoading = false;
   
   // Additional state for admin functions
   let users = [];
   let classes = [];
   let systemLogs = [];
   
   function navigateToSection(section) {
      currentSection = section;
      if (section === 'users') {
         loadUsers();
      } else if (section === 'classes') {
         loadClasses();
      } else if (section === 'system') {
         loadSystemLogs();
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

<div class="min-h-screen bg-gray-50">
   <!-- Header -->
   <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex justify-between h-16">
            <div class="flex items-center">
               <h1 class="text-xl font-semibold text-gray-900">Dashboard Administrator</h1>
            </div>
            <div class="flex items-center space-x-4">
               <span class="text-sm text-gray-700">Selamat datang, {user.name}</span>
               <div class="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full text-sm font-medium">
                  👑
               </div>
               <button 
                  on:click={logout}
                  class="text-sm text-red-600 hover:text-red-800"
               >
                  Keluar
               </button>
            </div>
         </div>
      </div>
   </header>

   <!-- Navigation -->
   <nav class="bg-red-600 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex space-x-8">
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'overview'}
               class:border-transparent={currentSection !== 'overview'}
               on:click={() => navigateToSection('overview')}
            >
               Ringkasan
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'users'}
               class:border-transparent={currentSection !== 'users'}
               on:click={() => navigateToSection('users')}
            >
               Manajemen User
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'classes'}
               class:border-transparent={currentSection !== 'classes'}
               on:click={() => navigateToSection('classes')}
            >
               Manajemen Kelas
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'reports'}
               class:border-transparent={currentSection !== 'reports'}
               on:click={() => navigateToSection('reports')}
            >
               Laporan
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'system'}
               class:border-transparent={currentSection !== 'system'}
               on:click={() => navigateToSection('system')}
            >
               Sistem
            </button>
         </div>
      </div>
   </nav>

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {#if currentSection === 'overview'}
         <!-- Overview Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               <!-- Stats Cards -->
               <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                     <div class="flex items-center">
                        <div class="flex-shrink-0">
                           <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white text-sm font-medium">
                              👨‍🎓
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Total Siswa</dt>
                              <dd class="text-lg font-medium text-gray-900">{stats.total_students?.count || 0}</dd>
                           </dl>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                     <div class="flex items-center">
                        <div class="flex-shrink-0">
                           <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white text-sm font-medium">
                              👨‍🏫
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Total Guru</dt>
                              <dd class="text-lg font-medium text-gray-900">{stats.total_teachers?.count || 0}</dd>
                           </dl>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                     <div class="flex items-center">
                        <div class="flex-shrink-0">
                           <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center text-white text-sm font-medium">
                              👨‍👩‍👧‍👦
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Total Orang Tua</dt>
                              <dd class="text-lg font-medium text-gray-900">{stats.total_parents?.count || 0}</dd>
                           </dl>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                     <div class="flex items-center">
                        <div class="flex-shrink-0">
                           <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center text-white text-sm font-medium">
                              🏫
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Total Kelas</dt>
                              <dd class="text-lg font-medium text-gray-900">{stats.total_classes?.count || 0}</dd>
                           </dl>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white shadow rounded-lg mb-8">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">Aksi Cepat</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                     <button 
                        on:click={createNewUser}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                     >
                        Tambah User
                     </button>
                     <button 
                        on:click={createNewClass}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                     >
                        Buat Kelas
                     </button>
                     <button 
                        on:click={() => navigateToSection('reports')}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                     >
                        Lihat Laporan
                     </button>
                     <button 
                        on:click={runSeeder}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                     >
                        Run Seeder
                     </button>
                  </div>
               </div>
            </div>

            <!-- System Overview -->
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">Informasi Sistem</h3>
                  <div class="mt-4">
                     <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Versi Sistem</dt>
                           <dd class="mt-1 text-sm text-gray-900">NETSA v1.0.0</dd>
                        </div>
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Database</dt>
                           <dd class="mt-1 text-sm text-gray-900">SQLite3 + Knex</dd>
                        </div>
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Frontend</dt>
                           <dd class="mt-1 text-sm text-gray-900">Svelte 5 + Inertia.js</dd>
                        </div>
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Backend</dt>
                           <dd class="mt-1 text-sm text-gray-900">HyperExpress + TypeScript</dd>
                        </div>
                     </dl>
                  </div>
               </div>
            </div>
         </div>

      {:else if currentSection === 'users'}
         <!-- User Management Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <div class="flex justify-between items-center mb-4">
                     <h3 class="text-lg leading-6 font-medium text-gray-900">Manajemen User</h3>
                     <button 
                        on:click={createNewUser}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                     >
                        Tambah User Baru
                     </button>
                  </div>
                  <div class="text-center py-8">
                     <p class="text-gray-500">Fitur manajemen user akan segera tersedia</p>
                     <p class="text-sm text-gray-400 mt-2">Saat ini Anda dapat menggunakan seeder untuk membuat data user test</p>
                  </div>
               </div>
            </div>
         </div>

      {:else if currentSection === 'classes'}
         <!-- Class Management Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <div class="flex justify-between items-center mb-4">
                     <h3 class="text-lg leading-6 font-medium text-gray-900">Manajemen Kelas</h3>
                     <button 
                        on:click={createNewClass}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                     >
                        Buat Kelas Baru
                     </button>
                  </div>
                  <div class="text-center py-8">
                     <p class="text-gray-500">Fitur manajemen kelas akan segera tersedia</p>
                     <p class="text-sm text-gray-400 mt-2">Kelas dapat dilihat melalui seeder data yang sudah dibuat</p>
                  </div>
               </div>
            </div>
         </div>

      {:else if currentSection === 'reports'}
         <!-- Reports Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">Laporan Sistem</h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                     <div class="border rounded-lg p-4">
                        <h4 class="font-medium text-gray-900">Laporan Absensi</h4>
                        <p class="text-sm text-gray-500 mt-1">Laporan kehadiran siswa per kelas</p>
                        <button class="mt-2 text-sm text-blue-600 hover:text-blue-800">Lihat Laporan</button>
                     </div>
                     <div class="border rounded-lg p-4">
                        <h4 class="font-medium text-gray-900">Laporan Nilai</h4>
                        <p class="text-sm text-gray-500 mt-1">Laporan hasil ujian dan nilai siswa</p>
                        <button class="mt-2 text-sm text-blue-600 hover:text-blue-800">Lihat Laporan</button>
                     </div>
                     <div class="border rounded-lg p-4">
                        <h4 class="font-medium text-gray-900">Laporan Aktivitas</h4>
                        <p class="text-sm text-gray-500 mt-1">Laporan aktivitas pengguna sistem</p>
                        <button class="mt-2 text-sm text-blue-600 hover:text-blue-800">Lihat Laporan</button>
                     </div>
                  </div>
               </div>
            </div>
         </div>

      {:else if currentSection === 'system'}
         <!-- System Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">Pengaturan Sistem</h3>
                  <div class="mt-4 space-y-4">
                     <div class="border rounded-lg p-4">
                        <h4 class="font-medium text-gray-900">Database Seeder</h4>
                        <p class="text-sm text-gray-500 mt-1">Jalankan seeder untuk membuat data test</p>
                        <button 
                           on:click={runSeeder}
                           class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                        >
                           Run Seeder
                        </button>
                     </div>
                     <div class="border rounded-lg p-4">
                        <h4 class="font-medium text-gray-900">Backup Database</h4>
                        <p class="text-sm text-gray-500 mt-1">Backup data sistem (akan segera tersedia)</p>
                        <button 
                           disabled
                           class="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                        >
                           Backup (Segera)
                        </button>
                     </div>
                     <div class="border rounded-lg p-4">
                        <h4 class="font-medium text-gray-900">Log Sistem</h4>
                        <p class="text-sm text-gray-500 mt-1">Lihat log aktivitas sistem (akan segera tersedia)</p>
                        <button 
                           disabled
                           class="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                        >
                           Lihat Log (Segera)
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>

<style>
   /* Custom styles for admin dashboard */
   .admin-gradient {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
   }
</style>