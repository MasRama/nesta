<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';

   export let subjects = [];
   export let total = 0;
   export let page = 1;
   export let limit = 10;
   export let totalPages = 1;
   export let filters = {};
   export let user;
   
   let isLoading = false;
   let searchQuery = filters.search || '';
   let currentSection = 'subjects';
   
   function handleSearch() {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', '1');
      
      router.visit(`/admin/subjects?${params.toString()}`);
   }
   
   function handlePageChange(newPage) {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', newPage.toString());
      
      router.visit(`/admin/subjects?${params.toString()}`);
   }
   
   function createSubject() {
      router.visit('/admin/subjects/create');
   }
   
   function editSubject(id) {
      router.visit(`/admin/subjects/${id}/edit`);
   }
   
   function viewSubject(id) {
      router.visit(`/admin/subjects/${id}`);
   }
   
   function assignTeachers(id) {
      router.visit(`/admin/subjects/${id}/assign-teachers`);
   }
   
   function assignClasses(id) {
      router.visit(`/admin/subjects/${id}/assign-classes`);
   }
   
   function deleteSubject(id, name) {
      if (confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${name}"?`)) {
         router.delete(`/admin/subjects/${id}`, {
            onSuccess: () => {
               router.reload();
            }
         });
      }
   }
</script>

<svelte:head>
   <title>Manajemen Mata Pelajaran - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
   <AdminHeader {user} />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <div class="mb-8 fade-in-up">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Data Mata Pelajaran</h2>
            <p class="text-gray-600">Kelola data mata pelajaran dan assignment guru dengan fitur CRUD operations</p>
         </div>

         <!-- Enhanced Actions Bar -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-8 border border-green-200/30 fade-in-up stagger-1">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
               <!-- Search -->
               <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div class="relative">
                     <svg class="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                     </svg>
                     <input
                        type="text"
                        placeholder="Cari mata pelajaran..."
                        bind:value={searchQuery}
                        on:keydown={(e) => e.key === 'Enter' && handleSearch()}
                        class="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                     />
                  </div>
                  <button
                     on:click={handleSearch}
                     class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                     </svg>
                     <span>Cari</span>
                  </button>
               </div>
               
               <!-- Action Buttons -->
               <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                     on:click={createSubject}
                     class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 font-medium"
                  >
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                     </svg>
                     <span>Tambah Mata Pelajaran</span>
                  </button>
               </div>
            </div>
         </div>

         <!-- Enhanced Data Table -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-green-200/30 fade-in-up stagger-2">
            <!-- Table Header -->
            <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
               <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-white flex items-center space-x-2">
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                     </svg>
                     <span>Daftar Mata Pelajaran ({total} total)</span>
                  </h3>
                  <div class="text-green-100 text-sm">
                     Halaman {page} dari {totalPages}
                  </div>
               </div>
            </div>
            
            <div class="overflow-x-auto">
               <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gradient-to-r from-green-50 to-emerald-50">
                     <tr>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kode</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Mata Pelajaran</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deskripsi</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                     </tr>
                  </thead>
                  <tbody class="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                     {#if subjects.length === 0}
                        <tr>
                           <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                              <div class="flex flex-col items-center space-y-3">
                                 <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                 </svg>
                                 <p class="text-lg font-medium">Belum ada mata pelajaran</p>
                                 <p class="text-sm">Klik tombol "Tambah Mata Pelajaran" untuk menambah data</p>
                              </div>
                           </td>
                        </tr>
                     {:else}
                        {#each subjects as subject, index}
                           <tr class="hover:bg-green-50/50 transition-colors duration-200" style="animation-delay: {index * 0.05}s">
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.kode}</td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{subject.nama}</td>
                              <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                 {subject.deskripsi || '-'}
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {subject.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    {subject.is_active ? 'Aktif' : 'Tidak Aktif'}
                                 </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                 <button
                                    on:click={() => viewSubject(subject.id)}
                                    class="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                 >
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                    Lihat
                                 </button>
                                 <button
                                    on:click={() => assignTeachers(subject.id)}
                                    class="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                                 >
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                    Guru
                                 </button>
                                 <button
                                    on:click={() => assignClasses(subject.id)}
                                    class="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                                 >
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                    </svg>
                                    Kelas
                                 </button>
                                 <button
                                    on:click={() => editSubject(subject.id)}
                                    class="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                 >
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                    Edit
                                 </button>
                                 <button
                                    on:click={() => deleteSubject(subject.id, subject.nama)}
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
                     {/if}
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
                           <span class="font-semibold text-gray-900">{total}</span> mata pelajaran
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
                                 class:from-green-600={page === pageNum}
                                 class:to-emerald-600={page === pageNum}
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
      </div>
   </main>
</div>

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