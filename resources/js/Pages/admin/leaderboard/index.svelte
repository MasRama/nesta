<script>
   import { router } from '@inertiajs/svelte';
   import { toast } from 'svelte-sonner';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';

   export let leaderboard = [];
   export let user;
   
   let isLoading = false;
   let currentSection = 'leaderboard';
   let selectedEntries = [];
   let selectAll = false;
   
   // Reactive statement to handle select all changes
   $: if (selectAll && leaderboard.length > 0) {
      selectedEntries = leaderboard.map(l => l.id);
   } else if (!selectAll && selectedEntries.length === leaderboard.length) {
      selectedEntries = [];
   }
   
   function createEntry() {
      router.visit('/admin/leaderboard/create');
   }
   
   function editEntry(id) {
      router.visit(`/admin/leaderboard/${id}/edit`);
   }
   
   async function deleteEntry(id, className) {
      if (confirm(`Apakah Anda yakin ingin menghapus leaderboard "${className}"?`)) {
         try {
            const response = await fetch(`/admin/leaderboard/${id}`, {
               method: 'DELETE',
               headers: {
                  'Content-Type': 'application/json',
               }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
               toast.success(`Leaderboard "${className}" berhasil dihapus`, {
                  duration: 3000,
                  position: 'top-right'
               });
               
               // Reload page to refresh data
               router.reload();
            } else {
               const errorMsg = result.error || result.message || 'Gagal menghapus entry';
               toast.error(errorMsg, {
                  duration: 5000,
                  position: 'top-right'
               });
            }
         } catch (error) {
            console.error('Error deleting entry:', error);
            toast.error('Gagal menghapus entry', {
               duration: 5000,
               position: 'top-right'
            });
         }
      }
   }
   
   function toggleEntrySelection(entryId) {
      if (selectedEntries.includes(entryId)) {
         selectedEntries = selectedEntries.filter(id => id !== entryId);
         selectAll = false;
      } else {
         selectedEntries = [...selectedEntries, entryId];
         selectAll = selectedEntries.length === leaderboard.length - 1 ? true : selectAll;
      }
   }
   
   async function bulkDeleteEntries() {
      if (selectedEntries.length === 0) {
         toast.warning('Pilih entry yang ingin dihapus', {
            duration: 3000,
            position: 'top-right'
         });
         return;
      }
      
      if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedEntries.length} entry?`)) {
         return;
      }
      
      isLoading = true;
      try {
         const response = await fetch('/admin/leaderboard/bulk-delete', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify({ ids: selectedEntries })
         });
         
         const result = await response.json();
         
         if (response.ok) {
            toast.success(result.message, {
               duration: 3000,
               position: 'top-right'
            });
            selectedEntries = [];
            selectAll = false;
            router.reload();
         } else {
            toast.error(result.error || 'Gagal menghapus entry', {
               duration: 5000,
               position: 'top-right'
            });
         }
      } catch (error) {
         console.error('Error bulk deleting entries:', error);
         toast.error('Gagal menghapus entry', {
            duration: 5000,
            position: 'top-right'
         });
      } finally {
         isLoading = false;
      }
   }
   
   function formatDate(timestamp) {
      return new Date(parseInt(timestamp)).toLocaleDateString('id-ID');
   }

   // Get rank with medal
   function getRankBadge(index) {
      if (index === 0) return '🥇';
      if (index === 1) return '🥈';
      if (index === 2) return '🥉';
      return `#${index + 1}`;
   }
</script>

<svelte:head>
   <title>Leaderboard - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-100">
   <AdminHeader {user} />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <div class="mb-8 fade-in-up">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Leaderboard Kelas</h2>
            <p class="text-gray-600">Kelola ranking kelas berdasarkan poin prestasi</p>
         </div>

         <!-- Enhanced Actions Bar -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-8 border border-yellow-200/30 fade-in-up stagger-1">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
               <!-- Info -->
               <div class="text-sm text-gray-600">
                  Total: <span class="font-bold text-gray-900">{leaderboard.length}</span> kelas terdaftar
               </div>

               <!-- Action Buttons -->
               <div class="flex flex-wrap gap-3">
                  <button
                     on:click={createEntry}
                     class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium flex items-center space-x-2 whitespace-nowrap"
                  >
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                     </svg>
                     <span>Tambah Entry</span>
                  </button>
                  {#if selectedEntries.length > 0}
                     <button
                        on:click={bulkDeleteEntries}
                        disabled={isLoading}
                        class="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg font-medium flex items-center space-x-2 disabled:opacity-50 whitespace-nowrap"
                     >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        <span>Hapus Terpilih ({selectedEntries.length})</span>
                     </button>
                  {/if}
               </div>
            </div>
         </div>

         <!-- Enhanced Leaderboard Table -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-yellow-200/30 fade-in-up stagger-2">
            <div class="overflow-x-auto">
               <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gradient-to-r from-yellow-50 to-amber-50">
                     <tr>
                        <th class="px-6 py-4 text-left w-16">
                           <input
                              type="checkbox"
                              bind:checked={selectAll}
                              class="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2 cursor-pointer"
                           />
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ranking</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Kelas</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Poin</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deskripsi</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dibuat</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Aksi</th>
                     </tr>
                  </thead>
                  <tbody class="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                     {#each leaderboard as entry, index}
                        <tr class="hover:bg-yellow-50/50 transition-colors duration-200" style="animation-delay: {index * 0.05}s">
                           <td class="px-6 py-4 whitespace-nowrap w-16">
                              <input
                                 type="checkbox"
                                 checked={selectedEntries.includes(entry.id)}
                                 on:change={() => toggleEntrySelection(entry.id)}
                                 class="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2 cursor-pointer"
                              />
                           </td>
                           <td class="px-6 py-4 whitespace-nowrap">
                              <span class="text-2xl font-bold">{getRankBadge(index)}</span>
                           </td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{entry.class_name}</td>
                           <td class="px-6 py-4 whitespace-nowrap">
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300">
                                 {entry.points} pts
                              </span>
                           </td>
                           <td class="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                              {entry.description || '-'}
                           </td>
                           <td class="px-6 py-4 whitespace-nowrap">
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {entry.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                 {entry.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                           </td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(entry.created_at)}</td>
                           <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                              <button
                                 on:click={() => editEntry(entry.id)}
                                 class="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                 <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                 </svg>
                                 Edit
                              </button>
                              <button
                                 on:click={() => deleteEntry(entry.id, entry.class_name)}
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

   /* Table Row Animation */
   tbody tr {
      animation: fadeInUp 0.4s ease-out;
   }
</style>
