<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';
   
   export let user;
   export let classes = [];
   
   let currentSection = 'classes';
   let isLoading = false;
   
   // Modal states
   let showTeacherModal = false;
   let showSubjectModal = false;
   let selectedClass = null;
   let availableTeachers = [];
   let availableSubjects = [];
   let assignedSubjects = [];
   
   // Form states
   let selectedTeacher = '';
   let selectedSubject = '';
   let selectedSubjectTeacher = '';
   let selectedDay = '';
   let startTime = '';
   let endTime = '';
   let notes = '';
   let isSubmitting = false;

   // Note: Removed teacher filtering - all teachers are now available for any subject
   let filteredTeachers = [];

   // Search and filter
   let searchTerm = '';
   let filteredClasses = classes;

   // Reactive filtering
   $: {
      if (searchTerm.trim() === '') {
         filteredClasses = classes;
      } else {
         filteredClasses = classes.filter(cls =>
            cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (cls.teacher_name && cls.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()))
         );
      }
   }

   // Set all teachers as available (no filtering by subject)
   $: {
      filteredTeachers = availableTeachers;
   }

   // Cache untuk teachers data
   let teachersCache = null;
   let teachersCacheTime = 0;
   const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

   async function loadTeachers() {
      const now = Date.now();

      // Gunakan cache jika masih valid
      if (teachersCache && (now - teachersCacheTime) < CACHE_DURATION) {
         return teachersCache;
      }

      try {
         const response = await fetch('/api/classes/teachers');
         const result = await response.json();

         if (result.success) {
            teachersCache = result.data;
            teachersCacheTime = now;
            return result.data;
         } else {
            throw new Error('Gagal mengambil data guru');
         }
      } catch (error) {
         console.error('Error loading teachers:', error);
         throw error;
      }
   }

   async function openTeacherModal(classData) {
      selectedClass = classData;
      showTeacherModal = true;
      isLoading = true;

      try {
         availableTeachers = await loadTeachers();
         selectedTeacher = classData.teacher_id || '';
      } catch (error) {
         alert('Gagal mengambil data guru');
      } finally {
         isLoading = false;
      }
   }

   async function openSubjectModal(classData) {
      selectedClass = classData;
      showSubjectModal = true;
      isLoading = true;

      try {
         // Get available subjects, assigned subjects, and teachers in parallel
         const [subjectsResult, assignedResult, teachers] = await Promise.all([
            fetch('/api/classes/subjects').then(res => res.json()),
            fetch(`/admin/classes/${encodeURIComponent(classData.name)}/subjects`).then(res => res.json()),
            loadTeachers()
         ]);

         if (subjectsResult.success && assignedResult.success) {
            availableSubjects = subjectsResult.data;
            assignedSubjects = assignedResult.data;
            availableTeachers = teachers;
         } else {
            alert('Gagal mengambil data mata pelajaran');
         }
      } catch (error) {
         console.error('Error loading subjects:', error);
         alert('Gagal mengambil data mata pelajaran');
      } finally {
         isLoading = false;
      }
   }

   function closeModals() {
      showTeacherModal = false;
      showSubjectModal = false;
      selectedClass = null;
      selectedTeacher = '';
      selectedSubject = '';
      selectedSubjectTeacher = '';
      selectedDay = '';
      startTime = '';
      endTime = '';
      notes = '';
      isSubmitting = false;
      filteredTeachers = [];
   }

   // Function removed: No longer filtering teachers by subject - all teachers available

   async function assignTeacher() {
      if (!selectedClass || !selectedTeacher || isSubmitting) return;

      isSubmitting = true;
      try {
         const response = await fetch(`/admin/classes/${encodeURIComponent(selectedClass.name)}/assign-teacher`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify({
               teacher_id: selectedTeacher
            })
         });

         const result = await response.json();
         
         if (result.success) {
            alert(result.message);
            closeModals();
            router.reload();
         } else {
            alert(result.error || 'Gagal menugaskan wali kelas');
         }
      } catch (error) {
         console.error('Error assigning teacher:', error);
         alert('Gagal menugaskan wali kelas');
      } finally {
         isSubmitting = false;
      }
   }

   async function unassignTeacher(classData) {
      if (!confirm(`Apakah Anda yakin ingin membatalkan penugasan wali kelas ${classData.name}?`)) return;

      try {
         const response = await fetch(`/admin/classes/${encodeURIComponent(classData.name)}/unassign-teacher`, {
            method: 'DELETE',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            }
         });

         const result = await response.json();
         
         if (result.success) {
            alert(result.message);
            router.reload();
         } else {
            alert(result.error || 'Gagal membatalkan penugasan wali kelas');
         }
      } catch (error) {
         console.error('Error unassigning teacher:', error);
         alert('Gagal membatalkan penugasan wali kelas');
      }
   }

   async function assignSubject() {
      if (!selectedClass || !selectedSubject || !selectedSubjectTeacher || !selectedDay || !startTime || !endTime || isSubmitting) {
         alert('Semua field wajib diisi');
         return;
      }

      // Validation removed: Teachers can now be assigned freely to any subject

      // Validate time logic
      if (startTime >= endTime) {
         alert('Waktu mulai harus lebih awal dari waktu selesai');
         return;
      }

      isSubmitting = true;
      try {
         const response = await fetch(`/admin/classes/${encodeURIComponent(selectedClass.name)}/assign-subject`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify({
               subject_id: selectedSubject,
               teacher_id: selectedSubjectTeacher,
               day: selectedDay,
               start_time: startTime,
               end_time: endTime,
               notes: notes || null
            })
         });

         const result = await response.json();

         if (result.success) {
            alert(result.message);
            // Refresh assigned subjects
            await openSubjectModal(selectedClass);
            // Reset form
            selectedSubject = '';
            selectedSubjectTeacher = '';
            selectedDay = '';
            startTime = '';
            endTime = '';
            notes = '';
         } else {
            // Show detailed error message
            const errorMessage = result.error || 'Gagal menugaskan mata pelajaran';
            if (errorMessage.includes('Guru belum di-assign')) {
               alert('❌ ' + errorMessage + '\n\n💡 Solusi: Buka menu Mata Pelajaran → Pilih mata pelajaran → Assign guru terlebih dahulu.');
            } else if (errorMessage.includes('bertabrakan') || errorMessage.includes('conflict')) {
               alert('⏰ Jadwal bertabrakan dengan jadwal yang sudah ada.\n\n💡 Silakan pilih waktu yang berbeda atau cek jadwal yang sudah ada.');
            } else if (errorMessage.includes('sudah ditugaskan')) {
               alert('⚠️ ' + errorMessage + '\n\n💡 Mata pelajaran sudah ditugaskan ke kelas ini dengan guru yang sama.');
            } else {
               alert('❌ ' + errorMessage);
            }
         }
      } catch (error) {
         console.error('Error assigning subject:', error);
         alert('🔧 Terjadi kesalahan sistem saat menugaskan mata pelajaran.\n\nSilakan coba lagi atau hubungi administrator.');
      } finally {
         isSubmitting = false;
      }
   }

   async function unassignSubject(subjectId) {
      if (!confirm('Apakah Anda yakin ingin membatalkan penugasan mata pelajaran ini?')) return;

      try {
         const response = await fetch(`/admin/classes/${encodeURIComponent(selectedClass.name)}/unassign-subject`, {
            method: 'DELETE',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify({
               subject_id: subjectId
            })
         });

         const result = await response.json();
         
         if (result.success) {
            alert(result.message);
            // Refresh assigned subjects
            await openSubjectModal(selectedClass);
         } else {
            const errorMessage = result.error || 'Gagal membatalkan penugasan mata pelajaran';
            alert('❌ ' + errorMessage + '\n\n💡 Silakan coba lagi atau hubungi administrator jika masalah berlanjut.');
         }
      } catch (error) {
         console.error('Error unassigning subject:', error);
         alert('🔧 Terjadi kesalahan sistem saat membatalkan penugasan.\n\nSilakan coba lagi atau hubungi administrator.');
      }
   }
</script>

<style>
   .fade-in-up {
      animation: fadeInUp 0.6s ease-out;
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

   .card-hover {
      transition: all 0.3s ease;
   }

   .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
   }
</style>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <AdminHeader {user} title="Manajemen Kelas" subtitle="Portal Manajemen NETSA" />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <div class="mb-8 fade-in-up">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Manajemen Kelas</h2>
            <p class="text-gray-600">Kelola wali kelas dan mata pelajaran untuk setiap kelas</p>
         </div>

         <!-- Search and Filter -->
         <div class="mb-6 fade-in-up">
            <div class="bg-white rounded-lg shadow-sm p-4">
               <div class="flex flex-col sm:flex-row gap-4">
                  <div class="flex-1">
                     <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Cari Kelas</label>
                     <input
                        type="text"
                        id="search"
                        bind:value={searchTerm}
                        placeholder="Cari berdasarkan nama kelas atau wali kelas..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                  </div>
               </div>
            </div>
         </div>

         <!-- Classes Grid -->
         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each filteredClasses as classData, index}
               <div class="bg-white rounded-lg shadow-sm card-hover fade-in-up" style="animation-delay: {index * 0.1}s">
                  <div class="p-6">
                     <!-- Class Header -->
                     <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-900">{classData.name}</h3>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                           Kelas {classData.grade_level}
                        </span>
                     </div>

                     <!-- Class Stats -->
                     <div class="space-y-3 mb-6">
                        <div class="flex items-center text-sm text-gray-600">
                           <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                           </svg>
                           {classData.student_count} Siswa
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                           <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                           </svg>
                           {classData.subject_count} Mata Pelajaran
                        </div>
                     </div>

                     <!-- Homeroom Teacher -->
                     <div class="mb-6">
                        <h4 class="text-sm font-medium text-gray-700 mb-2">Wali Kelas</h4>
                        {#if classData.teacher_name}
                           <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                              <div>
                                 <p class="font-medium text-green-900">{classData.teacher_name}</p>
                                 <p class="text-sm text-green-700">NIP: {classData.teacher_nip}</p>
                              </div>
                              <button
                                 on:click={() => unassignTeacher(classData)}
                                 class="text-red-600 hover:text-red-800 transition-colors"
                                 title="Batalkan Penugasan"
                                 aria-label="Batalkan penugasan wali kelas"
                              >
                                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                 </svg>
                              </button>
                           </div>
                        {:else}
                           <div class="bg-gray-50 p-3 rounded-lg text-center">
                              <p class="text-gray-500 text-sm mb-2">Belum ada wali kelas</p>
                              <button
                                 on:click={() => openTeacherModal(classData)}
                                 class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                 Tugaskan Wali Kelas
                              </button>
                           </div>
                        {/if}
                     </div>

                     <!-- Action Buttons -->
                     <div class="flex gap-2">
                        <button
                           on:click={() => openTeacherModal(classData)}
                           class="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                           Kelola Wali Kelas
                        </button>
                        <button
                           on:click={() => openSubjectModal(classData)}
                           class="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                           Kelola Mapel
                        </button>
                     </div>
                  </div>
               </div>
            {/each}
         </div>

         {#if filteredClasses.length === 0}
            <div class="text-center py-12">
               <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
               </svg>
               <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada kelas ditemukan</h3>
               <p class="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Belum ada data kelas yang tersedia'}
               </p>
            </div>
         {/if}
      </div>
   </main>
</div>

<!-- Teacher Assignment Modal -->
{#if showTeacherModal}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
         <div class="mt-3">
            <div class="flex items-center justify-between mb-4">
               <h3 class="text-lg font-medium text-gray-900">
                  Kelola Wali Kelas - {selectedClass?.name}
               </h3>
               <button
                  on:click={closeModals}
                  class="text-gray-400 hover:text-gray-600"
                  aria-label="Tutup modal"
               >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
               </button>
            </div>

            {#if isLoading}
               <div class="text-center py-4">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p class="mt-2 text-sm text-gray-600">Memuat data guru...</p>
               </div>
            {:else}
               <div class="space-y-4">
                  <div>
                     <label for="teacher-select" class="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Guru
                     </label>
                     <select
                        id="teacher-select"
                        bind:value={selectedTeacher}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                        <option value="">-- Pilih Guru --</option>
                        {#each availableTeachers as teacher}
                           <option value={teacher.id}>{teacher.nama} (NIP: {teacher.nip})</option>
                        {/each}
                     </select>
                  </div>

                  <div class="flex gap-3 pt-4">
                     <button
                        on:click={closeModals}
                        class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                     >
                        Batal
                     </button>
                     <button
                        on:click={assignTeacher}
                        disabled={!selectedTeacher || isSubmitting}
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                     </button>
                  </div>
               </div>
            {/if}
         </div>
      </div>
   </div>
{/if}

<!-- Subject Assignment Modal -->
{#if showSubjectModal}
   <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
         <div class="mt-3">
            <div class="flex items-center justify-between mb-4">
               <h3 class="text-lg font-medium text-gray-900">
                  Kelola Mata Pelajaran - {selectedClass?.name}
               </h3>
               <button
                  on:click={closeModals}
                  class="text-gray-400 hover:text-gray-600"
                  aria-label="Tutup modal"
               >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
               </button>
            </div>

            {#if isLoading}
               <div class="text-center py-4">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p class="mt-2 text-sm text-gray-600">Memuat data mata pelajaran...</p>
               </div>
            {:else}
               <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Add New Subject Assignment -->
                  <div class="bg-gray-50 p-4 rounded-lg">
                     <h4 class="text-md font-medium text-gray-900 mb-4">Tambah Mata Pelajaran</h4>
                     <div class="space-y-4">
                        <div>
                           <label for="subject-select" class="block text-sm font-medium text-gray-700 mb-2">
                              Mata Pelajaran
                           </label>
                           <select
                              id="subject-select"
                              bind:value={selectedSubject}
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           >
                              <option value="">-- Pilih Mata Pelajaran --</option>
                              {#each availableSubjects as subject}
                                 <option value={subject.id}>{subject.nama} ({subject.kode})</option>
                              {/each}
                           </select>
                        </div>

                        <div>
                           <label for="subject-teacher-select" class="block text-sm font-medium text-gray-700 mb-2">
                              Guru Pengajar <span class="text-red-500">*</span>
                           </label>

                           <div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <div class="flex">
                                 <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                 </div>
                                 <div class="ml-3">
                                    <p class="text-sm text-blue-700">
                                       <strong>Info:</strong> Anda dapat memilih guru mana saja untuk mengajar mata pelajaran ini.
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <select
                              id="subject-teacher-select"
                              bind:value={selectedSubjectTeacher}
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                              disabled={!selectedSubject}
                           >
                              <option value="">
                                 {selectedSubject ? '-- Pilih Guru --' : '-- Pilih Mata Pelajaran Terlebih Dahulu --'}
                              </option>
                              {#each filteredTeachers as teacher}
                                 <option value={teacher.id}>{teacher.nama} (NIP: {teacher.nip})</option>
                              {/each}
                           </select>

                           {#if selectedSubject && filteredTeachers.length > 0}
                              <p class="text-sm text-gray-600 mt-1">
                                 {filteredTeachers.length} guru tersedia
                              </p>
                           {/if}
                        </div>

                        <div>
                           <label for="day-select" class="block text-sm font-medium text-gray-700 mb-2">
                              Hari <span class="text-red-500">*</span>
                           </label>
                           <select
                              id="day-select"
                              bind:value={selectedDay}
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                           >
                              <option value="">-- Pilih Hari --</option>
                              <option value="Senin">Senin</option>
                              <option value="Selasa">Selasa</option>
                              <option value="Rabu">Rabu</option>
                              <option value="Kamis">Kamis</option>
                              <option value="Jumat">Jumat</option>
                           </select>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                           <div>
                              <label for="start-time" class="block text-sm font-medium text-gray-700 mb-2">
                                 Waktu Mulai <span class="text-red-500">*</span>
                              </label>
                              <input
                                 type="time"
                                 id="start-time"
                                 bind:value={startTime}
                                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                 required
                              />
                           </div>
                           <div>
                              <label for="end-time" class="block text-sm font-medium text-gray-700 mb-2">
                                 Waktu Selesai <span class="text-red-500">*</span>
                              </label>
                              <input
                                 type="time"
                                 id="end-time"
                                 bind:value={endTime}
                                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                 required
                              />
                           </div>
                        </div>

                        <div>
                           <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                              Catatan (Opsional)
                           </label>
                           <textarea
                              id="notes"
                              bind:value={notes}
                              rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Catatan tambahan..."
                           ></textarea>
                        </div>

                        <button
                           on:click={assignSubject}
                           disabled={!selectedSubject || !selectedSubjectTeacher || !selectedDay || !startTime || !endTime || isSubmitting}
                           class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                           {isSubmitting ? 'Menambahkan...' : 'Tambah Mata Pelajaran'}
                        </button>
                     </div>
                  </div>

                  <!-- Assigned Subjects List -->
                  <div>
                     <h4 class="text-md font-medium text-gray-900 mb-4">Mata Pelajaran yang Ditugaskan</h4>
                     <div class="space-y-3 max-h-96 overflow-y-auto">
                        {#each assignedSubjects as subject}
                           <div class="bg-white p-4 rounded-lg border border-gray-200">
                              <div class="flex items-start justify-between">
                                 <div class="flex-1">
                                    <h5 class="font-medium text-gray-900">{subject.subject_name}</h5>
                                    <p class="text-sm text-gray-600">Kode: {subject.subject_code}</p>
                                    {#if subject.teacher_name}
                                       <p class="text-sm text-blue-600">Guru: {subject.teacher_name}</p>
                                    {/if}
                                    {#if subject.day && subject.start_time && subject.end_time}
                                       <div class="flex items-center space-x-2 mt-1">
                                          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                             {subject.day}
                                          </span>
                                          <span class="text-sm text-gray-600">
                                             {subject.start_time} - {subject.end_time}
                                          </span>
                                       </div>
                                    {/if}
                                    {#if subject.notes}
                                       <p class="text-sm text-gray-500 mt-1">{subject.notes}</p>
                                    {/if}
                                 </div>
                                 <button
                                    on:click={() => unassignSubject(subject.subject_id)}
                                    class="text-red-600 hover:text-red-800 transition-colors ml-2"
                                    title="Hapus Penugasan"
                                    aria-label="Hapus penugasan mata pelajaran"
                                 >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                 </button>
                              </div>
                           </div>
                        {:else}
                           <div class="text-center py-8 text-gray-500">
                              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                              </svg>
                              <p class="mt-2">Belum ada mata pelajaran yang ditugaskan</p>
                           </div>
                        {/each}
                     </div>
                  </div>
               </div>

               <div class="flex justify-end pt-6 border-t border-gray-200 mt-6">
                  <button
                     on:click={closeModals}
                     class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                     Tutup
                  </button>
               </div>
            {/if}
         </div>
      </div>
   </div>
{/if}
