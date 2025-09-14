<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';

   export let parents = [];
   export let total = 0;
   export let page = 1;
   export let limit = 10;
   export let totalPages = 1;
   export let filters = {};
   export let user;
   
   let isLoading = false;
   let searchQuery = filters.search || '';
   let currentSection = 'parents'; // Tab navigation state
   
   function handleSearch() {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', '1');
      
      router.visit(`/admin/parents?${params.toString()}`);
   }
   
   function handlePageChange(newPage) {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', newPage.toString());
      
      router.visit(`/admin/parents?${params.toString()}`);
   }
   
   function createParent() {
      router.visit('/admin/parents/create');
   }
   
   function viewParent(id) {
      router.visit(`/admin/parents/${id}`);
   }
   
   function editParent(id) {
      router.visit(`/admin/parents/${id}/edit`);
   }
   
   function deleteParent(id, name) {
      if (confirm(`Apakah Anda yakin ingin menghapus wali murid "${name}"?`)) {
         router.delete(`/admin/parents/${id}`, {
            onSuccess: () => {
               router.reload();
            }
         });
      }
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
</script>

<svelte:head>
   <title>Manajemen Wali Murid - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <AdminHeader {user} title="Manajemen Wali Murid" subtitle="Portal Manajemen NETSA" />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <div class="mb-8 fade-in-up">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Data Wali Murid</h2>
            <p class="text-gray-600">Kelola data wali murid dengan operasi CRUD lengkap</p>
         </div>

         <!-- Search and Actions -->
         <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 fade-in-up" style="animation-delay: 0.1s">
            <div class="p-6">
               <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div class="flex-1 max-w-md">
                     <div class="relative">
                        <input
                           type="text"
                           bind:value={searchQuery}
                           on:keydown={(e) => e.key === 'Enter' && handleSearch()}
                           placeholder="Cari nama, email, atau telepon..."
                           class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                        <svg class="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                     </div>
                  </div>
                  
                  <div class="flex gap-3">
                     <button
                        on:click={handleSearch}
                        class="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        Cari
                     </button>
                     
                     <button
                        on:click={createParent}
                        class="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Tambah Wali Murid
                     </button>
                  </div>
               </div>
            </div>
         </div>

         <!-- Data Table -->
         <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden fade-in-up" style="animation-delay: 0.2s">
            <div class="overflow-x-auto">
               <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                     <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Anak</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                     </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                     {#if parents.length === 0}
                        <tr>
                           <td colspan="6" class="px-6 py-12 text-center">
                              <div class="flex flex-col items-center justify-center text-gray-500">
                                 <svg class="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                 </svg>
                                 <h3 class="text-lg font-medium mb-2">Belum ada data wali murid</h3>
                                 <p class="text-sm">Klik tombol "Tambah Wali Murid" untuk menambah data</p>
                              </div>
                           </td>
                        </tr>
                     {:else}
                        {#each parents as parent, index}
                           <tr class="hover:bg-green-50/50 transition-colors duration-200" style="animation-delay: {index * 0.05}s">
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{parent.nama}</td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parent.email}</td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parent.phone || '-'}</td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {parent.student_count || 0} anak
                                 </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {parent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    {parent.is_active ? 'Aktif' : 'Tidak Aktif'}
                                 </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                 <button
                                    on:click={() => viewParent(parent.id)}
                                    class="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                 >
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                    Lihat
                                 </button>
                                 <button
                                    on:click={() => editParent(parent.id)}
                                    class="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                 >
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                    Edit
                                 </button>
                                 <button
                                    on:click={() => deleteParent(parent.id, parent.nama)}
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

            <!-- Pagination -->
            {#if totalPages > 1}
               <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div class="flex items-center justify-between">
                     <div class="flex-1 flex justify-between sm:hidden">
                        <button
                           on:click={() => handlePageChange(page - 1)}
                           disabled={page <= 1}
                           class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           Sebelumnya
                        </button>
                        <button
                           on:click={() => handlePageChange(page + 1)}
                           disabled={page >= totalPages}
                           class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           Selanjutnya
                        </button>
                     </div>
                     <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                           <p class="text-sm text-gray-700">
                              Menampilkan <span class="font-medium">{((page - 1) * limit) + 1}</span> sampai <span class="font-medium">{Math.min(page * limit, total)}</span> dari <span class="font-medium">{total}</span> hasil
                           </p>
                        </div>
                        <div>
                           <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                              <button
                                 on:click={() => handlePageChange(page - 1)}
                                 disabled={page <= 1}
                                 class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                 <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                 </svg>
                              </button>
                              
                              {#each Array.from({length: totalPages}, (_, i) => i + 1) as pageNum}
                                 {#if pageNum === page}
                                    <span class="relative inline-flex items-center px-4 py-2 border border-red-500 bg-red-50 text-sm font-medium text-red-600">
                                       {pageNum}
                                    </span>
                                 {:else if pageNum === 1 || pageNum === totalPages || (pageNum >= page - 2 && pageNum <= page + 2)}
                                    <button
                                       on:click={() => handlePageChange(pageNum)}
                                       class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                       {pageNum}
                                    </button>
                                 {:else if pageNum === page - 3 || pageNum === page + 3}
                                    <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                       ...
                                    </span>
                                 {/if}
                              {/each}
                              
                              <button
                                 on:click={() => handlePageChange(page + 1)}
                                 disabled={page >= totalPages}
                                 class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                 <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                                 </svg>
                              </button>
                           </nav>
                        </div>
                     </div>
                  </div>
               </div>
            {/if}
         </div>
      </div>
   </main>
</div>

<style>
   .fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
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
</style>
