<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';

   
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
</script>

<svelte:head>
   <title>Manajemen Siswa - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100">
   <AdminHeader {user} />
   <AdminNavigation {currentSection} />

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
               <div class="flex flex-col sm:flex-row gap-3">
                  <!-- Primary Actions -->
                  <div class="flex gap-3">
                     <button
                        on:click={createStudent}
                        class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium flex items-center space-x-2"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span>Tambah Siswa</span>
                     </button>
                  </div>
                  
                  <!-- Secondary Actions -->
                  <div class="flex gap-2">
                     <button
                        on:click={() => showImportModal = true}
                        class="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium flex items-center space-x-2"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                        </svg>
                        <span class="hidden sm:inline">Import</span>
                     </button>
                     <button
                        on:click={exportCSV}
                        class="px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg font-medium flex items-center space-x-2"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                        </svg>
                        <span class="hidden sm:inline">Export</span>
                     </button>
                  </div>
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
         
         <!-- Enhanced Pagination -->
         {#if totalPages > 1}
            <div class="bg-white/80 backdrop-blur-sm px-6 py-4 border-t border-gray-200/50 rounded-b-2xl">
               <!-- Mobile Pagination -->
               <div class="flex justify-between items-center sm:hidden">
                  <button
                     on:click={() => handlePageChange(page - 1)}
                     disabled={page <= 1}
                     class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                     <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                     </svg>
                     Sebelumnya
                  </button>
                  <span class="text-sm text-gray-600 font-medium">
                     {page} dari {totalPages}
                  </span>
                  <button
                     on:click={() => handlePageChange(page + 1)}
                     disabled={page >= totalPages}
                     class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                     Selanjutnya
                     <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                     </svg>
                  </button>
               </div>
               
               <!-- Desktop Pagination -->
               <div class="hidden sm:flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                     <p class="text-sm text-gray-600">
                        Menampilkan 
                        <span class="font-semibold text-gray-900">{((page - 1) * limit) + 1}</span> - 
                        <span class="font-semibold text-gray-900">{Math.min(page * limit, total)}</span> dari 
                        <span class="font-semibold text-gray-900">{total}</span> siswa
                     </p>
                  </div>
                  
                  <div class="flex items-center space-x-1">
                     <!-- Previous Button -->
                     <button
                        on:click={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        class="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                     </button>
                     
                     <!-- Page Numbers -->
                     <div class="flex space-x-1">
                        {#each Array(Math.min(totalPages, 7)) as _, i}
                           {@const pageNum = totalPages <= 7 ? i + 1 : 
                              page <= 4 ? i + 1 :
                              page >= totalPages - 3 ? totalPages - 6 + i :
                              page - 3 + i}
                           <button
                              on:click={() => handlePageChange(pageNum)}
                              class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                              class:bg-gradient-to-r={page === pageNum}
                              class:from-blue-600={page === pageNum}
                              class:to-indigo-600={page === pageNum}
                              class:text-white={page === pageNum}
                              class:shadow-lg={page === pageNum}
                              class:bg-white={page !== pageNum}
                              class:text-gray-700={page !== pageNum}
                              class:border={page !== pageNum}
                              class:border-gray-300={page !== pageNum}
                              class:hover:bg-gray-50={page !== pageNum}
                              class:hover:border-gray-400={page !== pageNum}
                           >
                              {pageNum}
                           </button>
                        {/each}
                     </div>
                     
                     <!-- Next Button -->
                     <button
                        on:click={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        class="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                     </button>
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

   /* Smooth Scroll Behavior */
   html {
      scroll-behavior: smooth;
   }
</style>
