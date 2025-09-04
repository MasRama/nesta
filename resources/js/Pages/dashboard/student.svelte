<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   
   export let user;
   export let classes = [];
   export let attendance = [];
   export let exams = [];
   
   let currentSection = 'overview';
   
   function navigateToSection(section) {
      currentSection = section;
   }
   
   function logout() {
      router.post('/logout');
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
   
   function getAttendancePercentage() {
      if (attendance.length === 0) return 0;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      return Math.round((presentCount / attendance.length) * 100);
   }
   
   function getStatusColor(status) {
      switch (status) {
         case 'present': return 'text-green-600 bg-green-100';
         case 'absent': return 'text-red-600 bg-red-100';
         case 'late': return 'text-yellow-600 bg-yellow-100';
         case 'excused': return 'text-blue-600 bg-blue-100';
         default: return 'text-gray-600 bg-gray-100';
      }
   }
</script>

<svelte:head>
   <title>Dashboard Siswa - NETSA</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
   <!-- Header -->
   <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex justify-between h-16">
            <div class="flex items-center">
               <h1 class="text-xl font-semibold text-gray-900">Dashboard Siswa</h1>
            </div>
            <div class="flex items-center space-x-4">
               <span class="text-sm text-gray-700">Selamat datang, {user.name}</span>
               <img src={user.profile_image || '/images/default-avatar.png'} alt="Profile" class="h-8 w-8 rounded-full">
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
   <nav class="bg-blue-600 text-white">
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
               class:border-white={currentSection === 'attendance'}
               class:border-transparent={currentSection !== 'attendance'}
               on:click={() => navigateToSection('attendance')}
            >
               Kehadiran
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'exams'}
               class:border-transparent={currentSection !== 'exams'}
               on:click={() => navigateToSection('exams')}
            >
               Ujian
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'classes'}
               class:border-transparent={currentSection !== 'classes'}
               on:click={() => navigateToSection('classes')}
            >
               Kelas
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
                              📚
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Total Kelas</dt>
                              <dd class="text-lg font-medium text-gray-900">{classes.length}</dd>
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
                              ✓
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Kehadiran</dt>
                              <dd class="text-lg font-medium text-gray-900">{getAttendancePercentage()}%</dd>
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
                              📝
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Ujian Mendatang</dt>
                              <dd class="text-lg font-medium text-gray-900">{exams.length}</dd>
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
                              🎯
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">ID Siswa</dt>
                              <dd class="text-lg font-medium text-gray-900">{user.student_id || '-'}</dd>
                           </dl>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <!-- Recent Attendance -->
               <div class="bg-white shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                     <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Kehadiran Terbaru</h3>
                     <div class="space-y-3">
                        {#each attendance.slice(0, 5) as item}
                           <div class="flex justify-between items-center">
                              <div>
                                 <p class="text-sm font-medium text-gray-900">{item.class_name}</p>
                                 <p class="text-sm text-gray-500">{formatDate(item.attendance_date)}</p>
                              </div>
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(item.status)}">
                                 {item.status}
                              </span>
                           </div>
                        {:else}
                           <p class="text-sm text-gray-500">Belum ada data kehadiran</p>
                        {/each}
                     </div>
                  </div>
               </div>

               <!-- Upcoming Exams -->
               <div class="bg-white shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                     <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Ujian Mendatang</h3>
                     <div class="space-y-3">
                        {#each exams.slice(0, 5) as exam}
                           <div class="border-l-4 border-blue-400 pl-4">
                              <div class="flex justify-between">
                                 <div>
                                    <p class="text-sm font-medium text-gray-900">{exam.title}</p>
                                    <p class="text-sm text-gray-500">Durasi: {exam.duration_minutes} menit</p>
                                 </div>
                                 <div class="text-right">
                                    <p class="text-sm text-gray-900">{formatDate(exam.start_time)}</p>
                                    <p class="text-xs text-gray-500">{new Date(exam.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</p>
                                 </div>
                              </div>
                           </div>
                        {:else}
                           <p class="text-sm text-gray-500">Tidak ada ujian mendatang</p>
                        {/each}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'attendance'}
         <!-- Attendance Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Riwayat Kehadiran</h3>
                  
                  <!-- Attendance Summary -->
                  <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                     <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center">
                           <div class="text-2xl font-bold text-green-600">{attendance.filter(a => a.status === 'present').length}</div>
                           <div class="text-sm text-gray-600">Hadir</div>
                        </div>
                        <div class="text-center">
                           <div class="text-2xl font-bold text-red-600">{attendance.filter(a => a.status === 'absent').length}</div>
                           <div class="text-sm text-gray-600">Tidak Hadir</div>
                        </div>
                        <div class="text-center">
                           <div class="text-2xl font-bold text-yellow-600">{attendance.filter(a => a.status === 'late').length}</div>
                           <div class="text-sm text-gray-600">Terlambat</div>
                        </div>
                        <div class="text-center">
                           <div class="text-2xl font-bold text-blue-600">{getAttendancePercentage()}%</div>
                           <div class="text-sm text-gray-600">Persentase</div>
                        </div>
                     </div>
                  </div>

                  <!-- Attendance List -->
                  <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                     <table class="min-w-full divide-y divide-gray-300">
                        <thead class="bg-gray-50">
                           <tr>
                              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Scan</th>
                           </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                           {#each attendance as item}
                              <tr>
                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.attendance_date)}</td>
                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.class_name}</td>
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(item.status)}">
                                       {item.status}
                                    </span>
                                 </td>
                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.scanned_at ? new Date(item.scanned_at).toLocaleString('id-ID') : '-'}
                                 </td>
                              </tr>
                           {:else}
                              <tr>
                                 <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">Belum ada data kehadiran</td>
                              </tr>
                           {/each}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'exams'}
         <!-- Exams Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Ujian</h3>
                  
                  <div class="space-y-4">
                     {#each exams as exam}
                        <div class="border border-gray-200 rounded-lg p-4">
                           <div class="flex justify-between items-start">
                              <div class="flex-1">
                                 <h4 class="text-lg font-medium text-gray-900">{exam.title}</h4>
                                 <p class="text-sm text-gray-600 mt-1">{exam.description || 'Tidak ada deskripsi'}</p>
                                 <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                    <span>⏱️ {exam.duration_minutes} menit</span>
                                    <span>📅 {formatDate(exam.start_time)}</span>
                                    <span>🕐 {new Date(exam.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
                                 </div>
                              </div>
                              <div class="ml-4">
                                 {#if exam.status === 'active' && new Date() >= new Date(exam.start_time) && new Date() <= new Date(exam.end_time)}
                                    <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                                       Mulai Ujian
                                    </button>
                                 {:else if exam.attempt_status === 'submitted'}
                                    <div class="text-center">
                                       <div class="text-lg font-semibold text-green-600">{exam.percentage}%</div>
                                       <div class="text-xs text-gray-500">Selesai</div>
                                    </div>
                                 {:else if new Date() < new Date(exam.start_time)}
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                       Menunggu
                                    </span>
                                 {:else}
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                       Berakhir
                                    </span>
                                 {/if}
                              </div>
                           </div>
                        </div>
                     {:else}
                        <p class="text-sm text-gray-500 text-center py-8">Tidak ada ujian tersedia</p>
                     {/each}
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'classes'}
         <!-- Classes Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Kelas Saya</h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {#each classes as cls}
                        <div class="border border-gray-200 rounded-lg p-6">
                           <div class="flex items-center justify-between mb-4">
                              <h4 class="text-lg font-medium text-gray-900">{cls.name}</h4>
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                 {cls.grade_level}
                              </span>
                           </div>
                           <p class="text-sm text-gray-600 mb-4">{cls.description || 'Tidak ada deskripsi'}</p>
                           <div class="space-y-2 text-sm">
                              <div class="flex justify-between">
                                 <span class="text-gray-500">Tahun Akademik:</span>
                                 <span class="text-gray-900">{cls.academic_year}</span>
                              </div>
                              <div class="flex justify-between">
                                 <span class="text-gray-500">Maks. Siswa:</span>
                                 <span class="text-gray-900">{cls.max_students}</span>
                              </div>
                           </div>
                        </div>
                     {:else}
                        <p class="text-sm text-gray-500 text-center py-8 col-span-full">Anda belum terdaftar di kelas manapun</p>
                     {/each}
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>