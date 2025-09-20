<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';

   export let user;

   let formData = {
      nipd: '',
      nama: '',
      kelas: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: '',
      agama: ''
   };

   let errors = {};
   let isSubmitting = false;
   let currentSection = 'students';
   
   const agamaOptions = [
      'Islam',
      'Kristen',
      'Katolik',
      'Hindu',
      'Buddha',
      'Konghucu'
   ];
   
   async function handleSubmit() {
      if (isSubmitting) return;
      
      isSubmitting = true;
      errors = {};
      
      try {
         const response = await fetch('/admin/students', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'X-Inertia': 'true'
            },
            body: JSON.stringify(formData)
         });
         
         const result = await response.json();
         
         if (response.ok) {
            router.visit('/admin/students', {
               onSuccess: () => {
                  alert('Siswa berhasil ditambahkan!');
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
         console.error('Error creating student:', error);
         alert('Terjadi kesalahan saat menyimpan data');
      } finally {
         isSubmitting = false;
      }
   }
   
   function goBack() {
      router.visit('/admin/students');
   }
</script>

<svelte:head>
   <title>Tambah Siswa - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <AdminHeader {user} title="Tambah Siswa Baru" subtitle="Portal Manajemen NETSA" />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-sm p-6">
         <form on:submit|preventDefault={handleSubmit} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <!-- NIPD -->
               <div>
                  <label for="nipd" class="block text-sm font-medium text-gray-700 mb-2">
                     NIPD <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="nipd"
                     bind:value={formData.nipd}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.nipd}
                     placeholder="Masukkan NIPD"
                     required
                  />
                  {#if errors.nipd}
                     <p class="mt-1 text-sm text-red-600">{errors.nipd}</p>
                  {/if}
               </div>

               <!-- Nama -->
               <div>
                  <label for="nama" class="block text-sm font-medium text-gray-700 mb-2">
                     Nama Lengkap <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="nama"
                     bind:value={formData.nama}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.nama}
                     placeholder="Masukkan nama lengkap"
                     required
                  />
                  {#if errors.nama}
                     <p class="mt-1 text-sm text-red-600">{errors.nama}</p>
                  {/if}
               </div>

               <!-- Kelas -->
               <div>
                  <label for="kelas" class="block text-sm font-medium text-gray-700 mb-2">
                     Kelas <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="kelas"
                     bind:value={formData.kelas}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.kelas}
                     placeholder="Contoh: 7A, 8B"
                     required
                  />
                  {#if errors.kelas}
                     <p class="mt-1 text-sm text-red-600">{errors.kelas}</p>
                  {/if}
               </div>

               <!-- Tempat Lahir -->
               <div>
                  <label for="tempat_lahir" class="block text-sm font-medium text-gray-700 mb-2">
                     Tempat Lahir <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="text"
                     id="tempat_lahir"
                     bind:value={formData.tempat_lahir}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.tempat_lahir}
                     placeholder="Masukkan tempat lahir"
                     required
                  />
                  {#if errors.tempat_lahir}
                     <p class="mt-1 text-sm text-red-600">{errors.tempat_lahir}</p>
                  {/if}
               </div>

               <!-- Tanggal Lahir -->
               <div>
                  <label for="tanggal_lahir" class="block text-sm font-medium text-gray-700 mb-2">
                     Tanggal Lahir <span class="text-red-500">*</span>
                  </label>
                  <input
                     type="date"
                     id="tanggal_lahir"
                     bind:value={formData.tanggal_lahir}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.tanggal_lahir}
                     required
                  />
                  {#if errors.tanggal_lahir}
                     <p class="mt-1 text-sm text-red-600">{errors.tanggal_lahir}</p>
                  {/if}
               </div>

               <!-- Jenis Kelamin -->
               <div>
                  <label for="jenis_kelamin" class="block text-sm font-medium text-gray-700 mb-2">
                     Jenis Kelamin <span class="text-red-500">*</span>
                  </label>
                  <select
                     id="jenis_kelamin"
                     bind:value={formData.jenis_kelamin}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.jenis_kelamin}
                     required
                  >
                     <option value="">Pilih jenis kelamin</option>
                     <option value="Laki - Laki">Laki - Laki</option>
                     <option value="Perempuan">Perempuan</option>
                  </select>
                  {#if errors.jenis_kelamin}
                     <p class="mt-1 text-sm text-red-600">{errors.jenis_kelamin}</p>
                  {/if}
               </div>

               <!-- Agama -->
               <div>
                  <label for="agama" class="block text-sm font-medium text-gray-700 mb-2">
                     Agama <span class="text-red-500">*</span>
                  </label>
                  <select
                     id="agama"
                     bind:value={formData.agama}
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     class:border-red-500={errors.agama}
                     required
                  >
                     <option value="">Pilih agama</option>
                     {#each agamaOptions as agama}
                        <option value={agama}>{agama}</option>
                     {/each}
                  </select>
                  {#if errors.agama}
                     <p class="mt-1 text-sm text-red-600">{errors.agama}</p>
                  {/if}
               </div>
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
               </button>
            </div>
         </form>
      </div>
   </main>
</div>
