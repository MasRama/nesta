<script>
   import { router } from '@inertiajs/svelte';
   import { subjectAPI, showToast, handleAPIError } from '../../../utils/api.js';

   export let user;
   export let errors = {};

   let form = {
      kode: '',
      nama: '',
      deskripsi: ''
   };

   let isLoading = false;
   let isSubmitted = false; // Track if form has been submitted

   async function handleSubmit(event) {
      // Prevent default and immediate disable
      event.preventDefault();

      if (isLoading || isSubmitted) return;

      // Immediately set both flags to prevent double submission
      isLoading = true;
      isSubmitted = true;
      errors = {};

      try {
         const loadingToast = showToast.loading('Menambahkan mata pelajaran...');

         await subjectAPI.create(form);

         showToast.dismiss(loadingToast);
         showToast.success('Mata pelajaran berhasil ditambahkan');

         // Redirect to subjects list after successful creation
         router.visit('/admin/subjects');

      } catch (error) {
         console.error('Error creating subject:', error);

         const errorResult = handleAPIError(error, 'Gagal menambahkan mata pelajaran');

         if (errorResult.type === 'validation' && errorResult.errors) {
            errors = errorResult.errors;
         }

         // Reset submitted flag on error so user can retry
         isSubmitted = false;
      } finally {
         isLoading = false;
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
   <title>Tambah Mata Pelajaran - NETSA Admin</title>
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
                  <h1 class="text-2xl font-bold text-white">Tambah Mata Pelajaran Baru</h1>
                  <p class="text-red-100 text-sm">Form Input Data Mata Pelajaran</p>
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
         <form on:submit={handleSubmit} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <!-- Kode Mata Pelajaran -->
               <div>
                  <label for="kode" class="block text-sm font-medium text-gray-700 mb-2">
                     Kode Mata Pelajaran <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="kode"
                     bind:value={form.kode}
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
                     bind:value={form.nama}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.nama}
                     placeholder="Masukkan nama mata pelajaran"
                     required
                  />
                  {#if errors.nama}
                     <p class="mt-1 text-sm text-red-600">{errors.nama}</p>
                  {/if}
               </div>

               <!-- Info Jam Per Minggu -->
               <div class="md:col-span-2">
                  <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                     <div class="flex items-start">
                        <svg class="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                           <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                        <div>
                           <h4 class="text-sm font-medium text-blue-800">Informasi Jam Pelajaran</h4>
                           <p class="text-sm text-blue-700 mt-1">Jam per minggu akan diatur saat menugaskan mata pelajaran ke kelas. Setiap kelas dapat memiliki jam yang berbeda untuk mata pelajaran yang sama.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Deskripsi -->
            <div>
               <label for="deskripsi" class="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
               </label>
               <textarea
                  id="deskripsi"
                  bind:value={form.deskripsi}
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
                  disabled={isLoading || isSubmitted}
                  class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
               >
                  {#if isLoading}
                     <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <span>Menyimpan...</span>
                  {:else}
                     <span>Simpan</span>
                  {/if}
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