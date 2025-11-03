<script>
   import { router } from '@inertiajs/svelte';
   import { toast } from 'svelte-sonner';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';

   export let classes = [];
   export let user;
   
   let currentSection = 'leaderboard';
   let isSubmitting = false;
   let lastSubmitTime = 0;
   let form = {
      class_name: '',
      points: 0,
      description: '',
      is_active: true
   };
   
   function submitForm(event) {
      // Prevent default form submission
      if (event) {
         event.preventDefault();
         event.stopPropagation();
      }
      
      // Debounce: Prevent multiple submissions within 2 seconds
      const now = Date.now();
      if (now - lastSubmitTime < 2000) {
         console.log('Submission too fast, skipping...', now - lastSubmitTime, 'ms');
         return;
      }
      
      if (isSubmitting) {
         console.log('Already submitting, skipping...');
         return; // Prevent double submission
      }
      
      console.log('Submitting form...', form);
      lastSubmitTime = now;
      isSubmitting = true;
      
      router.post('/admin/leaderboard', form, {
         preserveState: false,
         forceFormData: false,
         onBefore: () => {
            console.log('onBefore triggered');
            return true;
         },
         onStart: () => {
            console.log('onStart triggered');
         },
         onSuccess: () => {
            console.log('onSuccess triggered');
            toast.success('Entry leaderboard berhasil ditambahkan', {
               duration: 3000,
               position: 'top-right'
            });
         },
         onError: (errors) => {
            console.log('onError triggered:', errors);
            // Show error message
            if (errors && typeof errors === 'object') {
               const errorMsg = errors.error || Object.values(errors)[0] || 'Gagal menyimpan data';
               toast.error(errorMsg, {
                  duration: 5000,
                  position: 'top-right'
               });
            }
         },
         onFinish: () => {
            console.log('onFinish triggered');
            isSubmitting = false;
         }
      });
   }
   
   function cancel() {
      router.visit('/admin/leaderboard');
   }
</script>

<svelte:head>
   <title>Tambah Leaderboard - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-100">
   <AdminHeader {user} />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <div class="mb-8 fade-in-up">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Tambah Entry Leaderboard</h2>
            <p class="text-gray-600">Tambahkan kelas ke leaderboard dengan poin prestasi</p>
         </div>

         <!-- Form Card -->
         <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-yellow-200/30 fade-in-up stagger-1">
            <form on:submit|preventDefault={submitForm} class="space-y-6">
               <!-- Nama Kelas -->
               <div>
                  <label for="class_name" class="block mb-2 text-sm font-medium text-gray-900">
                     Nama Kelas <span class="text-red-500">*</span>
                  </label>
                  <select
                     bind:value={form.class_name}
                     required
                     id="class_name"
                     class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:border-yellow-600 focus:outline-none block w-full py-2.5 px-3"
                  >
                     <option value="">Pilih Kelas</option>
                     {#each classes as kelas}
                        <option value={kelas}>{kelas}</option>
                     {/each}
                  </select>
               </div>

               <!-- Poin -->
               <div>
                  <label for="points" class="block mb-2 text-sm font-medium text-gray-900">
                     Poin <span class="text-red-500">*</span>
                  </label>
                  <input
                     bind:value={form.points}
                     required
                     type="number"
                     id="points"
                     min="0"
                     class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:border-yellow-600 focus:outline-none block w-full py-2.5 px-3"
                     placeholder="100"
                  />
               </div>

               <!-- Deskripsi -->
               <div>
                  <label for="description" class="block mb-2 text-sm font-medium text-gray-900">
                     Deskripsi Pencapaian
                  </label>
                  <textarea
                     bind:value={form.description}
                     id="description"
                     rows="4"
                     class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:border-yellow-600 focus:outline-none block w-full py-2.5 px-3"
                     placeholder="Contoh: Juara 1 Lomba Kebersihan Tingkat Sekolah"
                  ></textarea>
               </div>

               <!-- Status -->
               <div class="flex items-center">
                  <input
                     bind:checked={form.is_active}
                     id="is_active"
                     type="checkbox"
                     class="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
                  />
                  <label for="is_active" class="ml-2 text-sm font-medium text-gray-900">
                     Tampilkan di leaderboard publik
                  </label>
               </div>

               <!-- Action Buttons -->
               <div class="flex justify-end space-x-4 pt-4">
                  <button
                     type="button"
                     on:click={cancel}
                     disabled={isSubmitting}
                     class="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     Batal
                  </button>
                  <button
                     type="submit"
                     disabled={isSubmitting}
                     class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                     {#if isSubmitting}
                        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      </div>
   </main>
</div>

<style>
   /* Fade In Animation */
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

   .fade-in-up {
      animation: fadeInUp 0.6s ease-out;
   }

   /* Stagger Animation */
   .stagger-1 { animation-delay: 0.1s; }
</style>
