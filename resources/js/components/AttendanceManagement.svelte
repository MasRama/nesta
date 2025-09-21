<script>
   import { onMount } from 'svelte';
   import { router } from '@inertiajs/svelte';
   
   export let user;
   export let teacherSubjects = [];
   
   let currentView = 'sessions'; // sessions, students, stats
   let selectedDate = new Date().toISOString().split('T')[0];
   let selectedSubject = '';
   let selectedClass = '';
   let selectedPeriod = 'today';
   let selectedSessionId = '';
   
   let attendanceSessions = [];
   let classStudents = [];
   let attendanceStats = {};
   let isLoading = false;
   let errorMessage = '';
   let successMessage = '';
   let isExporting = false;
   
   // Filter options
   let availableClasses = [];
   let availableSubjects = teacherSubjects;
   
   onMount(() => {
      loadAttendanceSessions();
      loadAvailableClasses();
   });
   
   async function loadAttendanceSessions() {
      isLoading = true;
      try {
         const params = new URLSearchParams();
         if (selectedDate) params.append('date', selectedDate);
         if (selectedSubject) params.append('subject_id', selectedSubject);
         if (selectedClass) params.append('class_id', selectedClass);
         
         const response = await fetch(`/api/attendance/teacher/sessions?${params}`, {
            headers: { 'Accept': 'application/json' }
         });
         
         if (response.ok) {
            const data = await response.json();
            attendanceSessions = data.sessions || [];
         } else {
            errorMessage = 'Gagal memuat data sesi absensi';
         }
      } catch (error) {
         console.error('Error loading attendance sessions:', error);
         errorMessage = 'Terjadi kesalahan saat memuat data';
      } finally {
         isLoading = false;
      }
   }
   
   async function loadClassStudents(classId, subjectId = null) {
      isLoading = true;
      try {
         const params = new URLSearchParams();
         if (subjectId) params.append('subject_id', subjectId);
         if (selectedDate) params.append('date', selectedDate);
         
         const response = await fetch(`/api/attendance/class/${classId}/students?${params}`, {
            headers: { 'Accept': 'application/json' }
         });
         
         if (response.ok) {
            const data = await response.json();
            classStudents = data.students || [];
            currentView = 'students';
         } else {
            errorMessage = 'Gagal memuat data siswa';
         }
      } catch (error) {
         console.error('Error loading class students:', error);
         errorMessage = 'Terjadi kesalahan saat memuat data siswa';
      } finally {
         isLoading = false;
      }
   }
   
   async function loadAttendanceStats() {
      isLoading = true;
      try {
         const params = new URLSearchParams();
         if (selectedPeriod) params.append('period', selectedPeriod);
         if (selectedSubject) params.append('subject_id', selectedSubject);
         if (selectedClass) params.append('class_id', selectedClass);
         
         const response = await fetch(`/api/attendance/teacher/stats?${params}`, {
            headers: { 'Accept': 'application/json' }
         });
         
         if (response.ok) {
            const data = await response.json();
            attendanceStats = data.stats || {};
            currentView = 'stats';
         } else {
            errorMessage = 'Gagal memuat statistik absensi';
         }
      } catch (error) {
         console.error('Error loading attendance stats:', error);
         errorMessage = 'Terjadi kesalahan saat memuat statistik';
      } finally {
         isLoading = false;
      }
   }
   
   async function loadAvailableClasses() {
      try {
         // Get classes from teacher's subjects
         const classesSet = new Set();
         teacherSubjects.forEach(subject => {
            if (subject.classes) {
               subject.classes.forEach(cls => {
                  classesSet.add(JSON.stringify({ id: cls.id, name: cls.name }));
               });
            }
         });
         availableClasses = Array.from(classesSet).map(cls => JSON.parse(cls));
      } catch (error) {
         console.error('Error loading available classes:', error);
      }
   }
   
   async function updateAttendance(studentId, sessionId, status, notes = '') {
      try {
         const response = await fetch('/api/attendance/manual', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Accept': 'application/json'
            },
            body: JSON.stringify({
               student_id: studentId,
               session_id: sessionId,
               status: status,
               notes: notes
            })
         });
         
         if (response.ok) {
            const data = await response.json();
            successMessage = data.message;
            // Refresh the current view
            if (currentView === 'students') {
               loadClassStudents(selectedClass, selectedSubject);
            } else if (currentView === 'sessions') {
               loadAttendanceSessions();
            }
         } else {
            const error = await response.json();
            errorMessage = error.error || 'Gagal memperbarui absensi';
         }
      } catch (error) {
         console.error('Error updating attendance:', error);
         errorMessage = 'Terjadi kesalahan saat memperbarui absensi';
      }
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
   
   function getStatusText(status) {
      switch (status) {
         case 'present': return 'Hadir';
         case 'absent': return 'Tidak Hadir';
         case 'late': return 'Terlambat';
         case 'excused': return 'Izin';
         case 'not_marked': return 'Belum Dicatat';
         default: return status;
      }
   }
   
   function clearMessages() {
      errorMessage = '';
      successMessage = '';
   }

   async function exportAttendanceData(format = 'json') {
      isExporting = true;
      try {
         const params = new URLSearchParams();
         if (selectedClass) params.append('class_id', selectedClass);
         if (selectedSubject) params.append('subject_id', selectedSubject);
         if (selectedDate) {
            params.append('start_date', selectedDate);
            params.append('end_date', selectedDate);
         }
         params.append('format', format);

         const response = await fetch(`/api/attendance/export?${params}`, {
            headers: { 'Accept': 'application/json' }
         });

         if (response.ok) {
            if (format === 'excel') {
               // For Excel download
               const blob = await response.blob();
               const url = window.URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = `attendance-${selectedDate || 'data'}.xlsx`;
               document.body.appendChild(a);
               a.click();
               window.URL.revokeObjectURL(url);
               document.body.removeChild(a);
               successMessage = 'Data absensi berhasil diexport ke Excel';
            } else {
               // For JSON download
               const data = await response.json();
               const jsonStr = JSON.stringify(data, null, 2);
               const blob = new Blob([jsonStr], { type: 'application/json' });
               const url = window.URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = `attendance-${selectedDate || 'data'}.json`;
               document.body.appendChild(a);
               a.click();
               window.URL.revokeObjectURL(url);
               document.body.removeChild(a);
               successMessage = 'Data absensi berhasil diexport ke JSON';
            }
         } else {
            errorMessage = 'Gagal mengexport data absensi';
         }
      } catch (error) {
         console.error('Error exporting attendance data:', error);
         errorMessage = 'Terjadi kesalahan saat mengexport data';
      } finally {
         isExporting = false;
      }
   }
   
   // Reactive statements
   $: if (selectedDate || selectedSubject || selectedClass) {
      clearMessages();
      if (currentView === 'sessions') {
         loadAttendanceSessions();
      } else if (currentView === 'stats') {
         loadAttendanceStats();
      }
   }
</script>

<div class="bg-white rounded-3xl shadow-xl p-8">
   <!-- Header -->
   <div class="flex items-center justify-between mb-8">
      <div>
         <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Manajemen Absensi
         </h2>
         <p class="text-gray-600 mt-2">Kelola absensi siswa secara manual dan lihat statistik kehadiran</p>
      </div>

      <!-- Export Buttons -->
      <div class="flex space-x-3">
         <button
            on:click={() => exportAttendanceData('json')}
            disabled={isExporting}
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
         >
            {#if isExporting}
               <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {:else}
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
               </svg>
            {/if}
            <span>Export JSON</span>
         </button>
         <button
            on:click={() => exportAttendanceData('excel')}
            disabled={isExporting}
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
         >
            {#if isExporting}
               <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            {:else}
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
               </svg>
            {/if}
            <span>Export Excel</span>
         </button>
      </div>
   </div>

   <!-- Navigation Tabs -->
   <div class="flex space-x-1 bg-gray-100 rounded-2xl p-1 mb-8">
      <button
         class="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300"
         class:bg-white={currentView === 'sessions'}
         class:shadow-md={currentView === 'sessions'}
         class:text-blue-600={currentView === 'sessions'}
         class:text-gray-600={currentView !== 'sessions'}
         on:click={() => { currentView = 'sessions'; loadAttendanceSessions(); }}
      >
         <div class="flex items-center justify-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <span>Sesi Absensi</span>
         </div>
      </button>
      <button
         class="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300"
         class:bg-white={currentView === 'stats'}
         class:shadow-md={currentView === 'stats'}
         class:text-blue-600={currentView === 'stats'}
         class:text-gray-600={currentView !== 'stats'}
         on:click={() => { currentView = 'stats'; loadAttendanceStats(); }}
      >
         <div class="flex items-center justify-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span>Statistik</span>
         </div>
      </button>
   </div>

   <!-- Filters -->
   <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div>
         <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
         <input
            type="date"
            bind:value={selectedDate}
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         />
      </div>
      <div>
         <label class="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
         <select
            bind:value={selectedSubject}
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         >
            <option value="">Semua Mata Pelajaran</option>
            {#each availableSubjects as subject}
               <option value={subject.id}>{subject.nama}</option>
            {/each}
         </select>
      </div>
      <div>
         <label class="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
         <select
            bind:value={selectedClass}
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
         >
            <option value="">Semua Kelas</option>
            {#each availableClasses as cls}
               <option value={cls.id}>{cls.name}</option>
            {/each}
         </select>
      </div>
      {#if currentView === 'stats'}
         <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Periode</label>
            <select
               bind:value={selectedPeriod}
               class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
               <option value="today">Hari Ini</option>
               <option value="week">Minggu Ini</option>
               <option value="month">Bulan Ini</option>
            </select>
         </div>
      {/if}
   </div>

   <!-- Messages -->
   {#if errorMessage}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
         {errorMessage}
         <button on:click={clearMessages} class="float-right text-red-500 hover:text-red-700">×</button>
      </div>
   {/if}
   
   {#if successMessage}
      <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
         {successMessage}
         <button on:click={clearMessages} class="float-right text-green-500 hover:text-green-700">×</button>
      </div>
   {/if}

   <!-- Loading State -->
   {#if isLoading}
      <div class="flex items-center justify-center py-12">
         <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
         <span class="ml-3 text-gray-600">Memuat data...</span>
      </div>
   {:else}
      <!-- Content based on current view -->
      {#if currentView === 'sessions'}
         <!-- Attendance Sessions View -->
         <div class="space-y-6">
            {#if attendanceSessions.length === 0}
               <div class="text-center py-12">
                  <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                     <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                     </svg>
                  </div>
                  <p class="text-gray-500 text-lg">Tidak ada sesi absensi ditemukan</p>
                  <p class="text-gray-400 text-sm mt-1">Coba ubah filter tanggal atau mata pelajaran</p>
               </div>
            {:else}
               {#each attendanceSessions as session}
                  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                     <div class="flex items-center justify-between mb-4">
                        <div>
                           <h3 class="text-xl font-bold text-gray-900">{session.subject_name}</h3>
                           <p class="text-gray-600">{session.class_name} • {session.attendance_date}</p>
                        </div>
                        <div class="flex space-x-2">
                           <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {session.total_present || 0} Hadir
                           </span>
                           <span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              {session.total_absent || 0} Tidak Hadir
                           </span>
                        </div>
                     </div>

                     <div class="flex items-center justify-between">
                        <div class="text-sm text-gray-600">
                           <span>Sesi: {new Date(session.starts_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                           <span class="mx-2">•</span>
                           <span>Total: {(session.attendance_records || []).length} siswa</span>
                        </div>
                        <button
                           on:click={() => { selectedSessionId = session.id; loadClassStudents(session.class_id, session.subject_id); }}
                           class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200"
                        >
                           Kelola Absensi
                        </button>
                     </div>
                  </div>
               {/each}
            {/if}
         </div>

      {:else if currentView === 'students'}
         <!-- Students Management View -->
         <div class="space-y-6">
            <div class="flex items-center justify-between">
               <button
                  on:click={() => { currentView = 'sessions'; loadAttendanceSessions(); }}
                  class="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
               >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  <span>Kembali ke Sesi Absensi</span>
               </button>
               <div class="text-sm text-gray-600">
                  Total: {classStudents.length} siswa
               </div>
            </div>

            {#if classStudents.length === 0}
               <div class="text-center py-12">
                  <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                     <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                     </svg>
                  </div>
                  <p class="text-gray-500 text-lg">Tidak ada siswa ditemukan</p>
               </div>
            {:else}
               <div class="grid gap-4">
                  {#each classStudents as student}
                     <div class="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow duration-200">
                        <div class="flex items-center justify-between">
                           <div class="flex items-center space-x-4">
                              <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                 {student.student_name?.charAt(0) || student.nama?.charAt(0) || 'S'}
                              </div>
                              <div>
                                 <h4 class="font-semibold text-gray-900">{student.student_name || student.nama}</h4>
                                 <p class="text-sm text-gray-600">NIPD: {student.nipd}</p>
                              </div>
                           </div>

                           <div class="flex items-center space-x-3">
                              <span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(student.attendance_status)}">
                                 {getStatusText(student.attendance_status)}
                              </span>

                              <div class="flex space-x-1">
                                 <button
                                    on:click={() => updateAttendance(student.user_id, selectedSessionId, 'present')}
                                    class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                                    title="Tandai Hadir"
                                 >
                                    ✓
                                 </button>
                                 <button
                                    on:click={() => updateAttendance(student.user_id, selectedSessionId, 'absent')}
                                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                                    title="Tandai Tidak Hadir"
                                 >
                                    ✗
                                 </button>
                                 <button
                                    on:click={() => updateAttendance(student.user_id, selectedSessionId, 'late')}
                                    class="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                                    title="Tandai Terlambat"
                                 >
                                    ⏰
                                 </button>
                                 <button
                                    on:click={() => updateAttendance(student.user_id, selectedSessionId, 'excused')}
                                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                                    title="Tandai Izin"
                                 >
                                    📝
                                 </button>
                              </div>
                           </div>
                        </div>

                        {#if student.attendance_notes}
                           <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p class="text-sm text-gray-600">Catatan: {student.attendance_notes}</p>
                           </div>
                        {/if}
                     </div>
                  {/each}
               </div>
            {/if}
         </div>

      {:else if currentView === 'stats'}
         <!-- Statistics View -->
         <div class="space-y-6">
            {#if Object.keys(attendanceStats).length === 0}
               <div class="text-center py-12">
                  <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                     <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                     </svg>
                  </div>
                  <p class="text-gray-500 text-lg">Tidak ada data statistik</p>
                  <p class="text-gray-400 text-sm mt-1">Coba ubah filter periode atau mata pelajaran</p>
               </div>
            {:else}
               <!-- Overall Statistics -->
               <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="bg-green-50 border border-green-200 rounded-2xl p-6">
                     <div class="text-3xl font-bold text-green-600">{attendanceStats.overall?.present || 0}</div>
                     <div class="text-sm text-green-700 font-medium">Hadir</div>
                  </div>
                  <div class="bg-red-50 border border-red-200 rounded-2xl p-6">
                     <div class="text-3xl font-bold text-red-600">{attendanceStats.overall?.absent || 0}</div>
                     <div class="text-sm text-red-700 font-medium">Tidak Hadir</div>
                  </div>
                  <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                     <div class="text-3xl font-bold text-yellow-600">{attendanceStats.overall?.late || 0}</div>
                     <div class="text-sm text-yellow-700 font-medium">Terlambat</div>
                  </div>
                  <div class="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                     <div class="text-3xl font-bold text-blue-600">{attendanceStats.overall?.excused || 0}</div>
                     <div class="text-sm text-blue-700 font-medium">Izin</div>
                  </div>
               </div>

               <!-- Frequent Absences -->
               {#if attendanceStats.frequent_absences && attendanceStats.frequent_absences.length > 0}
                  <div class="bg-red-50 border border-red-200 rounded-2xl p-6">
                     <h3 class="text-lg font-bold text-red-800 mb-4">Siswa Sering Tidak Hadir</h3>
                     <div class="space-y-3">
                        {#each attendanceStats.frequent_absences as student}
                           <div class="flex items-center justify-between bg-white p-3 rounded-xl">
                              <div>
                                 <span class="font-medium text-gray-900">{student.student_name}</span>
                                 <span class="text-sm text-gray-600 ml-2">({student.student_number})</span>
                              </div>
                              <span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                 {student.absent_count} kali tidak hadir
                              </span>
                           </div>
                        {/each}
                     </div>
                  </div>
               {/if}
            {/if}
         </div>
      {/if}
   {/if}
</div>
