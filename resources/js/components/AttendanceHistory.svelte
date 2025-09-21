<script>
   import { onMount } from 'svelte';
   
   export let user;
   
   let attendanceHistory = [];
   let subjectStats = [];
   let subjects = [];
   let loading = false;
   let error = null;
   
   // Filter states
   let selectedSubject = '';
   let startDate = '';
   let endDate = '';
   let currentPage = 1;
   let limit = 20;
   
   // Pagination
   let pagination = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
   };
   
   // Set default date range (last 3 months)
   onMount(() => {
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      endDate = today.toISOString().split('T')[0];
      startDate = threeMonthsAgo.toISOString().split('T')[0];
      
      loadStudentSubjects();
      loadAttendanceHistory();
      loadSubjectStats();
   });
   
   async function loadStudentSubjects() {
      try {
         const response = await fetch(`/api/attendance/student/${user.id}/subjects`);
         const data = await response.json();
         
         if (response.ok) {
            subjects = data.subjects;
         } else {
            console.error('Error loading subjects:', data.error);
         }
      } catch (err) {
         console.error('Error loading subjects:', err);
      }
   }
   
   async function loadAttendanceHistory() {
      loading = true;
      error = null;

      try {
         const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: limit.toString()
         });

         if (selectedSubject) params.append('subject_id', selectedSubject);
         if (startDate) params.append('start_date', startDate);
         if (endDate) params.append('end_date', endDate);

         const response = await fetch(`/api/attendance/student/${user.id}/history?${params}`, {
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
   
   async function loadSubjectStats() {
      try {
         const params = new URLSearchParams();
         if (startDate) params.append('start_date', startDate);
         if (endDate) params.append('end_date', endDate);
         
         const response = await fetch(`/api/attendance/student/${user.id}/stats-by-subject?${params}`);
         const data = await response.json();
         
         if (response.ok) {
            subjectStats = data.stats;
         } else {
            console.error('Error loading subject stats:', data.error);
         }
      } catch (err) {
         console.error('Error loading subject stats:', err);
      }
   }
   
   function handleFilterChange() {
      currentPage = 1;
      loadAttendanceHistory();
      loadSubjectStats();
   }
   
   function handlePageChange(page) {
      currentPage = page;
      loadAttendanceHistory();
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
   
   function formatTime(timeString) {
      if (!timeString) return '-';
      return new Date(timeString).toLocaleTimeString('id-ID', {
         hour: '2-digit',
         minute: '2-digit'
      });
   }
   
   function getStatusColor(status) {
      switch (status) {
         case 'present': return 'text-green-600 bg-green-100 border-green-200';
         case 'absent': return 'text-red-600 bg-red-100 border-red-200';
         case 'late': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
         case 'excused': return 'text-blue-600 bg-blue-100 border-blue-200';
         default: return 'text-gray-600 bg-gray-100 border-gray-200';
      }
   }
   
   function getStatusText(status) {
      switch (status) {
         case 'present': return 'Hadir';
         case 'absent': return 'Tidak Hadir';
         case 'late': return 'Terlambat';
         case 'excused': return 'Izin';
         default: return status;
      }
   }
   
   function resetFilters() {
      selectedSubject = '';
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      endDate = today.toISOString().split('T')[0];
      startDate = threeMonthsAgo.toISOString().split('T')[0];
      currentPage = 1;
      
      handleFilterChange();
   }
</script>

<div class="space-y-8">
   <!-- Header -->
   <div class="flex items-center justify-between">
      <div>
         <h2 class="text-3xl font-bold text-gray-900">Riwayat Kehadiran</h2>
         <p class="text-gray-600 mt-2">Lihat riwayat kehadiran Anda secara detail</p>
      </div>
   </div>

   <!-- Statistics Cards -->
   {#if subjectStats.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {#each subjectStats as stat}
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
               <div class="flex items-center justify-between mb-4">
                  <div>
                     <h3 class="text-lg font-semibold text-gray-900">{stat.subject_name}</h3>
                     <p class="text-sm text-gray-500">{stat.subject_code}</p>
                  </div>
                  <div class="text-right">
                     <div class="text-2xl font-bold text-blue-600">{stat.percentage}%</div>
                     <div class="text-xs text-gray-500">Kehadiran</div>
                  </div>
               </div>
               <div class="grid grid-cols-4 gap-2 text-center">
                  <div class="bg-green-50 rounded-lg p-2">
                     <div class="text-sm font-semibold text-green-600">{stat.present || 0}</div>
                     <div class="text-xs text-green-500">Hadir</div>
                  </div>
                  <div class="bg-red-50 rounded-lg p-2">
                     <div class="text-sm font-semibold text-red-600">{stat.absent || 0}</div>
                     <div class="text-xs text-red-500">Tidak</div>
                  </div>
                  <div class="bg-yellow-50 rounded-lg p-2">
                     <div class="text-sm font-semibold text-yellow-600">{stat.late || 0}</div>
                     <div class="text-xs text-yellow-500">Telat</div>
                  </div>
                  <div class="bg-blue-50 rounded-lg p-2">
                     <div class="text-sm font-semibold text-blue-600">{stat.excused || 0}</div>
                     <div class="text-xs text-blue-500">Izin</div>
                  </div>
               </div>
            </div>
         {/each}
      </div>
   {/if}

   <!-- Filters -->
   <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Filter Riwayat</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
               class="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
               Reset Filter
            </button>
         </div>
      </div>
   </div>

   <!-- Attendance History Table -->
   <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
         <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Riwayat Kehadiran</h3>
            <div class="text-sm text-gray-500">
               Total: {pagination.total} record
            </div>
         </div>
      </div>

      {#if loading}
         <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Memuat data...</span>
         </div>
      {:else if error}
         <div class="flex items-center justify-center py-12">
            <div class="text-center">
               <div class="text-red-600 mb-2">
                  <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
               </div>
               <p class="text-gray-600">{error}</p>
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
               <div class="text-gray-400 mb-4">
                  <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
               </div>
               <p class="text-gray-600">Tidak ada data kehadiran ditemukan</p>
               <p class="text-sm text-gray-500 mt-1">Coba ubah filter atau rentang tanggal</p>
            </div>
         </div>
      {:else}
         <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
               <thead class="bg-gray-50">
                  <tr>
                     <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                     <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                     <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                     <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                     <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                     <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                  </tr>
               </thead>
               <tbody class="bg-white divide-y divide-gray-200">
                  {#each attendanceHistory as record}
                     <tr class="hover:bg-gray-50 transition-colors duration-150">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                           {formatDate(record.attendance_date)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                           <div class="text-sm font-medium text-gray-900">{record.subject_name || '-'}</div>
                           <div class="text-sm text-gray-500">{record.subject_code || '-'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                           <div class="text-sm font-medium text-gray-900">{record.class_name}</div>
                           <div class="text-sm text-gray-500">Kelas {record.grade_level}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                           <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border {getStatusColor(record.status)}">
                              {getStatusText(record.status)}
                           </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {formatTime(record.scanned_at)}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                           {record.notes || '-'}
                        </td>
                     </tr>
                  {/each}
               </tbody>
            </table>
         </div>

         <!-- Pagination -->
         {#if pagination.totalPages > 1}
            <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
               <div class="flex items-center justify-between">
                  <div class="flex-1 flex justify-between sm:hidden">
                     <button
                        on:click={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        Sebelumnya
                     </button>
                     <button
                        on:click={() => handlePageChange(currentPage + 1)}
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
                           <span class="font-medium">{((currentPage - 1) * limit) + 1}</span>
                           sampai
                           <span class="font-medium">{Math.min(currentPage * limit, pagination.total)}</span>
                           dari
                           <span class="font-medium">{pagination.total}</span>
                           hasil
                        </p>
                     </div>
                     <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                           <button
                              on:click={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage <= 1}
                              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <span class="sr-only">Sebelumnya</span>
                              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                 <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                              </svg>
                           </button>

                           {#each Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                              const start = Math.max(1, currentPage - 2);
                              return start + i;
                           }).filter(page => page <= pagination.totalPages) as page}
                              <button
                                 on:click={() => handlePageChange(page)}
                                 class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {page === currentPage ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}"
                              >
                                 {page}
                              </button>
                           {/each}

                           <button
                              on:click={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= pagination.totalPages}
                              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <span class="sr-only">Selanjutnya</span>
                              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                 <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                              </svg>
                           </button>
                        </nav>
                     </div>
                  </div>
               </div>
            </div>
         {/if}
      {/if}
   </div>
</div>
