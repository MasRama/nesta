<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   
   export let user;
   export let teacher;
   export let errors = {};
   
   let form = {
      nip: teacher.nip || '',
      nama: teacher.nama || '',
      email: teacher.email || '',
      password: '', // Password kosong untuk edit
      phone: teacher.phone || '',
      is_active: teacher.is_active !== undefined ? teacher.is_active : true,
      notes: teacher.notes || ''
   };
   
   let isLoading = false;
   

   
   function logout() {
      router.post('/logout');
   }
   
   async function handleSubmit() {
      if (isLoading) return;
      
      isLoading = true;
      
      // Jika password kosong, hapus dari form data
      const submitData = { ...form };
      if (!submitData.password) {
         delete submitData.password;
      }
      
      router.put(`/admin/teachers/${teacher.id}`, submitData, {
         onSuccess: () => {
            router.visit('/admin/teachers');
         },
         onError: (validationErrors) => {
            errors = validationErrors;
            console.log('Validation errors:', validationErrors);
         },
         onFinish: () => {
            isLoading = false;
         }
      });
   }
</script>

<svelte:head>
   <title>Edit Guru - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <!-- Modern Material Design Header -->
   <header class="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-xl relative overflow-hidden header-enhanced">
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
                  on:click={() => router.visit('/admin/teachers')}
                  class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
               >
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
               </button>
               <div>
                  <h1 class="text-2xl font-bold text-white">Edit Data Guru</h1>
                  <p class="text-blue-100 text-sm">Form Edit Data Guru - {teacher.nama}</p>
               </div>
            </div>
            <div class="flex items-center space-x-4">
               <div class="text-right">
                  <p class="text-white font-medium">{user.name}</p>
                  <p class="text-blue-100 text-sm">Administrator</p>
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
            <!-- NIP -->
            <div>
               <label for="nip" class="block text-sm font-medium text-gray-700 mb-2">
                  NIP (Nomor Induk Pegawai) *
               </label>
               <input
                  type="text"
                  id="nip"
                  bind:value={form.nip}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  class:border-red-500={errors.nip}
                  placeholder="Masukkan NIP guru"
                  required
               />
               {#if errors.nip}
                  <p class="mt-1 text-sm text-red-600">{errors.nip}</p>
               {/if}
            </div>

            <!-- Nama -->
            <div>
               <label for="nama" class="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
               </label>
               <input
                  type="text"
                  id="nama"
                  bind:value={form.nama}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  class:border-red-500={errors.nama}
                  placeholder="Masukkan nama lengkap guru"
                  required
               />
               {#if errors.nama}
                  <p class="mt-1 text-sm text-red-600">{errors.nama}</p>
               {/if}
            </div>

            <!-- Email -->
            <div>
               <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email *
               </label>
               <input
                  type="email"
                  id="email"
                  bind:value={form.email}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  class:border-red-500={errors.email}
                  placeholder="Masukkan email guru"
                  required
               />
               {#if errors.email}
                  <p class="mt-1 text-sm text-red-600">{errors.email}</p>
               {/if}
            </div>

            <!-- Password -->
            <div>
               <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                  Password
               </label>
               <input
                  type="password"
                  id="password"
                  bind:value={form.password}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  class:border-red-500={errors.password}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
               />
               <p class="mt-1 text-xs text-gray-500">Kosongkan field ini jika tidak ingin mengubah password</p>
               {#if errors.password}
                  <p class="mt-1 text-sm text-red-600">{errors.password}</p>
               {/if}
            </div>



            <!-- Phone -->
            <div>
               <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
               </label>
               <input
                  type="tel"
                  id="phone"
                  bind:value={form.phone}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  class:border-red-500={errors.phone}
                  placeholder="Masukkan nomor telepon (opsional)"
               />
               {#if errors.phone}
                  <p class="mt-1 text-sm text-red-600">{errors.phone}</p>
               {/if}
            </div>

            <!-- Status -->
            <div>
               <label class="block text-sm font-medium text-gray-700 mb-2">
                  Status
               </label>
               <div class="flex items-center space-x-4">
                  <label class="flex items-center">
                     <input
                        type="radio"
                        bind:group={form.is_active}
                        value={true}
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                     />
                     <span class="ml-2 text-sm text-gray-700">Aktif</span>
                  </label>
                  <label class="flex items-center">
                     <input
                        type="radio"
                        bind:group={form.is_active}
                        value={false}
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                     />
                     <span class="ml-2 text-sm text-gray-700">Tidak Aktif</span>
                  </label>
               </div>
            </div>

            <!-- Notes -->
            <div>
               <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
               </label>
               <textarea
                  id="notes"
                  bind:value={form.notes}
                  rows="3"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  class:border-red-500={errors.notes}
                  placeholder="Catatan tambahan (opsional)"
               ></textarea>
               {#if errors.notes}
                  <p class="mt-1 text-sm text-red-600">{errors.notes}</p>
               {/if}
            </div>

            <!-- Submit Buttons -->
            <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
               <button
                  type="button"
                  on:click={() => router.visit('/admin/teachers')}
                  class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
               >
                  Batal
               </button>
               <button
                  type="submit"
                  disabled={isLoading}
                  class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
               >
                  {#if isLoading}
                     <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Menyimpan...
                  {:else}
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                     </svg>
                     Update Guru
                  {/if}
               </button>
            </div>
         </form>
      </div>
   </main>
</div>

<style>
   /* Enhanced form styling */
   input:focus, select:focus, textarea:focus {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
   }
   
   .header-enhanced {
      background-attachment: fixed;
   }
</style>