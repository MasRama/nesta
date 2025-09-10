<script>
   import { router } from '@inertiajs/svelte';
   
   export let students = [];
   export let total = 0;
   export let page = 1;
   export let limit = 10;
   export let totalPages = 1;
   export let classes = [];
   export let filters = {};
   export let user;
   
   let isLoading = false;
   let searchQuery = filters.search || '';
   let selectedClass = filters.kelas || '';
   let showImportModal = false;
   let csvFile = null;
   let importResult = null;
   let currentSection = 'students'; // Tab navigation state
   
   function handleSearch() {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedClass) params.set('kelas', selectedClass);
      params.set('page', '1');
      
      router.visit(`/admin/students?${params.toString()}`);
   }
   
   function handlePageChange(newPage) {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedClass) params.set('kelas', selectedClass);
      params.set('page', newPage.toString());
      
      router.visit(`/admin/students?${params.toString()}`);
   }
   
   function createStudent() {
      router.visit('/admin/students/create');
   }
   
   function editStudent(id) {
      router.visit(`/admin/students/${id}/edit`);
   }
   
   function deleteStudent(id, name) {
      if (confirm(`Apakah Anda yakin ingin menghapus siswa "${name}"?`)) {
         router.delete(`/admin/students/${id}`, {
            onSuccess: () => {
               router.reload();
            }
         });
      }
   }
   
   function exportCSV() {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedClass) params.set('kelas', selectedClass);
      
      window.open(`/admin/students/export-csv?${params.toString()}`);
   }
   
   function downloadTemplate() {
      window.open('/admin/students/template-csv');
   }
   
   function handleFileSelect(event) {
      csvFile = event.target.files[0];
   }
   
   async function importCSV() {
      if (!csvFile) {
         alert('Pilih file CSV terlebih dahulu');
         return;
      }
      
      isLoading = true;
      const reader = new FileReader();
      
      reader.onload = async (e) => {
         try {
            const csvContent = e.target.result;
            
            const response = await fetch('/admin/students/import-csv', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  'X-Inertia': 'true'
               },
               body: JSON.stringify({ csvContent })
            });
            
            const result = await response.json();
            importResult = result;

            // Debug logging
            console.log('Import result:', result);

            if (result.success > 0) {
               // Close modal after successful import
               setTimeout(() => {
                  showImportModal = false;
                  importResult = null;
                  csvFile = null;
                  router.reload();
               }, 2000);
            }
         } catch (error) {
            console.error('Error importing CSV:', error);
            alert('Gagal mengimport file CSV');
         } finally {
            isLoading = false;
         }
      };
      
      reader.readAsText(csvFile);
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
   
   function logout() {
      router.post('/logout');
   }
   
   function navigateToSection(section) {
      currentSection = section;
      if (section === 'overview') {
         router.visit('/dashboard/admin');
      } else if (section === 'users') {
         // TODO: Navigate to users management when available
         console.log('Navigate to users management');
      } else if (section === 'classes') {
         // TODO: Navigate to classes management when available
         console.log('Navigate to classes management');
      } else if (section === 'reports') {
         // TODO: Navigate to reports when available
         console.log('Navigate to reports');
      } else if (section === 'system') {
         // TODO: Navigate to system settings when available
         console.log('Navigate to system settings');
      }
   }
</script>

<svelte:head>
   <title>Manajemen Siswa - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
               class:bg-gradient-to-r={currentSection === 'users'}
               class:from-blue-600={currentSection === 'users'}
               class:to-blue-700={currentSection === 'users'}
               class:text-white={currentSection === 'users'}
               class:shadow-lg={currentSection === 'users'}
               class:bg-gray-100={currentSection !== 'users'}
               class:text-gray-700={currentSection !== 'users'}
               class:hover:bg-gray-200={currentSection !== 'users'}
               on:click={() => navigateToSection('users')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                  <span>Manajemen User</span>
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
            <button
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'classes'}
               class:from-green-600={currentSection === 'classes'}
               class:to-emerald-600={currentSection === 'classes'}
               class:text-white={currentSection === 'classes'}
               class:shadow-lg={currentSection === 'classes'}
               class:bg-gray-100={currentSection !== 'classes'}
               class:text-gray-700={currentSection !== 'classes'}
               class:hover:bg-gray-200={currentSection !== 'classes'}
               on:click={() => navigateToSection('classes')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <span>Manajemen Kelas</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'reports'}
               class:from-purple-600={currentSection === 'reports'}
               class:to-pink-600={currentSection === 'reports'}
               class:text-white={currentSection === 'reports'}
               class:shadow-lg={currentSection === 'reports'}
               class:bg-gray-100={currentSection !== 'reports'}
               class:text-gray-700={currentSection !== 'reports'}
               class:hover:bg-gray-200={currentSection !== 'reports'}
               on:click={() => navigateToSection('reports')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>Laporan</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'system'}
               class:from-yellow-600={currentSection === 'system'}
               class:to-orange-600={currentSection === 'system'}
               class:text-white={currentSection === 'system'}
               class:shadow-lg={currentSection === 'system'}
               class:bg-gray-100={currentSection !== 'system'}
               class:text-gray-700={currentSection !== 'system'}
               class:hover:bg-gray-200={currentSection !== 'system'}
               on:click={() => navigateToSection('system')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>Sistem</span>
               </div>
            </button>
         </div>
      </div>
   </nav>

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <div class="mb-8 fade-in-up">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Data Siswa</h2>
            <p class="text-gray-600">Kelola data siswa dengan fitur import/export CSV dan CRUD operations</p>
         </div>

         <!-- Enhanced Actions Bar -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-8 border border-red-200/30 fade-in-up stagger-1">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
               <!-- Search and Filter -->
               <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div class="relative">
                     <svg class="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                     </svg>
                     <input
                        type="text"
                        placeholder="Cari siswa..."
                        bind:value={searchQuery}
                        on:keydown={(e) => e.key === 'Enter' && handleSearch()}
                        class="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                     />
                  </div>
                  <select
                     bind:value={selectedClass}
                     on:change={handleSearch}
                     class="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                     <option value="">Semua Kelas</option>
                     {#each classes as kelas}
                        <option value={kelas}>{kelas}</option>
                     {/each}
                  </select>
                  <button
                     on:click={handleSearch}
                     class="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg font-medium"
                  >
                     Cari
                  </button>
               </div>

               <!-- Action Buttons -->
               <div class="flex flex-wrap gap-3">
                  <button
                     on:click={createStudent}
                     class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium"
                  >
                     <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span>Tambah Siswa</span>
                     </div>
                  </button>
                  <button
                     on:click={() => showImportModal = true}
                     class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg font-medium"
                  >
                     <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                        </svg>
                        <span>Import CSV</span>
                     </div>
                  </button>
                  <button
                     on:click={exportCSV}
                     class="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg font-medium"
                  >
                     <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <span>Export CSV</span>
                     </div>
                  </button>
                  <button
                     on:click={downloadTemplate}
                     class="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg font-medium"
                  >
                     <div class="flex items-center space-x-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Template CSV</span>
                     </div>
                  </button>
               </div>
            </div>
         </div>

         <!-- Enhanced Students Table -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-red-200/30 fade-in-up stagger-2">
            <div class="overflow-x-auto">
               <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gradient-to-r from-red-50 to-rose-50">
                     <tr>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NIPD</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kelas</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tempat Lahir</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tanggal Lahir</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jenis Kelamin</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                     </tr>
                  </thead>
                  <tbody class="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                     {#each students as student, index}
                        <tr class="hover:bg-red-50/50 transition-colors duration-200" style="animation-delay: {index * 0.05}s">
                           <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.nipd}</td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{student.nama}</td>
                           <td class="px-6 py-4 whitespace-nowrap">
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                 {student.kelas}
                              </span>
                           </td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.tempat_lahir}</td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(student.tanggal_lahir)}</td>
                           <td class="px-6 py-4 whitespace-nowrap">
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {student.jenis_kelamin === 'Laki - Laki' ? 'bg-green-100 text-green-800' : 'bg-pink-100 text-pink-800'}">
                                 {student.jenis_kelamin}
                              </span>
                           </td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                              <button
                                 on:click={() => editStudent(student.id)}
                                 class="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                 <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                 </svg>
                                 Edit
                              </button>
                              <button
                                 on:click={() => deleteStudent(student.id, student.nama)}
                                 class="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                 <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                 </svg>
                                 Hapus
                              </button>
                           </td>
                        </tr>
                     {/each}
                  </tbody>
               </table>
            </div>
         
         <!-- Pagination -->
         {#if totalPages > 1}
            <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
               <div class="flex-1 flex justify-between sm:hidden">
                  <button
                     on:click={() => handlePageChange(page - 1)}
                     disabled={page <= 1}
                     class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                     Previous
                  </button>
                  <button
                     on:click={() => handlePageChange(page + 1)}
                     disabled={page >= totalPages}
                     class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                     Next
                  </button>
               </div>
               <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                     <p class="text-sm text-gray-700">
                        Menampilkan <span class="font-medium">{((page - 1) * limit) + 1}</span> sampai 
                        <span class="font-medium">{Math.min(page * limit, total)}</span> dari 
                        <span class="font-medium">{total}</span> siswa
                     </p>
                  </div>
                  <div>
                     <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        {#each Array(totalPages) as _, i}
                           <button
                              on:click={() => handlePageChange(i + 1)}
                              class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                              class:bg-blue-50={page === i + 1}
                              class:border-blue-500={page === i + 1}
                              class:text-blue-600={page === i + 1}
                              class:bg-white={page !== i + 1}
                              class:border-gray-300={page !== i + 1}
                              class:text-gray-500={page !== i + 1}
                              class:hover:bg-gray-50={page !== i + 1}
                           >
                              {i + 1}
                           </button>
                        {/each}
                     </nav>
                  </div>
               </div>
            </div>
         {/if}
      </div>
   </main>
</div>

<!-- Import Modal -->
{#if showImportModal}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
         <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Import Data Siswa dari CSV</h3>
            
            <div class="mb-4">
               <label for="csv-file" class="block text-sm font-medium text-gray-700 mb-2">Pilih File CSV</label>
               <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  on:change={handleFileSelect}
                  class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
               />
            </div>
            
            {#if importResult}
               <div class="mb-4 p-3 rounded-md" class:bg-green-50={importResult.success > 0} class:bg-red-50={importResult.errors?.length > 0}>
                  <p class="text-sm font-medium" class:text-green-800={importResult.success > 0} class:text-red-800={importResult.errors?.length > 0}>
                     {importResult.message}
                  </p>
                  {#if importResult.duplicates?.length > 0}
                     <p class="text-sm text-yellow-700 mt-1">
                        NIPD yang sudah ada: {importResult.duplicates.join(', ')}
                     </p>
                  {/if}
                  {#if importResult.errors?.length > 0}
                     <div class="mt-2 max-h-32 overflow-y-auto">
                        {#each importResult.errors.slice(0, 5) as error}
                           <p class="text-xs text-red-600">Baris {error.row}: {error.message}</p>
                        {/each}
                        {#if importResult.errors.length > 5}
                           <p class="text-xs text-red-600">... dan {importResult.errors.length - 5} error lainnya</p>
                        {/if}
                     </div>
                  {/if}
               </div>
            {/if}
            
            <div class="flex justify-end space-x-3">
               <button
                  on:click={() => { showImportModal = false; importResult = null; csvFile = null; }}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
               >
                  Batal
               </button>
               <button
                  on:click={importCSV}
                  disabled={!csvFile || isLoading}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
               >
                  {isLoading ? 'Mengimport...' : 'Import'}
               </button>
            </div>
         </div>
      </div>
   </div>
{/if}

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

   /* Table Row Animation */
   tbody tr {
      animation: fadeInUp 0.4s ease-out;
   }

   /* Enhanced Button Hover Effects */
   button {
      position: relative;
      overflow: hidden;
   }

   button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: width 0.3s ease, height 0.3s ease;
   }

   button:hover::before {
      width: 300px;
      height: 300px;
   }

   /* Enhanced Navigation Button Styles */
   .nav-btn-enhanced {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(8px);
      border: 1px solid transparent;
   }

   .nav-btn-enhanced:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.2);
   }

   .nav-btn-enhanced:active {
      transform: translateY(0);
   }

   /* Gradient Animation */
   .nav-btn-enhanced.bg-gradient-to-r {
      background-size: 200% 200%;
      animation: gradientShift 3s ease infinite;
   }

   @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
   }

   /* Ripple Effect */
   .nav-btn-enhanced::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
   }

   .nav-btn-enhanced:active::before {
      width: 300px;
      height: 300px;
   }

   /* Modern Glass Effect */
   nav {
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(209, 213, 219, 0.3);
   }

   /* Smooth Scroll Behavior */
   html {
      scroll-behavior: smooth;
   }

   /* Enhanced Shadow for Active Navigation */
   .nav-btn-enhanced.shadow-lg {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   }
</style>
