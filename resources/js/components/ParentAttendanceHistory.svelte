<script>
   import { onMount } from 'svelte';

   export let user;

   // State variables
   let children = [];
   let attendanceHistory = [];
   let subjects = [];
   let statistics = {
      combined: { present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 },
      per_child: [],
      per_subject: []
   };
   
   // Filter and pagination state
   let selectedChild = '';
   let selectedSubject = '';
   let startDate = '';
   let endDate = '';
   let currentPage = 1;
   let limit = 20;
   let pagination = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
   };

   // UI state
   let loading = false;
   let error = null;
   let activeView = 'combined'; // 'combined' or 'individual'

   // Initialize component
   onMount(() => {
      loadChildren();
      loadSubjects();
      loadAttendanceHistory();
      loadStatistics();
   });

   // Load parent's children
   async function loadChildren() {
      try {
         const response = await fetch(`/api/attendance/parent/${user.id}/children`, {
            method: 'GET',
            headers: {
               'Accept': 'application/json',
               'Content-Type': 'application/json',
            },
         });

         if (response.ok) {
            const data = await response.json();
            children = data.children || [];
         } else {
            console.error('Failed to load children');
         }
      } catch (err) {
         console.error('Error loading children:', err);
      }
   }

   // Load subjects for all children
   async function loadSubjects() {
      try {
         const response = await fetch(`/api/attendance/parent/${user.id}/children/subjects`, {
            method: 'GET',
            headers: {
               'Accept': 'application/json',
               'Content-Type': 'application/json',
            },
         });

         if (response.ok) {
            const data = await response.json();
            subjects = data.subjects || [];
         } else {
            console.error('Failed to load subjects');
         }
      } catch (err) {
         console.error('Error loading subjects:', err);
      }
   }

   // Load attendance history
   async function loadAttendanceHistory() {
      loading = true;
      error = null;
      
      try {
         const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: limit.toString()
         });
         
         if (selectedChild) params.append('child_id', selectedChild);
         if (selectedSubject) params.append('subject_id', selectedSubject);
         if (startDate) params.append('start_date', startDate);
         if (endDate) params.append('end_date', endDate);
         
         const response = await fetch(`/api/attendance/parent/${user.id}/children/history?${params}`, {
            method: 'GET',
            headers: {
               'Accept': 'application/json',
               'Content-Type': 'application/json',
            },
         });
         
         if (!response.ok) {
            if (response.status === 403) {
               error = 'Anda tidak memiliki akses untuk melihat data ini';
            } else if (response.status === 404) {
               error = 'Data tidak ditemukan';
            } else if (response.status >= 500) {
               error = 'Terjadi kesalahan server. Silakan coba lagi nanti';
            } else {
               const data = await response.json();
               error = data.error || 'Gagal memuat riwayat kehadiran';
            }
            return;
         }
         
         const data = await response.json();
         attendanceHistory = data.data || [];
         pagination = data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
         };
         
      } catch (err) {
         if (err instanceof TypeError && err.message.includes('fetch')) {
            error = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda';
         } else {
            error = 'Terjadi kesalahan saat memuat data';
         }
         console.error('Error loading attendance history:', err);
      } finally {
         loading = false;
      }
   }

   // Load statistics
   async function loadStatistics() {
      try {
         const params = new URLSearchParams();
         
         if (selectedChild) params.append('child_id', selectedChild);
         if (startDate) params.append('start_date', startDate);
         if (endDate) params.append('end_date', endDate);
         
         const response = await fetch(`/api/attendance/parent/${user.id}/children/stats?${params}`, {
            method: 'GET',
            headers: {
               'Accept': 'application/json',
               'Content-Type': 'application/json',
            },
         });
         
         if (response.ok) {
            const data = await response.json();
            statistics = data.stats || {
               combined: { present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 },
               per_child: [],
               per_subject: []
            };
         }
      } catch (err) {
         console.error('Error loading statistics:', err);
      }
   }

   // Handle filter changes
   function handleFilterChange() {
      currentPage = 1;
      loadAttendanceHistory();
      loadStatistics();
   }

   // Handle pagination
   function goToPage(page) {
      currentPage = page;
      loadAttendanceHistory();
   }

   // Reset filters
   function resetFilters() {
      selectedChild = '';
      selectedSubject = '';
      startDate = '';
      endDate = '';
      currentPage = 1;
      handleFilterChange();
   }

   // Get status badge class
   function getStatusBadgeClass(status) {
      switch (status) {
         case 'present':
            return 'bg-green-100 text-green-800 border-green-200';
         case 'absent':
            return 'bg-red-100 text-red-800 border-red-200';
         case 'late':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
         case 'excused':
            return 'bg-blue-100 text-blue-800 border-blue-200';
         default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
      }
   }

   // Get status text
   function getStatusText(status) {
      switch (status) {
         case 'present': return 'Hadir';
         case 'absent': return 'Tidak Hadir';
         case 'late': return 'Terlambat';
         case 'excused': return 'Izin';
         default: return 'Tidak Diketahui';
      }
   }

   // Format date
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID', {
         weekday: 'long',
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });
   }

   // Format time
   function formatTime(timeString) {
      if (!timeString) return '-';
      return new Date(timeString).toLocaleTimeString('id-ID', {
         hour: '2-digit',
         minute: '2-digit'
      });
   }

   // Get child name by ID
   function getChildName(childId) {
      const child = children.find(c => c.user_id === childId);
      return child ? child.name : 'Tidak Diketahui';
   }
</script>

<div class="space-y-6">
   <!-- Header -->
   <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between">
         <div>
            <h2 class="text-2xl font-bold text-gray-900">Riwayat Kehadiran Anak</h2>
            <p class="text-gray-600 mt-1">Pantau kehadiran semua anak Anda dalam satu dashboard</p>
         </div>
         <div class="flex items-center space-x-3">
            <button
               class="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
               class:bg-blue-600={activeView === 'combined'}
               class:text-white={activeView === 'combined'}
               class:bg-gray-100={activeView !== 'combined'}
               class:text-gray-700={activeView !== 'combined'}
               on:click={() => activeView = 'combined'}
            >
               Gabungan
            </button>
            <button
               class="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
               class:bg-blue-600={activeView === 'individual'}
               class:text-white={activeView === 'individual'}
               class:bg-gray-100={activeView !== 'individual'}
               class:text-gray-700={activeView !== 'individual'}
               on:click={() => activeView = 'individual'}
            >
               Per Anak
            </button>
         </div>
      </div>
   </div>

   <!-- Statistics Cards -->
   {#if activeView === 'combined'}
      <!-- Combined Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
         <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
               <div class="p-2 bg-green-100 rounded-lg">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
               </div>
               <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Hadir</p>
                  <p class="text-2xl font-bold text-gray-900">{statistics.combined.present}</p>
               </div>
            </div>
         </div>
         
         <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
               <div class="p-2 bg-red-100 rounded-lg">
                  <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
               </div>
               <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Tidak Hadir</p>
                  <p class="text-2xl font-bold text-gray-900">{statistics.combined.absent}</p>
               </div>
            </div>
         </div>
         
         <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
               <div class="p-2 bg-yellow-100 rounded-lg">
                  <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
               </div>
               <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Terlambat</p>
                  <p class="text-2xl font-bold text-gray-900">{statistics.combined.late}</p>
               </div>
            </div>
         </div>
         
         <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
               <div class="p-2 bg-blue-100 rounded-lg">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
               </div>
               <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Izin</p>
                  <p class="text-2xl font-bold text-gray-900">{statistics.combined.excused}</p>
               </div>
            </div>
         </div>
         
         <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center">
               <div class="p-2 bg-purple-100 rounded-lg">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
               </div>
               <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Persentase</p>
                  <p class="text-2xl font-bold text-gray-900">{statistics.combined.percentage}%</p>
               </div>
            </div>
         </div>
      </div>
   {:else}
      <!-- Per Child Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {#each statistics.per_child as child}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-gray-900">{child.student_name}</h3>
                  <span class="text-sm text-gray-500">{child.kelas}</span>
               </div>
               
               <div class="space-y-3">
                  <div class="flex justify-between items-center">
                     <span class="text-sm text-gray-600">Persentase Kehadiran</span>
                     <span class="text-lg font-bold text-blue-600">{child.percentage}%</span>
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-2">
                     <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {child.percentage}%"></div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3 mt-4">
                     <div class="text-center">
                        <div class="text-lg font-bold text-green-600">{child.present}</div>
                        <div class="text-xs text-gray-600">Hadir</div>
                     </div>
                     <div class="text-center">
                        <div class="text-lg font-bold text-red-600">{child.absent}</div>
                        <div class="text-xs text-gray-600">Tidak Hadir</div>
                     </div>
                  </div>
               </div>
            </div>
         {/each}
      </div>
   {/if}

   <!-- Filters -->
   <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Filter Riwayat</h3>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
         <div>
            <label for="child-filter" class="block text-sm font-medium text-gray-700 mb-2">Pilih Anak</label>
            <select
               id="child-filter"
               bind:value={selectedChild}
               on:change={handleFilterChange}
               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
               <option value="">Semua Anak</option>
               {#each children as child}
                  <option value={child.user_id}>{child.name} ({child.kelas})</option>
               {/each}
            </select>
         </div>
         <div>
            <label for="subject-filter" class="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
            <select
               id="subject-filter"
               bind:value={selectedSubject}
               on:change={handleFilterChange}
               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
               <option value="">Semua Mata Pelajaran</option>
               {#each subjects as subject}
                  <option value={subject.id}>{subject.nama} ({subject.kode})</option>
               {/each}
            </select>
         </div>
         <div>
            <label for="start-date-filter" class="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
            <input
               id="start-date-filter"
               type="date"
               bind:value={startDate}
               on:change={handleFilterChange}
               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
         </div>
         <div>
            <label for="end-date-filter" class="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
            <input
               id="end-date-filter"
               type="date"
               bind:value={endDate}
               on:change={handleFilterChange}
               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
         </div>
         <div class="flex items-end">
            <button
               on:click={resetFilters}
               class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
            >
               Reset Filter
            </button>
         </div>
      </div>
   </div>

   <!-- Attendance History Table -->
   <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
         <h3 class="text-lg font-semibold text-gray-900">Riwayat Kehadiran</h3>
      </div>

      {#if loading}
         <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Memuat data...</span>
         </div>
      {:else if error}
         <div class="flex items-center justify-center py-12">
            <div class="text-center">
               <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
               </svg>
               <h3 class="mt-2 text-sm font-medium text-gray-900">Terjadi Kesalahan</h3>
               <p class="mt-1 text-sm text-gray-500">{error}</p>
               <button
                  on:click={loadAttendanceHistory}
                  class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
               >
                  Coba Lagi
               </button>
            </div>
         </div>
      {:else if attendanceHistory.length === 0}
         <div class="flex items-center justify-center py-12">
            <div class="text-center">
               <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
               </svg>
               <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak Ada Data</h3>
               <p class="mt-1 text-sm text-gray-500">Belum ada riwayat kehadiran untuk filter yang dipilih</p>
            </div>
         </div>
      {:else}
         <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
               <thead class="bg-gray-50">
                  <tr>
                     <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                     </th>
                     <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Anak
                     </th>
                     <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mata Pelajaran
                     </th>
                     <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kelas
                     </th>
                     <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                     </th>
                     <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waktu Scan
                     </th>
                     <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Catatan
                     </th>
                  </tr>
               </thead>
               <tbody class="bg-white divide-y divide-gray-200">
                  {#each attendanceHistory as record}
                     <tr class="hover:bg-gray-50 transition-colors duration-200">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {formatDate(record.attendance_date)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                           <div class="flex items-center">
                              <div class="text-sm font-medium text-gray-900">{record.student_name}</div>
                              <div class="text-sm text-gray-500 ml-2">({record.student_nipd})</div>
                           </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {record.subject_name || '-'}
                           {#if record.subject_code}
                              <span class="text-gray-500">({record.subject_code})</span>
                           {/if}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {record.class_name}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                           <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {getStatusBadgeClass(record.status)}">
                              {getStatusText(record.status)}
                           </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {formatTime(record.scanned_at)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {record.notes || '-'}
                        </td>
                     </tr>
                  {/each}
               </tbody>
            </table>
         </div>

         <!-- Pagination -->
         {#if pagination.totalPages > 1}
            <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
               <div class="flex-1 flex justify-between sm:hidden">
                  <button
                     on:click={() => goToPage(currentPage - 1)}
                     disabled={currentPage <= 1}
                     class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     Sebelumnya
                  </button>
                  <button
                     on:click={() => goToPage(currentPage + 1)}
                     disabled={currentPage >= pagination.totalPages}
                     class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     Selanjutnya
                  </button>
               </div>
               <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                     <p class="text-sm text-gray-700">
                        Menampilkan
                        <span class="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span>
                        sampai
                        <span class="font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span>
                        dari
                        <span class="font-medium">{pagination.total}</span>
                        hasil
                     </p>
                  </div>
                  <div>
                     <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                           on:click={() => goToPage(currentPage - 1)}
                           disabled={currentPage <= 1}
                           class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <span class="sr-only">Sebelumnya</span>
                           <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                           </svg>
                        </button>

                        {#each Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                           const start = Math.max(1, currentPage - 2);
                           return start + i;
                        }).filter(page => page <= pagination.totalPages) as page}
                           <button
                              on:click={() => goToPage(page)}
                              class="relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200"
                              class:border-blue-500={page === currentPage}
                              class:bg-blue-50={page === currentPage}
                              class:text-blue-600={page === currentPage}
                              class:border-gray-300={page !== currentPage}
                              class:bg-white={page !== currentPage}
                              class:text-gray-700={page !== currentPage}
                              class:hover:bg-gray-50={page !== currentPage}
                           >
                              {page}
                           </button>
                        {/each}

                        <button
                           on:click={() => goToPage(currentPage + 1)}
                           disabled={currentPage >= pagination.totalPages}
                           class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <span class="sr-only">Selanjutnya</span>
                           <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                           </svg>
                        </button>
                     </nav>
                  </div>
               </div>
            </div>
         {/if}
      {/if}
   </div>
</div>
