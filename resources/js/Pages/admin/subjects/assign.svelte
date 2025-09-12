<script>
   import { router } from '@inertiajs/svelte';
   
   export let subject;
   export let teachers = [];
   export let assignedTeachers = [];
   export let user;
   
   let selectedTeachers = new Set(assignedTeachers.map(t => t.id));
   let searchTerm = '';
   let isSubmitting = false;
   let showSuccessMessage = false;
   
   $: filteredTeachers = teachers.filter(teacher => 
      teacher.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.nip.toLowerCase().includes(searchTerm.toLowerCase())
   );
   
   function toggleTeacher(teacherId) {
      if (selectedTeachers.has(teacherId)) {
         selectedTeachers.delete(teacherId);
      } else {
         selectedTeachers.add(teacherId);
      }
      selectedTeachers = selectedTeachers; // Trigger reactivity
   }
   
   async function handleSubmit() {
      if (isSubmitting) return;
      
      isSubmitting = true;
      
      try {
         const response = await fetch(`/admin/subjects/${subject.id}/assign-teachers`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify({
               teacher_ids: Array.from(selectedTeachers)
            })
         });
         
         const result = await response.json();
         
         if (response.ok) {
            showSuccessMessage = true;
            setTimeout(() => {
               router.visit('/admin/subjects');
            }, 1500);
         } else {
            alert(result.error || 'Terjadi kesalahan saat menyimpan assignment');
         }
      } catch (error) {
         console.error('Error assigning teachers:', error);
         alert('Terjadi kesalahan saat menyimpan assignment');
      } finally {
         isSubmitting = false;
      }
   }
   
   function goBack() {
      router.visit('/admin/subjects');
   }
   
   function logout() {
      router.post('/logout');
   }
</script>

<svelte:head>
   <title>Assignment Guru - {subject.nama} - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100">
   <!-- Modern Material Design Header -->
   <header class="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 shadow-xl relative overflow-hidden header-enhanced">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
         <div class="absolute top-0 left-0 w-full h-full">
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
               <g fill="none" fill-rule="evenodd">
                  <g fill="#ffffff" fill-opacity="0.1">
                     <circle cx="30" cy="30" r="2"/>
                  </g>
               </g>
            </svg>
         </div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex justify-between items-center h-20">
            <div class="flex items-center space-x-4">
               <button
                  on:click={goBack}
                  aria-label="Kembali ke halaman sebelumnya"
                  class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
               >
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
               </button>
               <div>
                  <h1 class="text-2xl font-bold text-white">Assignment Guru</h1>
                  <p class="text-red-100 text-sm">{subject.nama} ({subject.kode})</p>
               </div>
            </div>
            <div class="flex items-center space-x-4">
               <div class="text-right">
                  <p class="text-white font-medium">{user.name}</p>
                  <p class="text-red-100 text-sm">Administrator</p>
               </div>
               <button
                  on:click={logout}
                  class="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-colors border border-white/20"
               >
                  Logout
               </button>
            </div>
         </div>
      </div>
   </header>

   <!-- Success Message -->
   {#if showSuccessMessage}
      <div class="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
         <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Assignment guru berhasil disimpan!</span>
         </div>
      </div>
   {/if}

   <!-- Main Content -->
   <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6">
         <!-- Subject Info -->
         <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 class="text-lg font-semibold text-blue-900 mb-2">Informasi Mata Pelajaran</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
               <div>
                  <span class="font-medium text-blue-700">Kode:</span>
                  <span class="ml-2 text-blue-900">{subject.kode}</span>
               </div>
               <div>
                  <span class="font-medium text-blue-700">Nama:</span>
                  <span class="ml-2 text-blue-900">{subject.nama}</span>
               </div>
               <div>
                  <span class="font-medium text-blue-700">Jam/Minggu:</span>
                  <span class="ml-2 text-blue-900">{subject.jam_per_minggu} jam</span>
               </div>
            </div>
         </div>

         <!-- Search Bar -->
         <div class="mb-6">
            <div class="relative">
               <input
                  type="text"
                  bind:value={searchTerm}
                  placeholder="Cari guru berdasarkan nama atau NIP..."
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
               <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
               </div>
            </div>
         </div>

         <!-- Teachers List -->
         <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
               Pilih Guru ({Array.from(selectedTeachers).length} dipilih)
            </h3>
            
            {#if filteredTeachers.length === 0}
               <div class="text-center py-8 text-gray-500">
                  <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                  <p>Tidak ada guru yang ditemukan</p>
               </div>
            {:else}
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each filteredTeachers as teacher}
                     <div 
                        class="border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
                        class:bg-blue-50={selectedTeachers.has(teacher.id)}
                        class:border-blue-300={selectedTeachers.has(teacher.id)}
                        class:bg-white={!selectedTeachers.has(teacher.id)}
                        class:border-gray-200={!selectedTeachers.has(teacher.id)}
                        on:click={() => toggleTeacher(teacher.id)}
                        on:keydown={(e) => e.key === 'Enter' && toggleTeacher(teacher.id)}
                        role="button"
                        tabindex="0"
                     >
                        <div class="flex items-start justify-between">
                           <div class="flex-1">
                              <h4 class="font-medium text-gray-900 mb-1">{teacher.nama}</h4>
                              <p class="text-sm text-gray-600 mb-2">NIP: {teacher.nip}</p>
                              <p class="text-xs text-gray-500">{teacher.email}</p>
                           </div>
                           <div class="ml-3">
                              {#if selectedTeachers.has(teacher.id)}
                                 <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                    </svg>
                                 </div>
                              {:else}
                                 <div class="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                              {/if}
                           </div>
                        </div>
                     </div>
                  {/each}
               </div>
            {/if}
         </div>

         <!-- Submit Buttons -->
         <div class="flex justify-end space-x-4 pt-6 border-t">
            <button
               type="button"
               on:click={goBack}
               class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
               Batal
            </button>
            <button
               type="button"
               on:click={handleSubmit}
               disabled={isSubmitting}
               class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
               {isSubmitting ? 'Menyimpan...' : 'Simpan Assignment'}
            </button>
         </div>
      </div>
   </main>
</div>

<style>
   .header-enhanced {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
   }
   
   @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
         transform: translate3d(0,0,0);
      }
      40%, 43% {
         transform: translate3d(0, -10px, 0);
      }
      70% {
         transform: translate3d(0, -5px, 0);
      }
      90% {
         transform: translate3d(0, -2px, 0);
      }
   }
   
   .animate-bounce {
      animation: bounce 1s ease-in-out;
   }
</style>