<script>
   import { router } from '@inertiajs/svelte';
   
   export let subject;
   export let classes;
   export let assignedClasses;
   export let user;
   
   let selectedClass = '';
   let jamPerMinggu = '';
   let selectedTeacher = '';
   let notes = '';
   let errors = {};
   let isSubmitting = false;
   
   // Filter available classes (not assigned yet)
   $: availableClasses = classes.filter(cls => 
      !assignedClasses.some(assigned => assigned.class_id === cls.id)
   );
   
   async function handleAssign() {
      if (isSubmitting) return;
      
      isSubmitting = true;
      errors = {};
      
      try {
         const response = await fetch(`/admin/subjects/${subject.id}/assign-class`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify({
               class_id: selectedClass,
               teacher_id: selectedTeacher || null,
               jam_per_minggu: jamPerMinggu,
               notes: notes
            })
         });
         
         const result = await response.json();
         
         if (response.ok) {
            // Reset form
            selectedClass = '';
            jamPerMinggu = '';
            selectedTeacher = '';
            notes = '';
            
            // Refresh page
            router.reload();
         } else {
            if (result.errors) {
               result.errors.forEach(error => {
                  errors[error.field] = error.message;
               });
            } else {
               alert(result.error || 'Terjadi kesalahan');
            }
         }
      } catch (error) {
         console.error('Error assigning class:', error);
         alert('Terjadi kesalahan saat menugaskan kelas');
      } finally {
         isSubmitting = false;
      }
   }
   
   async function handleUnassign(classId) {
      if (!confirm('Apakah Anda yakin ingin membatalkan penugasan kelas ini?')) return;
      
      try {
         const response = await fetch(`/admin/subjects/${subject.id}/unassign-class`, {
            method: 'DELETE',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify({ class_id: classId })
         });
         
         if (response.ok) {
            router.reload();
         } else {
            const result = await response.json();
            alert(result.error || 'Terjadi kesalahan');
         }
      } catch (error) {
         console.error('Error unassigning class:', error);
         alert('Terjadi kesalahan saat membatalkan penugasan');
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
   <title>Kelola Kelas - {subject.nama} - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100">
   <!-- Header -->
   <header class="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 shadow-xl relative overflow-hidden">
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
                  class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
               >
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
               </button>
               <div>
                  <h1 class="text-2xl font-bold text-white">Kelola Kelas - {subject.nama}</h1>
                  <p class="text-red-100 text-sm">Atur kelas untuk mata pelajaran {subject.kode}</p>
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

   <!-- Main Content -->
   <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <!-- Form Assign Kelas -->
         <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Tugaskan ke Kelas Baru</h2>
            
            {#if availableClasses.length === 0}
               <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div class="flex items-center">
                     <svg class="w-5 h-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                     </svg>
                     <p class="text-yellow-800">Semua kelas sudah ditugaskan untuk mata pelajaran ini.</p>
                  </div>
               </div>
            {:else}
               <form on:submit|preventDefault={handleAssign} class="space-y-4">
                  <!-- Pilih Kelas -->
                  <div>
                     <label for="class" class="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Kelas <span class="text-red-500">*</span>
                     </label>
                     <select
                        id="class"
                        bind:value={selectedClass}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        class:border-red-500={errors.class_id}
                        required
                     >
                        <option value="">-- Pilih Kelas --</option>
                        {#each availableClasses as cls}
                           <option value={cls.id}>{cls.name} - {cls.grade_level}</option>
                        {/each}
                     </select>
                     {#if errors.class_id}
                        <p class="mt-1 text-sm text-red-600">{errors.class_id}</p>
                     {/if}
                  </div>
                  
                  <!-- Jam Per Minggu -->
                  <div>
                     <label for="jam" class="block text-sm font-medium text-gray-700 mb-2">
                        Jam Per Minggu <span class="text-red-500">*</span>
                     </label>
                     <input
                        type="number"
                        id="jam"
                        bind:value={jamPerMinggu}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        class:border-red-500={errors.jam_per_minggu}
                        placeholder="Contoh: 4"
                        min="1"
                        max="20"
                        required
                     />
                     {#if errors.jam_per_minggu}
                        <p class="mt-1 text-sm text-red-600">{errors.jam_per_minggu}</p>
                     {/if}
                  </div>
                  
                  <!-- Catatan -->
                  <div>
                     <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                        Catatan
                     </label>
                     <textarea
                        id="notes"
                        bind:value={notes}
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Catatan tambahan (opsional)"
                     ></textarea>
                  </div>
                  
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                     {isSubmitting ? 'Menugaskan...' : 'Tugaskan Kelas'}
                  </button>
               </form>
            {/if}
         </div>
         
         <!-- Daftar Kelas yang Sudah Ditugaskan -->
         <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Kelas yang Ditugaskan</h2>
            
            {#if assignedClasses.length === 0}
               <div class="text-center py-8">
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  <p class="text-gray-500">Belum ada kelas yang ditugaskan</p>
               </div>
            {:else}
               <div class="space-y-4">
                  {#each assignedClasses as assignment}
                     <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                           <div class="flex-1">
                              <h3 class="font-medium text-gray-900">{assignment.class_name}</h3>
                              <p class="text-sm text-gray-600">Tingkat: {assignment.grade_level}</p>
                              <p class="text-sm text-gray-600">Jam per minggu: {assignment.jam_per_minggu}</p>
                              {#if assignment.teacher_name}
                                 <p class="text-sm text-gray-600">Guru: {assignment.teacher_name}</p>
                              {/if}
                              {#if assignment.notes}
                                 <p class="text-sm text-gray-500 mt-2">{assignment.notes}</p>
                              {/if}
                           </div>
                           <button
                              on:click={() => handleUnassign(assignment.class_id)}
                              class="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                           >
                              Batalkan
                           </button>
                        </div>
                     </div>
                  {/each}
               </div>
            {/if}
         </div>
      </div>
   </main>
</div>

<style>
   .header-enhanced {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
   }
</style>