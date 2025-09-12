<script>
   import { router } from '@inertiajs/svelte';
   
   export let subject;
   export let user;
   
   let formData = {
      kode: subject.kode || '',
      nama: subject.nama || '',
      jam_per_minggu: subject.jam_per_minggu || '',
      deskripsi: subject.deskripsi || ''
   };
   
   let errors = {};
   let isSubmitting = false;
   
   async function handleSubmit() {
      if (isSubmitting) return;
      
      isSubmitting = true;
      errors = {};
      
      try {
         const response = await fetch(`/admin/subjects/${subject.id}`, {
            method: 'PUT',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify(formData)
         });
         
         const result = await response.json();
         
         if (response.ok) {
            router.visit('/admin/subjects', {
               onSuccess: () => {
                  alert('Data mata pelajaran berhasil diperbarui!');
               }
            });
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
         console.error('Error updating subject:', error);
         alert('Terjadi kesalahan saat memperbarui data');
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
   <title>Edit Mata Pelajaran - NETSA Admin</title>
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
                  <h1 class="text-2xl font-bold text-white">Edit Mata Pelajaran: {subject.nama}</h1>
                  <p class="text-red-100 text-sm">Form Edit Data Mata Pelajaran</p>
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
   <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6">
         <form on:submit|preventDefault={handleSubmit} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <!-- Kode Mata Pelajaran -->
               <div>
                  <label for="kode" class="block text-sm font-medium text-gray-700 mb-2">
                     Kode Mata Pelajaran <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="kode"
                     bind:value={formData.kode}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.kode}
                     placeholder="Contoh: MTK, IPA, IPS"
                     required
                  />
                  {#if errors.kode}
                     <p class="mt-1 text-sm text-red-600">{errors.kode}</p>
                  {/if}
               </div>

               <!-- Nama Mata Pelajaran -->
               <div>
                  <label for="nama" class="block text-sm font-medium text-gray-700 mb-2">
                     Nama Mata Pelajaran <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="nama"
                     bind:value={formData.nama}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.nama}
                     placeholder="Masukkan nama mata pelajaran"
                     required
                  />
                  {#if errors.nama}
                     <p class="mt-1 text-sm text-red-600">{errors.nama}</p>
                  {/if}
               </div>

               <!-- Jam Per Minggu -->
               <div>
                  <label for="jam_per_minggu" class="block text-sm font-medium text-gray-700 mb-2">
                     Jam Per Minggu <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="number"
                     id="jam_per_minggu"
                     bind:value={formData.jam_per_minggu}
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
            </div>

            <!-- Deskripsi -->
            <div>
               <label for="deskripsi" class="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
               </label>
               <textarea
                  id="deskripsi"
                  bind:value={formData.deskripsi}
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  class:border-red-500={errors.deskripsi}
                  placeholder="Masukkan deskripsi mata pelajaran (opsional)"
               ></textarea>
               {#if errors.deskripsi}
                  <p class="mt-1 text-sm text-red-600">{errors.deskripsi}</p>
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
                  type="submit"
                  disabled={isSubmitting}
                  class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
               >
                  {isSubmitting ? 'Memperbarui...' : 'Perbarui'}
               </button>
            </div>
         </form>
      </div>
   </main>
</div>

<style>
   .header-enhanced {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
   }
</style>