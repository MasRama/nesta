<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';
   import { teacherAPI, showToast } from '../../../utils/api.js';
   import { onMount } from 'svelte';


   export let user;

   // Local state for data management
   let teachers = [];
   let total = 0;
   let page = 1;
   let limit = 10;
   let totalPages = 1;
   let searchQuery = '';
   let isLoading = false;
   let currentSection = 'teachers'; // Tab navigation state
   let showImportModal = false;
   let csvFile = null;
   let importResult = null;

   // Load teachers data on component mount
   onMount(() => {
      loadTeachers();
   });

   // Function to load teachers data via API
   async function loadTeachers() {
      try {
         isLoading = true;
         const params = {
            page,
            limit,
            search: searchQuery || undefined
         };

         const response = await teacherAPI.getAll(params);
         const result = response.data;

         teachers = result.data || [];
         total = result.pagination?.total || 0;
         totalPages = result.pagination?.totalPages || 1;

      } catch (error) {
         console.error('Error loading teachers:', error);
         showToast.error('Gagal memuat data guru');
      } finally {
         isLoading = false;
      }
   }

   // Handle search with real-time data refresh
   async function handleSearch() {
      page = 1; // Reset to first page
      await loadTeachers();
   }

   // Handle pagination with real-time data refresh
   async function handlePageChange(newPage) {
      page = newPage;
      await loadTeachers();
   }

   // Navigate to create teacher page
   function createTeacher() {
      router.visit('/admin/teachers/create');
   }

   // Navigate to edit teacher page
   function editTeacher(id) {
      router.visit(`/admin/teachers/${id}/edit`);
   }

   // Delete teacher with axios and real-time refresh
   async function deleteTeacher(id, name) {
      if (confirm(`Apakah Anda yakin ingin menghapus guru "${name}"?`)) {
         try {
            const loadingToast = showToast.loading('Menghapus guru...');

            await teacherAPI.delete(id);

            showToast.dismiss(loadingToast);
            showToast.success('Guru berhasil dihapus');

            // Refresh data after successful deletion
            await loadTeachers();

         } catch (error) {
            console.error('Error deleting teacher:', error);
            showToast.error('Gagal menghapus guru');
         }
      }
   }

   // Utility function for date formatting
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }

   function exportCSV() {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      
      window.open(`/admin/teachers/export-csv?${params.toString()}`);
   }

   function downloadTemplate() {
      window.open('/admin/teachers/template-csv');
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
            
            const response = await fetch('/admin/teachers/import-csv', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  'X-Inertia': 'true'
               },
               body: JSON.stringify({ csvContent })
            });
            
            const result = await response.json();
            importResult = result;

            if (result.success > 0) {
               showToast.success(result.message);
               // Close modal after successful import
               setTimeout(() => {
                  showImportModal = false;
                  importResult = null;
                  csvFile = null;
                  loadTeachers();
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
</script>

<svelte:head>
   <title>Manajemen Guru - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <AdminHeader {user} title="Manajemen Guru" subtitle="Portal Manajemen NETSA" />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <div class="mb-8 fade-in-up">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Data Guru</h2>
            <p class="text-gray-600">Kelola data guru dengan operasi CRUD lengkap</p>
         </div>

         <!-- Enhanced Actions Bar -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-8 border border-blue-200/30 fade-in-up stagger-1">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
               <!-- Search and Filter -->
               <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div class="relative">
                     <svg class="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                     </svg>
                     <input
                        type="text"
                        placeholder="Cari guru..."
                        bind:value={searchQuery}
                        on:keydown={(e) => e.key === 'Enter' && handleSearch()}
                        class="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                     />
                  </div>

                  <button
                     on:click={handleSearch}
                     disabled={isLoading}
                     class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                     {#if isLoading}
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                     {:else}
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                     {/if}
                     <span>Cari</span>
                  </button>
               </div>

               <!-- Action Buttons -->
               <div class="flex flex-col sm:flex-row gap-3">
                  <!-- Primary Actions -->
                  <div class="flex flex-wrap gap-3">
                     <button
                        on:click={createTeacher}
                        class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium flex items-center space-x-2"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span>Tambah Guru</span>
                     </button>
                     <button
                        on:click={() => showImportModal = true}
                        class="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium flex items-center space-x-2 whitespace-nowrap"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                        </svg>
                        <span class="hidden sm:inline">Import</span>
                     </button>
                     <button
                        on:click={exportCSV}
                        class="px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg font-medium flex items-center space-x-2 whitespace-nowrap"
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

         <!-- Enhanced Data Table -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-blue-200/30 fade-in-up stagger-2">
            <!-- Table Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
               <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-white flex items-center space-x-2">
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                     </svg>
                     <span>Daftar Guru ({total} total)</span>
                  </h3>
                  <div class="text-blue-100 text-sm">
                     Halaman {page} dari {totalPages}
                  </div>
               </div>
            </div>

            {#if isLoading}
               <!-- Loading State -->
               <div class="flex items-center justify-center py-12">
                  <div class="text-center">
                     <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                     <p class="text-gray-600">Memuat data guru...</p>
                  </div>
               </div>
            {:else if teachers.length > 0}
               <!-- Table Content -->
               <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-blue-200/30">
                     <thead class="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <tr>
                           <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">NIP</th>
                           <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nama</th>
                           <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                           <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                           <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                           <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi</th>
                        </tr>
                     </thead>
                     <tbody class="bg-white/70 divide-y divide-blue-100/50">
                        {#each teachers as teacher}
                           <tr class="table-row-enhanced hover:bg-blue-50/50 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{teacher.nip}</td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{teacher.nama}</td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.email}</td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.phone || '-'}</td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                 <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm {teacher.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    {teacher.is_active ? 'Aktif' : 'Tidak Aktif'}
                                 </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                 <div class="flex items-center space-x-2">
                                    <button
                                       on:click={() => editTeacher(teacher.id)}
                                       class="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                                    >
                                       <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                       </svg>
                                       Edit
                                    </button>
                                    <button
                                       on:click={() => deleteTeacher(teacher.id, teacher.nama)}
                                       class="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                                    >
                                       <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                       </svg>
                                       Hapus
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        {/each}
                     </tbody>
                  </table>
               </div>

               <!-- Enhanced Pagination -->
               {#if totalPages > 1}
                  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-t border-blue-200/30">
                     <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-700">
                           Menampilkan <span class="font-medium">{((page - 1) * limit) + 1}</span> sampai 
                           <span class="font-medium">{Math.min(page * limit, total)}</span> dari 
                           <span class="font-medium">{total}</span> guru
                        </div>
                        <div class="flex items-center space-x-2">
                           <button
                              on:click={() => handlePageChange(page - 1)}
                              disabled={page <= 1 || isLoading}
                              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           >
                              Sebelumnya
                           </button>
                           
                           {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                              const startPage = Math.max(1, page - 2);
                              return startPage + i;
                           }) as pageNum}
                              {#if pageNum <= totalPages}
                                 <button
                                    on:click={() => handlePageChange(pageNum)}
                                    disabled={isLoading}
                                    class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed {pageNum === page ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}"
                                 >
                                    {pageNum}
                                 </button>
                              {/if}
                           {/each}
                           
                           <button
                              on:click={() => handlePageChange(page + 1)}
                              disabled={page >= totalPages || isLoading}
                              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           >
                              Selanjutnya
                           </button>
                        </div>
                     </div>
                  </div>
               {/if}
            {:else}
               <!-- Empty State -->
               <div class="text-center py-16">
                  <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada data guru</h3>
                  <p class="text-gray-500 mb-6">Mulai dengan menambahkan guru pertama Anda.</p>
                  <button
                     on:click={createTeacher}
                     class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium"
                  >
                     <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                     </svg>
                     Tambah Guru Pertama
                  </button>
               </div>
            {/if}
         </div>
      </div>
   </main>
</div>

<!-- Import Modal -->
{#if showImportModal}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
         <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Import Data Guru dari CSV</h3>
            
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
            
            <div class="mb-4">
               <button
                  on:click={downloadTemplate}
                  class="text-sm text-blue-600 hover:text-blue-800 underline"
               >
                  Download Template CSV
               </button>
            </div>
            
            {#if importResult}
               <div class="mb-4 p-3 rounded-md" class:bg-green-50={importResult.success > 0} class:bg-red-50={importResult.errors?.length > 0}>
                  <p class="text-sm font-medium" class:text-green-800={importResult.success > 0} class:text-red-800={importResult.errors?.length > 0}>
                     {importResult.message}
                  </p>
                  {#if importResult.duplicates?.length > 0}
                     <p class="text-sm text-yellow-700 mt-1">
                        ⚠️ Data yang sudah ada: {importResult.duplicates.join(', ')}
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

   /* Enhanced Animations */
   .fade-in-up {
      animation: fadeInUp 0.6s ease-out;
   }

   .stagger-1 {
      animation-delay: 0.1s;
   }

   .stagger-2 {
      animation-delay: 0.2s;
   }

   .table-row-enhanced {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   }

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

   /* Enhanced hover effects */
   .table-row-enhanced:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
   }
</style>