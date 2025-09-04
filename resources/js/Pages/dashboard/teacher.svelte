<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   
   export let user;
   export let classes = [];
   export let journals = [];
   export let exams = [];
   
   let currentSection = 'overview';
   let showQRCode = false;
   let qrCodeData = null;
   let selectedClass = null;
   
   function navigateToSection(section) {
      currentSection = section;
   }
   
   function logout() {
      router.post('/logout');
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
   
   function formatDateTime(dateString) {
      return new Date(dateString).toLocaleString('id-ID');
   }
   
   async function generateQRCode(classId) {
      try {
         const response = await fetch('/api/attendance/generate-qr', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
               class_id: classId,
               duration_minutes: 30 
            })
         });
         
         if (response.ok) {
            const data = await response.json();
            qrCodeData = data;
            showQRCode = true;
            selectedClass = classes.find(c => c.id === classId);
         } else {
            alert('Gagal membuat QR code absensi');
         }
      } catch (error) {
         console.error('Error generating QR code:', error);
         alert('Terjadi kesalahan saat membuat QR code');
      }
   }
   
   function closeQRCode() {
      showQRCode = false;
      qrCodeData = null;
      selectedClass = null;
   }
   
   function createNewJournal() {
      router.visit('/journal/create');
   }
   
   function editJournal(journalId) {
      router.visit(`/journal/${journalId}/edit`);
   }
   
   function createExam() {
      router.visit('/exam/create');
   }
   
   function viewExamResults(examId) {
      router.visit(`/exam/${examId}/results`);
   }
</script>

<svelte:head>
   <title>Dashboard Guru - NETSA</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
   <!-- Header -->
   <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex justify-between h-16">
            <div class="flex items-center">
               <h1 class="text-xl font-semibold text-gray-900">Dashboard Guru</h1>
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
   <nav class="bg-green-600 text-white">
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
               Absensi
            </button>
            <button 
               class="py-3 px-1 border-b-2 font-medium text-sm"
               class:border-white={currentSection === 'journal'}
               class:border-transparent={currentSection !== 'journal'}
               on:click={() => navigateToSection('journal')}
            >
               Jurnal
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
                           <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white text-sm font-medium">
                              🏫
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Kelas Diampu</dt>
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
                           <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white text-sm font-medium">
                              📝
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">Jurnal</dt>
                              <dd class="text-lg font-medium text-gray-900">{journals.length}</dd>
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
                              <dt class="text-sm font-medium text-gray-500 truncate">Ujian Aktif</dt>
                              <dd class="text-lg font-medium text-gray-900">{exams.filter(e => e.status === 'active').length}</dd>
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
                              👨‍🏫
                           </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                           <dl>
                              <dt class="text-sm font-medium text-gray-500 truncate">ID Guru</dt>
                              <dd class="text-lg font-medium text-gray-900">{user.teacher_id || '-'}</dd>
                           </dl>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white shadow rounded-lg mb-8">
               <div class="px-4 py-5 sm:p-6">
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Aksi Cepat</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <button 
                        class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
                        on:click={() => navigateToSection('attendance')}
                     >
                        <div class="text-2xl mb-2">📱</div>
                        <div class="text-sm font-medium">Buat QR Absensi</div>
                     </button>
                     <button 
                        class="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
                        on:click={createNewJournal}
                     >
                        <div class="text-2xl mb-2">📖</div>
                        <div class="text-sm font-medium">Tulis Jurnal</div>
                     </button>
                     <button 
                        class="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition-colors"
                        on:click={createExam}
                     >
                        <div class="text-2xl mb-2">📋</div>
                        <div class="text-sm font-medium">Buat Ujian</div>
                     </button>
                     <button 
                        class="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg text-center transition-colors"
                        on:click={() => navigateToSection('classes')}
                     >
                        <div class="text-2xl mb-2">👥</div>
                        <div class="text-sm font-medium">Kelola Kelas</div>
                     </button>
                  </div>
               </div>
            </div>

            <!-- Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <!-- Recent Journals -->
               <div class="bg-white shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                     <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Jurnal Terbaru</h3>
                     <div class="space-y-3">
                        {#each journals.slice(0, 5) as journal}
                           <div class="flex justify-between items-start">
                              <div class="flex-1">
                                 <p class="text-sm font-medium text-gray-900">{journal.title}</p>
                                 <p class="text-sm text-gray-500">{formatDate(journal.journal_date)}</p>
                              </div>
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {journal.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                 {journal.status}
                              </span>
                           </div>
                        {:else}
                           <p class="text-sm text-gray-500">Belum ada jurnal</p>
                        {/each}
                     </div>
                  </div>
               </div>

               <!-- Upcoming Exams -->
               <div class="bg-white shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                     <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Ujian Mendatang</h3>
                     <div class="space-y-3">
                        {#each exams.filter(e => e.status === 'active').slice(0, 5) as exam}
                           <div class="border-l-4 border-purple-400 pl-4">
                              <div class="flex justify-between">
                                 <div>
                                    <p class="text-sm font-medium text-gray-900">{exam.title}</p>
                                    <p class="text-sm text-gray-500">{formatDate(exam.start_time)}</p>
                                 </div>
                                 <button 
                                    class="text-sm text-blue-600 hover:text-blue-800"
                                    on:click={() => viewExamResults(exam.id)}
                                 >
                                    Lihat
                                 </button>
                              </div>
                           </div>
                        {:else}
                           <p class="text-sm text-gray-500">Tidak ada ujian aktif</p>
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
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Generate QR Code Absensi</h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {#each classes as cls}
                        <div class="border border-gray-200 rounded-lg p-6">
                           <h4 class="text-lg font-medium text-gray-900 mb-2">{cls.name}</h4>
                           <p class="text-sm text-gray-600 mb-4">{cls.grade_level} - {cls.academic_year}</p>
                           <button 
                              class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                              on:click={() => generateQRCode(cls.id)}
                           >
                              🔲 Generate QR Code
                           </button>
                        </div>
                     {:else}
                        <p class="text-sm text-gray-500 text-center py-8 col-span-full">Anda belum mengampu kelas manapun</p>
                     {/each}
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'journal'}
         <!-- Journal Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-white shadow rounded-lg">
               <div class="px-4 py-5 sm:p-6">
                  <div class="flex justify-between items-center mb-4">
                     <h3 class="text-lg leading-6 font-medium text-gray-900">Jurnal Pembelajaran</h3>
                     <button 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        on:click={createNewJournal}
                     >
                        + Jurnal Baru
                     </button>
                  </div>
                  
                  <div class="space-y-4">
                     {#each journals as journal}
                        <div class="border border-gray-200 rounded-lg p-4">
                           <div class="flex justify-between items-start">
                              <div class="flex-1">
                                 <h4 class="text-lg font-medium text-gray-900">{journal.title}</h4>
                                 <p class="text-sm text-gray-600 mt-1">{journal.content.substring(0, 150)}...</p>
                                 <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                    <span>📅 {formatDate(journal.journal_date)}</span>
                                    <span>🏫 {journal.class_name}</span>
                                    {#if journal.media_files && JSON.parse(journal.media_files).length > 0}
                                       <span>📎 {JSON.parse(journal.media_files).length} file</span>
                                    {/if}
                                 </div>
                              </div>
                              <div class="ml-4 flex items-center space-x-2">
                                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {journal.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                    {journal.status}
                                 </span>
                                 <button 
                                    class="text-blue-600 hover:text-blue-800 text-sm"
                                    on:click={() => editJournal(journal.id)}
                                 >
                                    Edit
                                 </button>
                              </div>
                           </div>
                        </div>
                     {:else}
                        <p class="text-sm text-gray-500 text-center py-8">Belum ada jurnal pembelajaran</p>
                     {/each}
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
                  <div class="flex justify-between items-center mb-4">
                     <h3 class="text-lg leading-6 font-medium text-gray-900">Manajemen Ujian</h3>
                     <button 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        on:click={createExam}
                     >
                        + Buat Ujian
                     </button>
                  </div>
                  
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
                                    <span>🔀 {exam.randomize_questions ? 'Acak Soal' : 'Urut Soal'}</span>
                                 </div>
                              </div>
                              <div class="ml-4 flex items-center space-x-2">
                                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                    {exam.status === 'active' ? 'bg-green-100 text-green-800' : 
                                      exam.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-gray-100 text-gray-800'}">
                                    {exam.status}
                                 </span>
                                 <button 
                                    class="text-blue-600 hover:text-blue-800 text-sm"
                                    on:click={() => viewExamResults(exam.id)}
                                 >
                                    Hasil
                                 </button>
                              </div>
                           </div>
                        </div>
                     {:else}
                        <p class="text-sm text-gray-500 text-center py-8">Belum ada ujian dibuat</p>
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
                  <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Kelas yang Diampu</h3>
                  
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
                           <div class="mt-4 flex space-x-2">
                              <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs font-medium">
                                 Kelola Siswa
                              </button>
                              <button class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-xs font-medium">
                                 Lihat Jadwal
                              </button>
                           </div>
                        </div>
                     {:else}
                        <p class="text-sm text-gray-500 text-center py-8 col-span-full">Anda belum mengampu kelas manapun</p>
                     {/each}
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>

<!-- QR Code Modal -->
{#if showQRCode && qrCodeData}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
         <div class="mt-3 text-center">
            <h3 class="text-lg leading-6 font-medium text-gray-900">QR Code Absensi</h3>
            <p class="text-sm text-gray-500 mt-2">Kelas: {selectedClass?.name}</p>
            <div class="mt-4 flex justify-center">
               <img src={qrCodeData.qrCodeDataURL} alt="QR Code" class="w-64 h-64">
            </div>
            <p class="text-sm text-gray-500 mt-2">
               Berlaku hingga: {formatDateTime(qrCodeData.session.expires_at)}
            </p>
            <div class="items-center px-4 py-3">
               <button 
                  class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700"
                  on:click={closeQRCode}
               >
                  Tutup
               </button>
            </div>
         </div>
      </div>
   </div>
{/if}