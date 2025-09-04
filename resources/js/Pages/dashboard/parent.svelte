<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   
   export let user;
   export let children = [];
   export let attendanceData = [];
   
   let currentSection = 'overview';
   let selectedChild = children[0] || null;
   
   function navigateToSection(section) {
      currentSection = section;
   }
   
   function logout() {
      router.post('/logout');
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
   
   function selectChild(child) {
      selectedChild = child;
   }
   
   function getAttendanceStats(childId) {
      const childData = attendanceData.find(data => data.child_id === childId);
      if (!childData || !childData.attendance) return { present: 0, absent: 0, late: 0, total: 0 };
      
      const stats = childData.attendance.reduce((acc, curr) => {
         acc[curr.status] = curr.count;
         acc.total += curr.count;
         return acc;
      }, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
      
      return stats;
   }
   
   function getAttendancePercentage(childId) {
      const stats = getAttendanceStats(childId);
      if (stats.total === 0) return 0;
      return Math.round((stats.present / stats.total) * 100);
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
   <title>Dashboard Orang Tua - NETSA</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
   <!-- Header -->
   <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex justify-between h-16">
            <div class="flex items-center">
               <h1 class="text-xl font-semibold text-gray-900">Dashboard Orang Tua</h1>
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

   <!-- Child Selector -->
   {#if children.length > 1}
      <div class="bg-purple-600 text-white">
         <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="py-3">
               <span class="text-sm font-medium mr-4">Pilih Anak:</span>
               <div class="inline-flex space-x-2">
                  {#each children as child}
                     <button 
                        class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        class:bg-purple-800={selectedChild?.id === child.id}
                        class:bg-purple-500={selectedChild?.id !== child.id}
                        on:click={() => selectChild(child)}
                     >
                        {child.name}
                     </button>
                  {/each}
               </div>
            </div>
         </div>
      </div>
   {/if}

   <!-- Navigation -->
   <nav class="bg-purple-600 text-white">
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
               Kehadiran Anak
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'progress'}
               class:border-transparent={currentSection !== 'progress'}
               on:click={() => navigateToSection('progress')}
            >
               Progress Akademik
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'communication'}
               class:border-transparent={currentSection !== 'communication'}
               on:click={() => navigateToSection('communication')}
            >
               Komunikasi
            </button>
         </div>
      </div>
   </nav>

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {#if currentSection === 'overview'}
         <!-- Overview Section -->
         <div class="px-4 py-6 sm:px-0">
            {#if children.length === 0}
               <div class="text-center py-12">
                  <div class="text-gray-400 text-6xl mb-4">👨‍👩‍👧‍👦</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Anak</h3>
                  <p class="text-gray-600">Silakan hubungi admin sekolah untuk menghubungkan akun Anda dengan data anak.</p>
               </div>
            {:else}
               <!-- Children Overview -->
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {#each children as child}
                     <div class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                           <div class="flex items-center">
                              <div class="flex-shrink-0">
                                 <img src={child.profile_image || '/images/default-avatar.png'} alt={child.name} class="h-12 w-12 rounded-full">
                              </div>
                              <div class="ml-5 w-0 flex-1">
                                 <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">Nama Anak</dt>
                                    <dd class="text-lg font-medium text-gray-900">{child.name}</dd>
                                    <dd class="text-sm text-gray-600">ID: {child.student_id || '-'}</dd>
                                 </dl>
                              </div>
                           </div>
                           <div class="mt-4">
                              <div class="flex justify-between text-sm">
                                 <span class="text-gray-500">Kehadiran:</span>
                                 <span class="font-medium text-gray-900">{getAttendancePercentage(child.id)}%</span>
                              </div>
                              <div class="mt-1 w-full bg-gray-200 rounded-full h-2">
                                 <div class="bg-green-600 h-2 rounded-full" style="width: {getAttendancePercentage(child.id)}%"></div>
                              </div>
                           </div>
                        </div>
                     </div>
                  {/each}
               </div>

               {#if selectedChild}
                  <!-- Selected Child Details -->
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <!-- Attendance Summary -->
                     <div class="bg-white shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                           <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                              Ringkasan Kehadiran - {selectedChild.name}
                           </h3>
                           <div class="grid grid-cols-2 gap-4">
                              {#each Object.entries(getAttendanceStats(selectedChild.id)) as [status, count]}
                                 {#if status !== 'total'}
                                    <div class="text-center p-4 bg-gray-50 rounded-lg">
                                       <div class="text-2xl font-bold text-gray-900">{count}</div>
                                       <div class="text-sm text-gray-600 capitalize">{status === 'present' ? 'Hadir' : status === 'absent' ? 'Tidak Hadir' : status === 'late' ? 'Terlambat' : 'Izin'}</div>
                                    </div>
                                 {/if}
                              {/each}
                           </div>
                           <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                              <div class="flex justify-between items-center">
                                 <span class="text-sm font-medium text-gray-700">Persentase Kehadiran</span>
                                 <span class="text-lg font-bold text-blue-600">{getAttendancePercentage(selectedChild.id)}%</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <!-- Academic Information -->
                     <div class="bg-white shadow rounded-lg">
                        <div class="px-4 py-5 sm:p-6">
                           <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Informasi Akademik</h3>
                           <div class="space-y-4">
                              <div class="border-l-4 border-blue-400 pl-4">
                                 <h4 class="text-sm font-medium text-gray-700">ID Siswa</h4>
                                 <p class="text-lg text-gray-900">{selectedChild.student_id || 'Belum ditetapkan'}</p>
                              </div>
                              <div class="border-l-4 border-green-400 pl-4">
                                 <h4 class="text-sm font-medium text-gray-700">Status</h4>
                                 <p class="text-lg text-gray-900">Aktif</p>
                              </div>
                              <div class="border-l-4 border-purple-400 pl-4">
                                 <h4 class="text-sm font-medium text-gray-700">Hubungan</h4>
                                 <p class="text-lg text-gray-900 capitalize">{selectedChild.relationship}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               {/if}
            {/if}
         </div>
      {/if}

      {#if currentSection === 'attendance'}
         <!-- Attendance Section -->
         <div class="px-4 py-6 sm:px-0">
            {#if selectedChild}
               <div class="bg-white shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                     <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Detail Kehadiran - {selectedChild.name}
                     </h3>
                     
                     <!-- Monthly Summary -->
                     <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Ringkasan Bulan Ini</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {#each Object.entries(getAttendanceStats(selectedChild.id)) as [status, count]}
                              {#if status !== 'total'}
                                 <div class="text-center">
                                    <div class="text-xl font-bold {status === 'present' ? 'text-green-600' : status === 'absent' ? 'text-red-600' : status === 'late' ? 'text-yellow-600' : 'text-blue-600'}">{count}</div>
                                    <div class="text-sm text-gray-600">
                                       {status === 'present' ? 'Hadir' : status === 'absent' ? 'Tidak Hadir' : status === 'late' ? 'Terlambat' : 'Izin'}
                                    </div>
                                 </div>
                              {/if}
                           {/each}
                        </div>
                     </div>

                     <!-- Attendance Calendar -->
                     <div class="border rounded-lg p-4">
                        <h4 class="text-sm font-medium text-gray-700 mb-3">Kalender Kehadiran</h4>
                        <div class="text-center text-gray-500 py-8">
                           <div class="text-4xl mb-2">📅</div>
                           <p>Kalender kehadiran akan ditampilkan di sini</p>
                           <p class="text-sm mt-1">Fitur dalam pengembangan</p>
                        </div>
                     </div>
                  </div>
               </div>
            {:else}
               <div class="text-center py-12">
                  <div class="text-gray-400 text-6xl mb-4">👶</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Pilih Anak</h3>
                  <p class="text-gray-600">Silakan pilih anak terlebih dahulu untuk melihat data kehadiran.</p>
               </div>
            {/if}
         </div>
      {/if}

      {#if currentSection === 'progress'}
         <!-- Progress Section -->
         <div class="px-4 py-6 sm:px-0">
            {#if selectedChild}
               <div class="bg-white shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                     <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Progress Akademik - {selectedChild.name}
                     </h3>
                     
                     <div class="text-center text-gray-500 py-12">
                        <div class="text-6xl mb-4">📊</div>
                        <h4 class="text-lg font-medium text-gray-700 mb-2">Progress Akademik</h4>
                        <p class="text-gray-600">Data nilai, ujian, dan progress belajar anak akan ditampilkan di sini</p>
                        <p class="text-sm mt-1">Fitur dalam pengembangan</p>
                     </div>

                     <!-- Placeholder for future academic data -->
                     <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div class="bg-gray-50 p-6 rounded-lg text-center">
                           <div class="text-2xl text-gray-400 mb-2">📝</div>
                           <h5 class="font-medium text-gray-700">Nilai Rata-rata</h5>
                           <p class="text-2xl font-bold text-gray-400">--</p>
                        </div>
                        <div class="bg-gray-50 p-6 rounded-lg text-center">
                           <div class="text-2xl text-gray-400 mb-2">🎯</div>
                           <h5 class="font-medium text-gray-700">Ujian Selesai</h5>
                           <p class="text-2xl font-bold text-gray-400">--</p>
                        </div>
                        <div class="bg-gray-50 p-6 rounded-lg text-center">
                           <div class="text-2xl text-gray-400 mb-2">📈</div>
                           <h5 class="font-medium text-gray-700">Ranking Kelas</h5>
                           <p class="text-2xl font-bold text-gray-400">--</p>
                        </div>
                     </div>
                  </div>
               </div>
            {:else}
               <div class="text-center py-12">
                  <div class="text-gray-400 text-6xl mb-4">👶</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Pilih Anak</h3>
                  <p class="text-gray-600">Silakan pilih anak terlebih dahulu untuk melihat progress akademik.</p>
               </div>
            {/if}
         </div>
      {/if}

      {#if currentSection === 'communication'}
         <!-- Communication Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Komunikasi dengan Sekolah</h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <!-- Announcements -->
                     <div>
                        <h4 class="text-md font-medium text-gray-700 mb-3">Pengumuman Terbaru</h4>
                        <div class="space-y-3">
                           <div class="border-l-4 border-blue-400 pl-4 py-2">
                              <p class="text-sm font-medium text-gray-900">Libur Semester</p>
                              <p class="text-sm text-gray-600">Informasi jadwal libur semester akan diumumkan segera</p>
                              <p class="text-xs text-gray-500 mt-1">2 hari yang lalu</p>
                           </div>
                           <div class="border-l-4 border-green-400 pl-4 py-2">
                              <p class="text-sm font-medium text-gray-900">Rapat Orang Tua</p>
                              <p class="text-sm text-gray-600">Undangan rapat orang tua siswa bulan ini</p>
                              <p class="text-xs text-gray-500 mt-1">5 hari yang lalu</p>
                           </div>
                        </div>
                     </div>

                     <!-- Teacher Messages -->
                     <div>
                        <h4 class="text-md font-medium text-gray-700 mb-3">Pesan dari Guru</h4>
                        <div class="space-y-3">
                           <div class="bg-gray-50 p-3 rounded-lg">
                              <p class="text-sm font-medium text-gray-900">Bu Sari - Wali Kelas</p>
                              <p class="text-sm text-gray-600">Anak Anda menunjukkan progress yang baik dalam matematika</p>
                              <p class="text-xs text-gray-500 mt-1">1 hari yang lalu</p>
                           </div>
                           <div class="bg-gray-50 p-3 rounded-lg">
                              <p class="text-sm font-medium text-gray-900">Pak Budi - Guru Olahraga</p>
                              <p class="text-sm text-gray-600">Jangan lupa bawa perlengkapan olahraga besok</p>
                              <p class="text-xs text-gray-500 mt-1">3 hari yang lalu</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <!-- Contact Information -->
                  <div class="mt-8 border-t pt-6">
                     <h4 class="text-md font-medium text-gray-700 mb-3">Kontak Sekolah</h4>
                     <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div class="flex items-center">
                           <span class="text-gray-400 mr-2">📞</span>
                           <span>+62 21 12345678</span>
                        </div>
                        <div class="flex items-center">
                           <span class="text-gray-400 mr-2">✉️</span>
                           <span>info@netsa.school.id</span>
                        </div>
                        <div class="flex items-center">
                           <span class="text-gray-400 mr-2">📍</span>
                           <span>Jl. Pendidikan No. 123, Jakarta</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>