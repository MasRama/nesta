<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';
   import { parentAPI, showToast, handleAPIError } from '../../../utils/api.js';
   
   export let user;
   export let errors = {};
   
   let form = {
      nama: '',
      email: '',
      password: '',
      phone: '',
      notes: ''
   };
   
   let isLoading = false;
   let isSubmitted = false; // Track if form has been submitted
   let currentSection = 'parents';
   
   async function handleSubmit(event) {
      // Prevent default and immediate disable
      event.preventDefault();

      if (isLoading || isSubmitted) return;

      // Immediately set both flags to prevent double submission
      isLoading = true;
      isSubmitted = true;
      errors = {};

      try {
         const loadingToast = showToast.loading('Menambahkan wali murid...');

         const response = await parentAPI.create(form);

         showToast.dismiss(loadingToast);
         showToast.success('Wali murid berhasil ditambahkan');
         
         // Redirect to edit page to add children
         const parentId = response.data.data.id;
         showToast.info('Silakan tambahkan anak di halaman edit');
         
         setTimeout(() => {
            router.visit(`/admin/parents/${parentId}/edit`);
         }, 1500);

      } catch (error) {
         console.error('Error creating parent:', error);

         const errorResult = handleAPIError(error, 'Gagal menambahkan wali murid');

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
      router.visit('/admin/parents');
   }
</script>

<svelte:head>
   <title>Tambah Wali Murid - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <AdminHeader {user} title="Tambah Wali Murid" subtitle="Portal Manajemen NETSA" />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <!-- Header -->
         <div class="mb-8 fade-in-up">
            <div class="flex items-center gap-4 mb-4">
               <button
                  on:click={goBack}
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
               >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  Kembali
               </button>
            </div>
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Tambah Wali Murid Baru</h2>
            <p class="text-gray-600">Isi informasi dasar wali murid, setelah disimpan Anda dapat menambahkan anak</p>
         </div>

         <form on:submit={handleSubmit} class="space-y-6">
            <!-- Basic Information -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 fade-in-up" style="animation-delay: 0.1s">
               <div class="px-6 py-4 border-b border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900">Informasi Dasar</h3>
               </div>
               <div class="p-6 space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label for="nama" class="block text-sm font-medium text-gray-700 mb-2">
                           Nama Lengkap <span class="text-red-500">*</span>
                        </label>
                        <input
                           type="text"
                           id="nama"
                           bind:value={form.nama}
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                           class:border-red-500={errors.nama}
                           placeholder="Masukkan nama lengkap"
                        />
                        {#if errors.nama}
                           <p class="mt-1 text-sm text-red-600">{errors.nama}</p>
                        {/if}
                     </div>

                     <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                           Email <span class="text-red-500">*</span>
                        </label>
                        <input
                           type="email"
                           id="email"
                           bind:value={form.email}
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                           class:border-red-500={errors.email}
                           placeholder="contoh@email.com"
                        />
                        {#if errors.email}
                           <p class="mt-1 text-sm text-red-600">{errors.email}</p>
                        {/if}
                     </div>

                     <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                           Password <span class="text-red-500">*</span>
                        </label>
                        <input
                           type="password"
                           id="password"
                           bind:value={form.password}
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                           class:border-red-500={errors.password}
                           placeholder="Minimal 6 karakter"
                        />
                        {#if errors.password}
                           <p class="mt-1 text-sm text-red-600">{errors.password}</p>
                        {/if}
                     </div>

                     <div>
                        <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                           Nomor Telepon
                        </label>
                        <input
                           type="tel"
                           id="phone"
                           bind:value={form.phone}
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                           placeholder="08xxxxxxxxxx"
                        />
                     </div>
                  </div>

                  <div>
                     <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                        Catatan
                     </label>
                     <textarea
                        id="notes"
                        bind:value={form.notes}
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        placeholder="Catatan tambahan (opsional)"
                     ></textarea>
                  </div>
               </div>
            </div>

            <!-- Info Box -->
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 fade-in-up" style="animation-delay: 0.2s">
               <div class="flex">
                  <div class="flex-shrink-0">
                     <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                     </svg>
                  </div>
                  <div class="ml-3">
                     <h3 class="text-sm font-medium text-blue-800">Tentang Manajemen Anak</h3>
                     <p class="mt-1 text-sm text-blue-700">
                        Setelah menyimpan data wali murid, Anda akan diarahkan ke halaman edit untuk menambahkan anak dengan mencari NIPD siswa.
                     </p>
                  </div>
               </div>
            </div>

            <!-- Submit Buttons -->
            <div class="flex justify-end gap-4 fade-in-up" style="animation-delay: 0.3s">
               <button
                  type="button"
                  on:click={goBack}
                  class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
               >
                  Batal
               </button>
               <button
                  type="submit"
                  disabled={isLoading || isSubmitted}
                  class="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
               >
                  {#if isLoading}
                     <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Menyimpan...
                  {:else}
                     Simpan Wali Murid
                  {/if}
               </button>
            </div>
         </form>
      </div>
   </main>
</div>

<style>
   .fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
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
</style>
